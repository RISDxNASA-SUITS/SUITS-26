package SUITS2026Backend.RoverIntegration

import SUITS2026Backend.TssIntegration.TssConfig
import SUITS2026Backend.db.Poi
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.javalin.Javalin
import io.javalin.http.Context
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import org.jetbrains.exposed.sql.transactions.transaction
data class LidarReturn(val data: List<Float>)


object RoverTssController {
    private const val ROVER_JSON_CMD = 0
    private const val BRAKE_CMD = 1107
    private const val THROTTLE_CMD = 1109
    private const val STEERING_CMD = 1110
    private const val HEADLIGHT_CMD = 1106
    val bgScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val objectMapper = ObjectMapper()

    data class LiveRoverSnapshot(
        val connected: Boolean,
        val error: String?,
        val telemetry: RoverTelemetry,
        val lidar: List<Float>,
    )

    data class Position(val x: Float, val y: Float)

    @JvmStatic
    fun setup(app: Javalin) {
        val channel = Channel<Position>()
        println("WE ARE SETTING UP")
        bgScope.launch {
            var lastXY = Position(1f, 0f)

            while (true) {
                val telem = getTelemetry()
                val newPos = Position(telem.currentPosX, telem.currentPosY)
                println(newPos)
                if (newPos != lastXY) {
                    channel.send(newPos)
                    lastXY = newPos
                }
                // TODO: Adjust this value
                delay(10_000)
            }
        }

        bgScope.launch {
            while (true) {
                val pos = channel.receive()
                println("WE HVAE RECEVIED $pos")
                transaction {
                    Poi.new {
                        name = "breadCrumb"
                        x = pos.x.toDouble()
                        y = pos.y.toDouble()
                        tags = ""
                        description = ""
                        type = "breadCrumb"
                    }
                }
            }
        }
        app.get("/lidar", this::getLidar)
        app.post("/brakes", this::postBrakes)
        app.post("/throttle", this::postThrottle)
        app.post("/steering", this::postSteering)
        app.get("/telemetry", this::getTelem)
        app.post("/headlights", this::postHeadlights)
    }

    private fun makeWritePacket(commandNumber: Int, input: Float): ByteArray {
        val buffer = ByteBuffer.allocate(12)
        buffer.order(ByteOrder.BIG_ENDIAN)
        val timeStamp = (System.currentTimeMillis() / 1000).toInt()
        buffer.putInt(timeStamp)
        buffer.putInt(commandNumber)
        buffer.putFloat(input)
        return buffer.array()
    }

    private fun makeReadPacket(commandNumber: Int): ByteArray {
        val buffer = ByteBuffer.allocate(8)
        buffer.order(ByteOrder.BIG_ENDIAN)
        val timeStamp = (System.currentTimeMillis() / 1000).toInt()
        buffer.putInt(timeStamp)
        buffer.putInt(commandNumber)
        return buffer.array()
    }

    // Legacy compatibility wrappers used by TSS adapter routes
    fun makeSendCommandPacket(commandNumber: Int, input: Float): ByteBuffer {
        return ByteBuffer.wrap(makeWritePacket(commandNumber, input)).order(ByteOrder.BIG_ENDIAN)
    }

    fun makeSendLidarPacket(commandNumber: Int): ByteBuffer {
        return ByteBuffer.wrap(makeReadPacket(commandNumber)).order(ByteOrder.BIG_ENDIAN)
    }

    fun <T> sendMessage(sendPacket: ByteBuffer, recvBuffer: ByteBuffer, callBack: (ByteBuffer) -> T): T {
        val address = InetAddress.getByName(TssConfig.host)

        return DatagramSocket().use { socket ->
            socket.soTimeout = TssConfig.socketTimeoutMs
            val bytes = sendPacket.array()
            val packet = DatagramPacket(bytes, bytes.size, address, TssConfig.port)
            socket.send(packet)

            val recvPacket = DatagramPacket(recvBuffer.array(), recvBuffer.array().size)
            socket.receive(recvPacket)

            val toCallback = ByteBuffer.wrap(recvPacket.data, 0, recvPacket.length).order(ByteOrder.BIG_ENDIAN)
            callBack(toCallback)
        }
    }

    private fun sendWriteCommand(command: Int, value: Float): Boolean {
        val address = InetAddress.getByName(TssConfig.host)

        return DatagramSocket().use { socket ->
            socket.soTimeout = TssConfig.socketTimeoutMs
            val bytes = makeWritePacket(command, value)
            val packet = DatagramPacket(bytes, bytes.size, address, TssConfig.port)
            socket.send(packet)

            val ackBytes = ByteArray(4)
            val ackPacket = DatagramPacket(ackBytes, ackBytes.size)
            socket.receive(ackPacket)
            ackPacket.data.take(ackPacket.length).any { it.toInt() != 0 }
        }
    }

    private fun fetchRoverJson(): JsonNode? {
        val address = InetAddress.getByName(TssConfig.host)

        return try {
            DatagramSocket().use { socket ->
                socket.soTimeout = TssConfig.socketTimeoutMs
                val bytes = makeReadPacket(ROVER_JSON_CMD)
                val packet = DatagramPacket(bytes, bytes.size, address, TssConfig.port)
                socket.send(packet)

                val recvBuffer = ByteArray(8192)
                val recvPacket = DatagramPacket(recvBuffer, recvBuffer.size)
                socket.receive(recvPacket)

                val jsonText = String(recvPacket.data, 0, recvPacket.length, Charsets.UTF_8)
                objectMapper.readTree(jsonText)
            }
        } catch (e: Exception) {
            println("Failed to fetch ROVER JSON from TSS: ${e.message}")
            null
        }
    }

    private fun lidarFromRoverJson(root: JsonNode?): List<Float> {
        val telemetryNode = root?.path("pr_telemetry") ?: return emptyList()
        val lidarNode = telemetryNode.path("lidar")
        if (!lidarNode.isArray) return emptyList()
        return lidarNode.map { it.asDouble().toFloat() }.take(17)
    }

    /** Single UDP read for live stream / broadcaster (avoids duplicate TSS polls). */
    fun getLiveRoverSnapshot(): LiveRoverSnapshot {
        return try {
            val root = fetchRoverJson()
            if (root == null) {
                LiveRoverSnapshot(
                    connected = false,
                    error = "TSS unreachable at ${TssConfig.host}:${TssConfig.port}",
                    telemetry = RoverTelemetry.fromRoverJson(null),
                    lidar = emptyList(),
                )
            } else {
                LiveRoverSnapshot(
                    connected = true,
                    error = null,
                    telemetry = RoverTelemetry.fromRoverJson(root),
                    lidar = lidarFromRoverJson(root),
                )
            }
        } catch (e: Exception) {
            LiveRoverSnapshot(
                connected = false,
                error = e.message ?: e.javaClass.simpleName,
                telemetry = RoverTelemetry.fromRoverJson(null),
                lidar = emptyList(),
            )
        }
    }

    fun getLidar(): List<Float> = getLiveRoverSnapshot().lidar

    fun getTelemetry(): RoverTelemetry = getLiveRoverSnapshot().telemetry

    fun setBrakes(brakeInput: Float): Int {
        return if (sendWriteCommand(BRAKE_CMD, brakeInput)) 1 else 0
    }

    fun setThrottle(throttleInput: Float): Int {
        return if (sendWriteCommand(THROTTLE_CMD, throttleInput)) 1 else 0
    }

    fun setSteering(input: Float): Float {
        return if (sendWriteCommand(STEERING_CMD, input)) 1.0f else 0.0f
    }

    fun setHeadlights(input: Float): Float {
        return if (sendWriteCommand(HEADLIGHT_CMD, input)) 1.0f else 0.0f
    }

    // HTTP endpoint handlers
    private fun getLidar(ctx: Context) {
        val lidar = getLidar()
        ctx.json(LidarReturn(lidar))
    }

    private fun postBrakes(ctx: Context) {
        val brakes = setBrakes(ctx.bodyAsClass(BrakesRequest::class.java).brakeInput)
        ctx.json(brakes)
    }

    private fun postThrottle(ctx: Context) {
        val throttle = setThrottle(ctx.bodyAsClass(ThrottleRequest::class.java).throttleInput)
        ctx.json(throttle)
    }

    private fun postSteering(ctx: Context) {
        val steering = setSteering(ctx.bodyAsClass(SteeringRequest::class.java).steeringInput)
        ctx.json(steering)
    }

    private fun getTelem(ctx: Context) {
        ctx.json(getTelemetry())
    }

    private fun postHeadlights(ctx: Context) {
        val headlights = setHeadlights(ctx.bodyAsClass(HeadlightsRequest::class.java).input)
        ctx.json(headlights)
    }
}

data class BrakesRequest(val brakeInput: Float)
data class ThrottleRequest(val throttleInput: Float)
data class SteeringRequest(val steeringInput: Float)
data class HeadlightsRequest(val input: Float)

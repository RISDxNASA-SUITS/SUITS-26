package SUITS2025Backend.PythonCommunication

import SUITS2025Backend.db.Poi
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


object PythonCommunicationHandler {
    private const val ROVER_JSON_CMD = 0
    private const val BRAKE_CMD = 1107
    private const val THROTTLE_CMD = 1109
    private const val STEERING_CMD = 1110
    private const val HEADLIGHT_CMD = 1106
    val bgScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val objectMapper = ObjectMapper()
    private val tssHost: String
        get() = System.getenv("TSS_HOST") ?: "127.0.0.1"
    private val tssPort: Int
        get() = (System.getenv("TSS_UDP_PORT") ?: System.getenv("PORT") ?: "14141").toInt()
    private val socketTimeoutMs: Int
        get() = (System.getenv("TSS_TIMEOUT_MS") ?: "1500").toInt()

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

    // Legacy compatibility wrappers used by tssComms.kt
    fun makeSendCommandPacket(commandNumber: Int, input: Float): ByteBuffer {
        return ByteBuffer.wrap(makeWritePacket(commandNumber, input)).order(ByteOrder.BIG_ENDIAN)
    }

    fun makeSendLidarPacket(commandNumber: Int): ByteBuffer {
        return ByteBuffer.wrap(makeReadPacket(commandNumber)).order(ByteOrder.BIG_ENDIAN)
    }

    fun <T> sendMessage(sendPacket: ByteBuffer, recvBuffer: ByteBuffer, callBack: (ByteBuffer) -> T): T {
        val address = InetAddress.getByName(tssHost)

        return DatagramSocket().use { socket ->
            socket.soTimeout = socketTimeoutMs
            val bytes = sendPacket.array()
            val packet = DatagramPacket(bytes, bytes.size, address, tssPort)
            socket.send(packet)

            val recvPacket = DatagramPacket(recvBuffer.array(), recvBuffer.array().size)
            socket.receive(recvPacket)

            val toCallback = ByteBuffer.wrap(recvPacket.data, 0, recvPacket.length).order(ByteOrder.BIG_ENDIAN)
            callBack(toCallback)
        }
    }

    private fun sendWriteCommand(command: Int, value: Float): Boolean {
        val address = InetAddress.getByName(tssHost)

        return DatagramSocket().use { socket ->
            socket.soTimeout = socketTimeoutMs
            val bytes = makeWritePacket(command, value)
            val packet = DatagramPacket(bytes, bytes.size, address, tssPort)
            socket.send(packet)

            val ackBytes = ByteArray(4)
            val ackPacket = DatagramPacket(ackBytes, ackBytes.size)
            socket.receive(ackPacket)
            ackPacket.data.take(ackPacket.length).any { it.toInt() != 0 }
        }
    }

    private fun fetchRoverJson(): JsonNode? {
        val address = InetAddress.getByName(tssHost)

        return try {
            DatagramSocket().use { socket ->
                socket.soTimeout = socketTimeoutMs
                val bytes = makeReadPacket(ROVER_JSON_CMD)
                val packet = DatagramPacket(bytes, bytes.size, address, tssPort)
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

    fun getLidar(): List<Float> {
        val telemetryNode = fetchRoverJson()?.path("pr_telemetry") ?: return emptyList()
        val lidarNode = telemetryNode.path("lidar")
        if (!lidarNode.isArray) return emptyList()
        return lidarNode.map { it.asDouble().toFloat() }.take(17)
    }

    fun getTelemetry(): PrTelemetry {
        return PrTelemetry.fromRoverJson(fetchRoverJson())
    }

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

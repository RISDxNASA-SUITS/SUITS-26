package SUITS2026Backend.TssIntegration

import SUITS2026Backend.RoverIntegration.RoverTssController
import SUITS2026Backend.RoverIntegration.RoverTelemetry
import com.fasterxml.jackson.databind.ObjectMapper
import io.javalin.Javalin
import io.javalin.websocket.WsConnectContext
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class LiveTelemetryPayload(
    val timestamp: Long,
    val tssHost: String,
    val tssConnected: Boolean,
    val error: String?,
    val rover: RoverTelemetry?,
    val lidar: List<Float>?,
)

object TelemetryBroadcaster {
    private val clients = ConcurrentHashMap<String, WsConnectContext>()
    private lateinit var mapper: ObjectMapper
    @Volatile
    private var latestJson: String? = null

    @JvmStatic
    fun setup(app: Javalin, objectMapper: ObjectMapper) {
        mapper = objectMapper

        app.ws("/telemetry/live") { ws ->
            ws.onConnect { ctx ->
                clients[ctx.sessionId()] = ctx
                latestJson?.let { ctx.send(it) }
            }
            ws.onClose { ctx ->
                clients.remove(ctx.sessionId())
            }
            ws.onError { ctx ->
                clients.remove(ctx.sessionId())
            }
        }

        RoverTssController.bgScope.launch {
            while (true) {
                if (clients.isNotEmpty()) {
                    broadcastTick()
                }
                delay(TssConfig.telemetryPollIntervalMs)
            }
        }
    }

    private fun broadcastTick() {
        val snapshot = RoverTssController.getLiveRoverSnapshot()
        val payload = LiveTelemetryPayload(
            timestamp = System.currentTimeMillis(),
            tssHost = TssConfig.host,
            tssConnected = snapshot.connected,
            error = snapshot.error,
            rover = snapshot.telemetry,
            lidar = snapshot.lidar,
        )

        val json = try {
            mapper.writeValueAsString(payload)
        } catch (e: Exception) {
            println("Failed to serialize live telemetry: ${e.message}")
            return
        }

        latestJson = json
        val dead = mutableListOf<String>()
        for ((sessionId, client) in clients) {
            try {
                client.send(json)
            } catch (e: Exception) {
                dead.add(sessionId)
            }
        }
        dead.forEach { clients.remove(it) }
    }
}

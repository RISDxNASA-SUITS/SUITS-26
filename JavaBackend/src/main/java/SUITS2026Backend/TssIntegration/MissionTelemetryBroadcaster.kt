package SUITS2026Backend.TssIntegration

import SUITS2026Backend.RoverIntegration.LidarReturn
import SUITS2026Backend.RoverIntegration.RoverTssController
import SUITS2026Backend.RoverIntegration.RoverTelemetry
import com.fasterxml.jackson.databind.ObjectMapper
import io.javalin.Javalin
import io.javalin.websocket.WsConnectContext
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Full mission bundle for AIA (matches Python LiveTelemetryBundle). */
data class MissionLivePayload(
    val polled_at_unix: Double,
    val ev1: TelemetryState,
    val ev2: TelemetryState,
    val dcu1: DcuState,
    val dcu2: DcuState,
    val errors: ErrorState,
    val imu1: IMUState,
    val imu2: IMUState,
    val uia: UIAState,
    val eva_states: MissionState,
    val rover: RoverTelemetry,
    val lidar: LidarReturn,
    val ltv: LtvState,
    val ltv_errors: LtvErrorsState,
    val hub_error: String? = null,
)

object MissionTelemetryBroadcaster {
    private val clients = ConcurrentHashMap<String, WsConnectContext>()
    private lateinit var mapper: ObjectMapper
    @Volatile
    private var latestJson: String? = null

    @JvmStatic
    fun setup(app: Javalin, objectMapper: ObjectMapper) {
        mapper = objectMapper

        app.ws("/telemetry/mission/live") { ws ->
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

    fun buildMissionPayload(): MissionLivePayload {
        val errors = mutableListOf<String>()
        val evaJson = EvaTssComms.fetchEvaJsonForMission()
        if (evaJson == null) {
            errors.add("EVA.json unavailable")
        }
        val eva = EvaTssComms.assembleEvaMissionSlice(evaJson)

        val ltvJson = LtvTssComms.fetchLtvJsonForMission()
        val ltvErrorsJson = LtvTssComms.fetchLtvErrorsJsonForMission()
        if (ltvJson == null) errors.add("LTV.json unavailable")
        if (ltvErrorsJson == null) errors.add("LTV_ERRORS.json unavailable")
        val ltvSlice = LtvTssComms.assembleLtvSlice(ltvJson, ltvErrorsJson)

        val roverSnapshot = RoverTssController.getLiveRoverSnapshot()
        if (!roverSnapshot.connected) {
            roverSnapshot.error?.let { errors.add(it) }
        }

        return MissionLivePayload(
            polled_at_unix = System.currentTimeMillis() / 1000.0,
            ev1 = eva.ev1,
            ev2 = eva.ev2,
            dcu1 = eva.dcu1,
            dcu2 = eva.dcu2,
            errors = eva.errors,
            imu1 = eva.imu1,
            imu2 = eva.imu2,
            uia = eva.uia,
            eva_states = eva.evaStates,
            rover = roverSnapshot.telemetry,
            lidar = LidarReturn(roverSnapshot.lidar),
            ltv = ltvSlice.ltv,
            ltv_errors = ltvSlice.ltvErrors,
            hub_error = errors.joinToString("; ").ifEmpty { null },
        )
    }

    private fun broadcastTick() {
        val payload = buildMissionPayload()
        val json = try {
            mapper.writeValueAsString(payload)
        } catch (e: Exception) {
            println("Failed to serialize mission live telemetry: ${e.message}")
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

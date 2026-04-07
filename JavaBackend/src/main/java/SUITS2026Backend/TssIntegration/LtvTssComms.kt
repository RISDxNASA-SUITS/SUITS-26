package SUITS2026Backend.TssIntegration

import SUITS2026Backend.RoverIntegration.RoverTssController
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.javalin.Javalin
import io.javalin.http.Context
import java.nio.ByteBuffer
import java.nio.ByteOrder

data class LtvLocationState(
    val last_known_x: Float,
    val last_known_y: Float
)

data class LtvSignalState(
    val strength: Float,
    val ping_requested: Boolean,
    val ping_unlimited_requested: Boolean
)

data class LtvState(
    val location: LtvLocationState,
    val signal: LtvSignalState
)

data class LtvErrorProcedureState(
    val code: String,
    val description: String,
    val needs_resolved: Boolean,
    val procedures: List<String>
)

data class LtvErrorsState(
    val error_procedures: List<LtvErrorProcedureState>
)

object LtvTssComms {
    private const val LTV_JSON_CMD = 2
    private const val LTV_ERRORS_JSON_CMD = 3
    private val tssKt = RoverTssController
    private val objectMapper = ObjectMapper()

    @JvmStatic
    fun setup(app: Javalin) {
        app.get("/ltv", this::getLtvState)
        app.get("/ltv-errors", this::getLtvErrorsState)
    }

    private fun fetchJson(commandNumber: Int, label: String): JsonNode? {
        val packet = tssKt.makeSendLidarPacket(commandNumber)
        val recvBuffer = ByteBuffer.allocate(16384)
        recvBuffer.order(ByteOrder.BIG_ENDIAN)

        return try {
            tssKt.sendMessage(packet, recvBuffer) { buff ->
                val bytes = ByteArray(buff.remaining())
                buff.get(bytes)
                objectMapper.readTree(String(bytes, Charsets.UTF_8))
            }
        } catch (e: Exception) {
            println("Failed to fetch $label from TSS: ${e.message}")
            null
        }
    }

    private fun JsonNode.bool(path: String, default: Boolean = false): Boolean {
        var node = this
        for (part in path.split('.')) {
            node = node.path(part)
            if (node.isMissingNode) return default
        }
        return when {
            node.isBoolean -> node.asBoolean()
            node.isInt || node.isLong -> node.asInt() != 0
            node.isTextual -> node.asText().equals("true", ignoreCase = true)
            else -> default
        }
    }

    private fun JsonNode.float(path: String, default: Float = 0f): Float {
        var node = this
        for (part in path.split('.')) {
            node = node.path(part)
            if (node.isMissingNode) return default
        }
        return node.asDouble(default.toDouble()).toFloat()
    }

    fun getLtvState(ctx: Context) {
        val ltvJson = fetchJson(LTV_JSON_CMD, "LTV.json") ?: run {
            ctx.status(502).result("Failed to fetch LTV.json")
            return
        }

        ctx.json(
            LtvState(
                location = LtvLocationState(
                    last_known_x = ltvJson.float("location.last_known_x"),
                    last_known_y = ltvJson.float("location.last_known_y")
                ),
                signal = LtvSignalState(
                    strength = ltvJson.float("signal.strength"),
                    ping_requested = ltvJson.bool("signal.ping_requested"),
                    ping_unlimited_requested = ltvJson.bool("signal.ping_unlimited_requested")
                )
            )
        )
    }

    fun getLtvErrorsState(ctx: Context) {
        val ltvErrorsJson = fetchJson(LTV_ERRORS_JSON_CMD, "LTV_ERRORS.json") ?: run {
            ctx.status(502).result("Failed to fetch LTV_ERRORS.json")
            return
        }

        val procedures = ltvErrorsJson.path("error_procedures")
            .takeIf { it.isArray }
            ?.map { procedure ->
                LtvErrorProcedureState(
                    code = procedure.path("code").asText(""),
                    description = procedure.path("description").asText(""),
                    needs_resolved = procedure.path("needs_resolved").asBoolean(false),
                    procedures = procedure.path("procedures")
                        .takeIf { it.isArray }
                        ?.map { step -> step.asText("") }
                        ?: emptyList()
                )
            }
            ?: emptyList()

        ctx.json(LtvErrorsState(error_procedures = procedures))
    }
}

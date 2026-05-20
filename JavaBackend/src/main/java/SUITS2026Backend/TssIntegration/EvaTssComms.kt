package SUITS2026Backend.TssIntegration

import SUITS2026Backend.RoverIntegration.RoverTssController
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.javalin.Javalin
import io.javalin.http.Context
import java.nio.ByteBuffer
import java.nio.ByteOrder

enum class Battery { LOCAL, UMB }
enum class Oxygen { SEC, PRI }
enum class Comms { B, A }
enum class Fan { SEC, PRI }
enum class Pump { CLOSE, OPEN }
enum class CO2 { B, A }

data class DcuState(
    val battery: Battery,
    val oxygen: Oxygen,
    val comms: Comms,
    val fan: Fan,
    val pump: Pump,
    val co2: CO2
)

data class ErrorState(
    val fan_error: Boolean,
    val oxy_error: Boolean,
    val pump_error: Boolean
)

data class IMUState(
    val posx: Float,
    val posy: Float,
    val heading: Float
)

data class UIAState(
    val eva1_power: Boolean,
    val eva1_oxy: Boolean,
    val eva1_water_supply: Boolean,
    val eva1_water_waste: Boolean,
    val eva2_power: Boolean,
    val eva2_oxy: Boolean,
    val eva2_water_supply: Boolean,
    val eva2_water_waste: Boolean,
    val oxy_vent: Boolean,
    val depress: Boolean
)

data class TelemetryState(
    val time: Float,
    val batt_time_left: Float,
    val oxy_pri_storage: Float,
    val oxy_sec_storage: Float,
    val oxy_pri_pressure: Float,
    val oxy_sec_pressure: Float,
    val oxy_time_left: Int,
    val heart_rate: Float,
    val oxy_consumption: Float,
    val co2_production: Float,
    val suit_pressure_oxy: Float,
    val suit_pressure_co2: Float,
    val suit_pressure_other: Float,
    val suit_pressure_total: Float,
    val fan_pri_rpm: Float,
    val fan_sec_rpm: Float,
    val helmet_pressure_co2: Float,
    val scrubber_a_co2_storage: Float,
    val scrubber_b_co2_storage: Float,
    val temperature: Float,
    val coolant_ml: Float,
    val coolant_gas_pressure: Float,
    val coolant_liquid_pressure: Float
)

data class MissionState(
    val started: Boolean,
    val paused: Boolean,
    val completed: Boolean,
    val total_time: Int,
    val uia_started: Boolean,
    val uia_completed: Boolean,
    val uia_time: Int,
    val dcu_started: Boolean,
    val dcu_completed: Boolean,
    val dcu_time: Int,
    val rover_started: Boolean,
    val rover_completed: Boolean,
    val rover_time: Int,
    val spec_started: Boolean,
    val spec_completed: Boolean,
    val spec_time: Int
)

data class EvaMissionSlice(
    val ev1: TelemetryState,
    val ev2: TelemetryState,
    val dcu1: DcuState,
    val dcu2: DcuState,
    val errors: ErrorState,
    val imu1: IMUState,
    val imu2: IMUState,
    val uia: UIAState,
    val evaStates: MissionState,
)

object EvaTssComms {
    private const val EVA_JSON_CMD = 1
    private val tssKt = RoverTssController
    private val objectMapper = ObjectMapper()

    @JvmStatic
    fun setup(app: Javalin) {
        app.get("/dcu/1", this::getEv1DcuState)
        app.get("/dcu/2", this::getEv2DcuState)
        app.get("/error", this::getErrorState)
        app.get("/imu/1", this::getEv1IMUState)
        app.get("/imu/2", this::getEv2IMUState)
        app.get("/uia", this::getUIAState)
        app.get("/ev-telemetry/1", this::getEv1Telemetry)
        app.get("/ev-telemetry/2", this::getEv2Telemetry)
        app.get("/evaStates", this::getMissionState)
    }

    @JvmStatic
    fun fetchEvaJsonForMission(): JsonNode? = fetchEvaJson()

    @JvmStatic
    fun assembleEvaMissionSlice(evaJson: JsonNode?): EvaMissionSlice {
        val json = evaJson ?: objectMapper.createObjectNode()
        return EvaMissionSlice(
            ev1 = buildEv1Telemetry(json),
            ev2 = buildEv2Telemetry(json),
            dcu1 = buildEv1DcuState(json),
            dcu2 = buildEv2DcuState(json),
            errors = buildErrorState(json),
            imu1 = buildEv1ImuState(json),
            imu2 = buildEv2ImuState(json),
            uia = buildUiaState(json),
            evaStates = buildMissionState(json),
        )
    }

    private fun fetchEvaJson(): JsonNode? {
        val packet = tssKt.makeSendLidarPacket(EVA_JSON_CMD)
        val recvBuffer = ByteBuffer.allocate(8192)
        recvBuffer.order(ByteOrder.BIG_ENDIAN)

        return try {
            tssKt.sendMessage(packet, recvBuffer) { buff ->
                val bytes = ByteArray(buff.remaining())
                buff.get(bytes)
                objectMapper.readTree(String(bytes, Charsets.UTF_8))
            }
        } catch (e: Exception) {
            println("Failed to fetch EVA JSON from TSS: ${e.message}")
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

    private fun selectedEva1BatteryLevel(evaJson: JsonNode): Float {
        val usePrimary = evaJson.bool("dcu.eva1.batt.ps", true)
        return if (usePrimary) {
            evaJson.float("telemetry.eva1.primary_battery_level")
        } else {
            evaJson.float("telemetry.eva1.secondary_battery_level")
        }
    }

    private fun buildEv1DcuState(evaJson: JsonNode): DcuState =
        DcuState(
            battery = if (evaJson.bool("dcu.eva1.batt.lu")) Battery.LOCAL else Battery.UMB,
            oxygen = if (evaJson.bool("dcu.eva1.oxy")) Oxygen.PRI else Oxygen.SEC,
            comms = Comms.A,
            fan = if (evaJson.bool("dcu.eva1.fan")) Fan.PRI else Fan.SEC,
            pump = if (evaJson.bool("dcu.eva1.pump")) Pump.OPEN else Pump.CLOSE,
            co2 = if (evaJson.bool("dcu.eva1.co2")) CO2.A else CO2.B,
        )

    private fun buildEv2DcuState(evaJson: JsonNode): DcuState =
        DcuState(
            battery = if (evaJson.bool("dcu.eva2.batt")) Battery.UMB else Battery.LOCAL,
            oxygen = if (evaJson.bool("dcu.eva2.oxy")) Oxygen.PRI else Oxygen.SEC,
            comms = if (evaJson.bool("dcu.eva2.comm")) Comms.A else Comms.B,
            fan = if (evaJson.bool("dcu.eva2.fan")) Fan.PRI else Fan.SEC,
            pump = if (evaJson.bool("dcu.eva2.pump")) Pump.OPEN else Pump.CLOSE,
            co2 = if (evaJson.bool("dcu.eva2.co2")) CO2.A else CO2.B,
        )

    private fun buildErrorState(evaJson: JsonNode): ErrorState =
        ErrorState(
            fan_error = evaJson.bool("error.fan_error"),
            oxy_error = evaJson.bool("error.oxy_error"),
            pump_error = evaJson.bool("error.power_error"),
        )

    private fun buildEv1ImuState(evaJson: JsonNode): IMUState =
        IMUState(
            posx = evaJson.float("imu.eva1.posx"),
            posy = evaJson.float("imu.eva1.posy"),
            heading = evaJson.float("imu.eva1.heading"),
        )

    private fun buildEv2ImuState(evaJson: JsonNode): IMUState =
        IMUState(
            posx = evaJson.float("imu.eva2.posx"),
            posy = evaJson.float("imu.eva2.posy"),
            heading = evaJson.float("imu.eva2.heading"),
        )

    private fun buildUiaState(evaJson: JsonNode): UIAState =
        UIAState(
            eva1_power = evaJson.bool("uia.eva1_power"),
            eva1_oxy = evaJson.bool("uia.eva1_oxy"),
            eva1_water_supply = evaJson.bool("uia.eva1_water_supply"),
            eva1_water_waste = evaJson.bool("uia.eva1_water_waste"),
            eva2_power = evaJson.bool("uia.eva2_power"),
            eva2_oxy = evaJson.bool("uia.eva2_oxy"),
            eva2_water_supply = evaJson.bool("uia.eva2_water_supply"),
            eva2_water_waste = evaJson.bool("uia.eva2_water_waste"),
            oxy_vent = evaJson.bool("uia.oxy_vent"),
            depress = evaJson.bool("uia.depress"),
        )

    private fun buildEv1Telemetry(evaJson: JsonNode): TelemetryState =
        TelemetryState(
            time = evaJson.float("telemetry.eva1.eva_elapsed_time"),
            batt_time_left = selectedEva1BatteryLevel(evaJson),
            oxy_pri_storage = evaJson.float("telemetry.eva1.oxy_pri_storage"),
            oxy_sec_storage = evaJson.float("telemetry.eva1.oxy_sec_storage"),
            oxy_pri_pressure = evaJson.float("telemetry.eva1.oxy_pri_pressure"),
            oxy_sec_pressure = evaJson.float("telemetry.eva1.oxy_sec_pressure"),
            oxy_time_left = 0,
            heart_rate = evaJson.float("telemetry.eva1.heart_rate"),
            oxy_consumption = evaJson.float("telemetry.eva1.oxy_consumption"),
            co2_production = evaJson.float("telemetry.eva1.co2_production"),
            suit_pressure_oxy = evaJson.float("telemetry.eva1.suit_pressure_oxy"),
            suit_pressure_co2 = evaJson.float("telemetry.eva1.suit_pressure_co2"),
            suit_pressure_other = evaJson.float("telemetry.eva1.suit_pressure_other"),
            suit_pressure_total = evaJson.float("telemetry.eva1.suit_pressure_total"),
            fan_pri_rpm = evaJson.float("telemetry.eva1.fan_pri_rpm"),
            fan_sec_rpm = evaJson.float("telemetry.eva1.fan_sec_rpm"),
            helmet_pressure_co2 = evaJson.float("telemetry.eva1.helmet_pressure_co2"),
            scrubber_a_co2_storage = evaJson.float("telemetry.eva1.scrubber_a_co2_storage"),
            scrubber_b_co2_storage = evaJson.float("telemetry.eva1.scrubber_b_co2_storage"),
            temperature = evaJson.float("telemetry.eva1.temperature"),
            coolant_ml = evaJson.float("telemetry.eva1.coolant_storage"),
            coolant_gas_pressure = evaJson.float("telemetry.eva1.coolant_gas_pressure"),
            coolant_liquid_pressure = evaJson.float("telemetry.eva1.coolant_liquid_pressure"),
        )

    private fun buildEv2Telemetry(evaJson: JsonNode): TelemetryState =
        TelemetryState(
            time = evaJson.float("telemetry.eva2.eva_elapsed_time"),
            batt_time_left = evaJson.float("telemetry.eva2.battery_level"),
            oxy_pri_storage = evaJson.float("telemetry.eva2.oxy_pri_storage"),
            oxy_sec_storage = evaJson.float("telemetry.eva2.oxy_sec_storage"),
            oxy_pri_pressure = evaJson.float("telemetry.eva2.oxy_pri_pressure"),
            oxy_sec_pressure = evaJson.float("telemetry.eva2.oxy_sec_pressure"),
            oxy_time_left = 0,
            heart_rate = evaJson.float("telemetry.eva2.heart_rate"),
            oxy_consumption = evaJson.float("telemetry.eva2.oxy_consumption"),
            co2_production = evaJson.float("telemetry.eva2.co2_production"),
            suit_pressure_oxy = evaJson.float("telemetry.eva2.suit_pressure_oxy"),
            suit_pressure_co2 = evaJson.float("telemetry.eva2.suit_pressure_co2"),
            suit_pressure_other = evaJson.float("telemetry.eva2.suit_pressure_other"),
            suit_pressure_total = evaJson.float("telemetry.eva2.suit_pressure_total"),
            fan_pri_rpm = evaJson.float("telemetry.eva2.fan_pri_rpm"),
            fan_sec_rpm = evaJson.float("telemetry.eva2.fan_sec_rpm"),
            helmet_pressure_co2 = evaJson.float("telemetry.eva2.helmet_pressure_co2"),
            scrubber_a_co2_storage = evaJson.float("telemetry.eva2.scrubber_a_co2_storage"),
            scrubber_b_co2_storage = evaJson.float("telemetry.eva2.scrubber_b_co2_storage"),
            temperature = evaJson.float("telemetry.eva2.temperature"),
            coolant_ml = evaJson.float("telemetry.eva2.coolant_storage"),
            coolant_gas_pressure = evaJson.float("telemetry.eva2.coolant_gas_pressure"),
            coolant_liquid_pressure = evaJson.float("telemetry.eva2.coolant_liquid_pressure"),
        )

    private fun buildMissionState(evaJson: JsonNode): MissionState {
        val started = evaJson.bool("status.started")
        val elapsed = maxOf(
            evaJson.float("telemetry.eva1.eva_elapsed_time"),
            evaJson.float("telemetry.eva2.eva_elapsed_time"),
        ).toInt()
        return MissionState(
            started = started,
            paused = false,
            completed = false,
            total_time = elapsed,
            uia_started = started,
            uia_completed = false,
            uia_time = elapsed,
            dcu_started = started,
            dcu_completed = false,
            dcu_time = elapsed,
            rover_started = false,
            rover_completed = false,
            rover_time = 0,
            spec_started = false,
            spec_completed = false,
            spec_time = 0,
        )
    }

    fun getEv1DcuState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv1DcuState(evaJson))
    }

    fun getEv2DcuState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv2DcuState(evaJson))
    }

    fun getErrorState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildErrorState(evaJson))
    }

    fun getEv1IMUState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv1ImuState(evaJson))
    }

    fun getEv2IMUState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv2ImuState(evaJson))
    }

    fun getUIAState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildUiaState(evaJson))
    }

    fun getEv1Telemetry(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv1Telemetry(evaJson))
    }

    fun getEv2Telemetry(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildEv2Telemetry(evaJson))
    }

    fun getMissionState(ctx: Context) {
        val evaJson = fetchEvaJson() ?: run {
            ctx.status(502).result("Failed to fetch EVA.json")
            return
        }
        ctx.json(buildMissionState(evaJson))
    }
}

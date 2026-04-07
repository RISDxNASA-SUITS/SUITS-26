package SUITS2026Backend.RoverIntegration

import com.fasterxml.jackson.databind.JsonNode

data class RoverTelemetry(
    var acHeating: Boolean,
    var acCooling: Boolean,
    var co2Scrubber: Boolean,
    var lightsOn: Boolean,
    var internalLightsOn: Boolean,
    var brakes: Boolean,
    var inSunlight: Boolean,
    var throttle: Float,
    var steering: Float,
    var currentPosX: Float,
    var currentPosY: Float,
    var currentPosAlt: Float,
    var heading: Float,
    var pitch: Float,
    var roll: Float,
    var distanceTraveled: Float,
    var speed: Float,
    var surfaceIncline: Float,
    var oxygenTank: Float,
    var oxygenPressure: Float,
    var oxygenLevels: Float,
    var fanPri: Boolean,
    var acFanPri: Float,
    var acFanSec: Float,
    var cabinPressure: Float,
    var cabinTemperature: Float,
    var batteryLevel: Float,
    var powerConsumptionRate: Float,
    var solarPanelEfficiency: Float,
    var externalTemp: Float,
    var prCoolantLevel: Float,
    var prCoolantPressure: Float,
    var prCoolantTank: Float,
    var radiator: Float,
    var motorPowerConsumption: Float,
    var terrainCondition: Float,
    var solarPanelDustAccum: Float,
    var missionElapsedTime: Float,
    var missionPlannedTime: Float,
    var pointOfNoReturn: Float,
    var distanceFromBase: Float,
    var switchDest: Boolean,
    var destX: Float,
    var destY: Float,
    var destZ: Float,
    var dustWiper: Boolean,
    var simRunning: Boolean,
    var simPaused: Boolean,
    var simCompleted: Boolean,
    var latitude: Float,
    var longitude: Float,
) {
    companion object {
        private fun f(node: JsonNode?, key: String, default: Double = 0.0): Float {
            return node?.path(key)?.asDouble(default)?.toFloat() ?: default.toFloat()
        }

        private fun b(node: JsonNode?, key: String, default: Boolean = false): Boolean {
            return node?.path(key)?.asBoolean(default) ?: default
        }

        fun fromRoverJson(root: JsonNode?): RoverTelemetry {
            val pr = root?.path("pr_telemetry")
            val simRunningNode = pr?.path("sim_running")
            val simPaused = b(pr, "sim_paused")
            val simCompleted = b(pr, "sim_completed")
            val x = f(pr, "rover_pos_x")
            val y = f(pr, "rover_pos_y")
            val fanPriRpm = f(pr, "fan_pri_rpm")
            val fanSecRpm = f(pr, "fan_sec_rpm")
            val oxygenTankValue = f(pr, "oxygen_tank", f(pr, "oxygen_storage").toDouble())
            val batteryLevelValue = f(pr, "battery_level", f(pr, "primary_battery_level").toDouble())
            val speed = f(pr, "speed")
            val throttle = f(pr, "throttle")
            val steering = f(pr, "steering")
            val explicitSimRunning =
                if (simRunningNode != null && !simRunningNode.isMissingNode && !simRunningNode.isNull) {
                    simRunningNode.asBoolean(false)
                } else {
                    false
                }
            val roverClearlyActive =
                kotlin.math.abs(speed) > 0.01f ||
                kotlin.math.abs(throttle) > 0.01f ||
                kotlin.math.abs(steering) > 0.01f
            val simRunningResolved =
                explicitSimRunning ||
                (!simPaused && !simCompleted && roverClearlyActive) ||
                (simRunningNode == null || simRunningNode.isMissingNode || simRunningNode.isNull) && !simPaused && !simCompleted

            return RoverTelemetry(
                acHeating = b(pr, "cabin_heating"),
                acCooling = b(pr, "cabin_cooling"),
                co2Scrubber = b(pr, "co2_scrubber"),
                lightsOn = b(pr, "lights_on"),
                internalLightsOn = b(pr, "internal_lights_on"),
                brakes = b(pr, "brakes"),
                inSunlight = f(pr, "sunlight") > 0f,
                throttle = throttle,
                steering = steering,
                currentPosX = x,
                currentPosY = y,
                currentPosAlt = f(pr, "rover_pos_z"),
                heading = f(pr, "heading"),
                pitch = f(pr, "pitch"),
                roll = f(pr, "roll"),
                distanceTraveled = f(pr, "distance_traveled"),
                speed = speed,
                surfaceIncline = f(pr, "surface_incline"),
                oxygenTank = oxygenTankValue,
                oxygenPressure = f(pr, "oxygen_pressure"),
                oxygenLevels = oxygenTankValue,
                fanPri = fanPriRpm >= fanSecRpm,
                acFanPri = fanPriRpm,
                acFanSec = fanSecRpm,
                cabinPressure = f(pr, "cabin_pressure"),
                cabinTemperature = f(pr, "cabin_temperature"),
                batteryLevel = batteryLevelValue,
                powerConsumptionRate = f(pr, "power_consumption_rate"),
                solarPanelEfficiency = f(pr, "solar_panel_efficiency"),
                externalTemp = f(pr, "external_temp"),
                prCoolantLevel = f(pr, "coolant_storage"),
                prCoolantPressure = f(pr, "coolant_pressure"),
                prCoolantTank = f(pr, "coolant_storage"),
                radiator = f(pr, "radiator"),
                motorPowerConsumption = f(pr, "motor_power_consumption"),
                terrainCondition = f(pr, "terrain_condition", f(pr, "surface_incline").toDouble()),
                solarPanelDustAccum = f(pr, "solar_panel_dust_accum"),
                missionElapsedTime = f(pr, "rover_elapsed_time"),
                missionPlannedTime = f(pr, "mission_planned_time"),
                pointOfNoReturn = f(pr, "point_of_no_return"),
                distanceFromBase = f(pr, "distance_from_base"),
                switchDest = b(pr, "switch_dest"),
                destX = f(pr, "dest_x"),
                destY = f(pr, "dest_y"),
                destZ = f(pr, "dest_z"),
                dustWiper = b(pr, "dust_wiper"),
                simRunning = simRunningResolved,
                simPaused = simPaused,
                simCompleted = simCompleted,
                latitude = y,
                longitude = x,
            )
        }
    }
}

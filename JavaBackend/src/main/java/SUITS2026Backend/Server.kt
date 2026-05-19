package SUITS2026Backend

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.javalin.Javalin
import io.javalin.json.JavalinJackson
import SUITS2026Backend.PoiList.PoiController
import SUITS2026Backend.RoverIntegration.RoverTssController
import SUITS2026Backend.TssIntegration.EvaTssComms
import SUITS2026Backend.TssIntegration.LtvTssComms
import SUITS2026Backend.TssIntegration.TelemetryBroadcaster
import SUITS2026Backend.TssIntegration.TssConfig

/** Application entry-point */
object Server {

    @JvmStatic
    fun main(args: Array<String>) {
        TssConfig.init(args.getOrNull(0))

        /* ---------- Jackson mapper with Kotlin module ---------- */
        val mapper = ObjectMapper()
            .registerModule(KotlinModule.Builder().build())

        /* ---------- Javalin instance ---------- */
        val app = Javalin.create { cfg ->
            cfg.jsonMapper(JavalinJackson(mapper, false))
        }

        /* ---------- WebSocket handlers ---------- */
        TelemetryBroadcaster.setup(app, mapper)

        /* ---------- REST controllers ---------- */
        PoiController.setup(app)
        RoverTssController.setup(app)
        EvaTssComms.setup(app)
        LtvTssComms.setup(app)

        /* ---------- Start server ---------- */
        val httpPort = (System.getenv("JAVA_HTTP_PORT") ?: "7070").toInt()
        println("HTTP server listening on port $httpPort")
        app.start(httpPort)
    }
}

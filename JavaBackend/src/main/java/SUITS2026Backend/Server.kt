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
import SUITS2026Backend.MapData.MapController
import SUITS2026Backend.db.DbFactory

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
            // Allow browser REST calls from the Vite dev server (and other origins).
            cfg.bundledPlugins.enableCors { cors ->
                cors.addRule { it.anyHost() }
            }
        }

        /* ---------- WebSocket handlers ---------- */
        TelemetryBroadcaster.setup(app, mapper)

        /* ---------- CORS (browser REST from Vite / other origins) ---------- */
        app.before { ctx ->
            val origin = ctx.header("Origin")
            ctx.header("Access-Control-Allow-Origin", origin ?: "*")
            ctx.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            ctx.header("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization")
            ctx.header("Access-Control-Max-Age", "86400")
        }
        app.options("/*") { ctx -> ctx.status(204) }

        /* ---------- Database setup ---------- */
        DbFactory.init()

        /* ---------- REST controllers ---------- */
        PoiController.setup(app)
        MapController.setup(app)
        RoverTssController.setup(app)
        EvaTssComms.setup(app)
        LtvTssComms.setup(app)

        /* ---------- Start server ---------- */
        val httpPort = (System.getenv("JAVA_HTTP_PORT") ?: "7070").toInt()
        println("HTTP server listening on port $httpPort")
        app.start(httpPort)
    }
}

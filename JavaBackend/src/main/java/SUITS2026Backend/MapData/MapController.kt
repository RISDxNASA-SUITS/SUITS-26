package SUITS2026Backend.MapData

import SUITS2026Backend.db.MapDataDbController
import SUITS2026Backend.db.MapPoiRequest
import io.javalin.Javalin
import io.javalin.http.Context

object MapController {
    private val dbController = MapDataDbController()

    fun setup(app: Javalin) = with(app) {
        get("/map/poi") { ctx -> getPois(ctx) }
        get("/map/poi/{name}") { ctx -> getPoi(ctx) }
        post("/map/poi") { ctx -> addPoi(ctx) }
        put("/map/poi/{name}") { ctx -> updatePoi(ctx) }
        delete("/map/poi/{name}") { ctx -> deletePoi(ctx) }
    }

    private fun getPois(ctx: Context) {
        ctx.json(dbController.getPois())
    }

    private fun getPoi(ctx: Context) {
        val name = ctx.pathParam("name")
        val poi = dbController.getPoiByName(name)
        if (poi == null) {
            ctx.status(404).result("POI not found")
        } else {
            ctx.json(poi)
        }
    }

    private fun addPoi(ctx: Context) {
        val request = ctx.bodyAsClass(MapPoiRequest::class.java)
        ctx.json(dbController.addPoi(request))
    }

    private fun updatePoi(ctx: Context) {
        val name = ctx.pathParam("name")
        val request = ctx.bodyAsClass(MapPoiRequest::class.java)
        val poi = dbController.updatePoi(name, request)
        if (poi == null) {
            ctx.status(404).result("POI not found")
        } else {
            ctx.json(poi)
        }
    }

    private fun deletePoi(ctx: Context) {
        val name = ctx.pathParam("name")
        if (dbController.deletePoi(name)) {
            ctx.result("Deleted POI: $name")
        } else {
            ctx.status(404).result("POI not found")
        }
    }
}

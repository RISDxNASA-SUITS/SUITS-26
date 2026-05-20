package SUITS2026Backend.db

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object MapPois : IntIdTable() {
    val name = varchar("name", 128).uniqueIndex()
    val x = double("x")
    val y = double("y")
}

object Hazards : IntIdTable() {
    val name = varchar("name", 128).uniqueIndex()
}

object HazardVertices : IntIdTable() {
    val hazard = reference("hazard_id", Hazards, onDelete = ReferenceOption.CASCADE)
    val x = double("x")
    val y = double("y")
    val position = integer("position")
}

data class MapCoord(val x: Double, val y: Double)

data class MapPoiResponse(
    val id: Int?,
    val name: String,
    val x: Double,
    val y: Double,
)

data class MapPoiListResponse(val data: List<MapPoiResponse>)

data class HazardResponse(
    val id: Int?,
    val name: String,
    val vertices: List<MapCoord>,
)

data class HazardListResponse(val data: List<HazardResponse>)

class MapPoi(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<MapPoi>(MapPois)

    var name by MapPois.name
    var x by MapPois.x
    var y by MapPois.y

    fun asResponse(): MapPoiResponse {
        return MapPoiResponse(
            id.value,
            name,
            x,
            y,
        )
    }
}

class Hazard(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<Hazard>(Hazards)

    var name by Hazards.name
    val vertices by HazardVertex referrersOn HazardVertices.hazard

    fun asResponse(): HazardResponse {
        return HazardResponse(
            id.value,
            name,
            vertices.sortedBy { it.position }.map { MapCoord(it.x, it.y) },
        )
    }
}

class HazardVertex(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<HazardVertex>(HazardVertices)

    var hazard by Hazard referencedOn HazardVertices.hazard
    var x by HazardVertices.x
    var y by HazardVertices.y
    var position by HazardVertices.position
}

fun ensureMapDbSchema() {
    DbFactory.init()
    transaction {
        SchemaUtils.create(MapPois, Hazards, HazardVertices)
    }
}

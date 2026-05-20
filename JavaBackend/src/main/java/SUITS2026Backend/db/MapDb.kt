package SUITS2026Backend.db

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object MapPois : IntIdTable() {
    val name = varchar("name", 128).uniqueIndex()
    val x = double("x")
    val y = double("y")
    val description = varchar("description", 400).default("")
    val type = varchar("type", 32).default("PR")
}

data class MapPoiResponse(
    val id: Int?,
    val name: String,
    val x: Double,
    val y: Double,
    val description: String,
    val type: String,
)

data class MapPoiListResponse(val data: List<MapPoiResponse>)

class MapPoi(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<MapPoi>(MapPois)

    var name by MapPois.name
    var x by MapPois.x
    var y by MapPois.y
    var description by MapPois.description
    var type by MapPois.type

    fun asResponse(): MapPoiResponse {
        return MapPoiResponse(
            id.value,
            name,
            x,
            y,
            description,
            type,
        )
    }
}

fun ensureMapDbSchema() {
    DbFactory.init()
    transaction {
        SchemaUtils.create(MapPois)
    }
}

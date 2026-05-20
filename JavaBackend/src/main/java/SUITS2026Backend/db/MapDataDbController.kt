package SUITS2026Backend.db

import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

class MapDataDbController {
    init {
        ensureMapDbSchema()
    }

    fun getPois(): MapPoiListResponse {
        val pois = transaction {
            MapPoi.all().map { it.asResponse() }
        }
        return MapPoiListResponse(pois)
    }

    fun getPoiByName(name: String): MapPoiResponse? {
        return transaction {
            MapPoi.find { MapPois.name eq name }.firstOrNull()?.asResponse()
        }
    }

    fun addPoi(request: MapPoiRequest): MapPoiResponse {
        return transaction {
            val existing = MapPoi.find { MapPois.name eq request.name }.firstOrNull()
            if (existing != null) {
                existing.x = request.x
                existing.y = request.y
                existing.description = request.description
                existing.type = request.type
                existing.asResponse()
            } else {
                MapPoi.new {
                    name = request.name
                    x = request.x
                    y = request.y
                    description = request.description
                    type = request.type
                }.asResponse()
            }
        }
    }

    fun updatePoi(name: String, request: MapPoiRequest): MapPoiResponse? {
        return transaction {
            MapPoi.find { MapPois.name eq name }.firstOrNull()?.let {
                it.name = request.name
                it.x = request.x
                it.y = request.y
                it.description = request.description
                it.type = request.type
                it.asResponse()
            }
        }
    }

    fun deletePoi(name: String): Boolean {
        return transaction {
            MapPoi.find { MapPois.name eq name }.firstOrNull()?.let {
                it.delete()
                true
            } ?: false
        }
    }
}

data class MapPoiRequest(
    val name: String,
    val x: Double,
    val y: Double,
    val description: String = "",
    val type: String = "PR",
)

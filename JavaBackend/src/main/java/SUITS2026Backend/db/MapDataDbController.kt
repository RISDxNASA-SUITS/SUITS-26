package SUITS2026Backend.db

import io.javalin.http.Context
import org.jetbrains.exposed.sql.transactions.transaction

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
                existing.asResponse()
            } else {
                MapPoi.new {
                    name = request.name
                    x = request.x
                    y = request.y
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

    fun getHazards(): HazardListResponse {
        val hazards = transaction {
            Hazard.all().map { it.asResponse() }
        }
        return HazardListResponse(hazards)
    }

    fun getHazardByName(name: String): HazardResponse? {
        return transaction {
            Hazard.find { Hazards.name eq name }.firstOrNull()?.asResponse()
        }
    }

    fun addHazard(request: HazardRequest): HazardResponse {
        return transaction {
            val existing = Hazard.find { Hazards.name eq request.name }.firstOrNull()
            if (existing != null) {
                existing.vertices.sortedBy { it.position }.forEach { it.delete() }
                request.vertices.forEachIndexed { index, coord ->
                    HazardVertex.new {
                        hazard = existing
                        x = coord.x
                        y = coord.y
                        position = index
                    }
                }
                existing.asResponse()
            } else {
                val hazard = Hazard.new {
                    name = request.name
                }
                request.vertices.forEachIndexed { index, coord ->
                    HazardVertex.new {
                        this.hazard = hazard
                        x = coord.x
                        y = coord.y
                        position = index
                    }
                }
                hazard.asResponse()
            }
        }
    }

    fun updateHazard(name: String, request: HazardRequest): HazardResponse? {
        return transaction {
            Hazard.find { Hazards.name eq name }.firstOrNull()?.let { hazard ->
                hazard.name = request.name
                hazard.vertices.sortedBy { it.position }.forEach { it.delete() }
                request.vertices.forEachIndexed { index, coord ->
                    HazardVertex.new {
                        this.hazard = hazard
                        x = coord.x
                        y = coord.y
                        position = index
                    }
                }
                hazard.asResponse()
            }
        }
    }

    fun deleteHazard(name: String): Boolean {
        return transaction {
            Hazard.find { Hazards.name eq name }.firstOrNull()?.let {
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
)

data class HazardRequest(
    val name: String,
    val vertices: List<MapCoord>,
)

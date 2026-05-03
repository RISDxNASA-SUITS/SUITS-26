import rockYardImage from "../../../assets/map/rock-yard.png"

export function MapStage({ poiPanel, addPoiPanel, addHazardPanel }) {
  return (
    <section className="map-stage">
      <img src={rockYardImage} alt="" className="map-bg" />
      {poiPanel}
      {addPoiPanel}
      {addHazardPanel}
    </section>
  )
}

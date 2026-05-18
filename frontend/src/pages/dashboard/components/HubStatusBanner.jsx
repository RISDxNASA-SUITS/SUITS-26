export function HubStatusBanner({ error }) {
  if (!error) return null
  return (
    <div className="hub-status-banner" role="status">
      Hub offline — showing last values. ({error})
    </div>
  )
}

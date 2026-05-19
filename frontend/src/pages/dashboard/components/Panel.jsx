export function Panel({ title, children, className = "" }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title ? (
        <header className="panel-header">
          <span className="status-dot" />
          <h2>{title}</h2>
        </header>
      ) : null}
      {children}
    </section>
  )
}

import { useEvaAlerts } from "../../hooks/useEvaAlerts"

function bubbleLabel(item) {
  if (item.kind === "warning") {
    return item.code?.slice(0, 3) || "!"
  }
  const code = item.codes?.[0]
  return code?.slice(0, 3) || "AI"
}

function bubbleTitle(item) {
  if (item.kind === "warning") {
    return `${item.code}: ${item.message}`
  }
  return item.spoken_text || item.codes?.join(", ") || "Agent alert"
}

function severityClass(item) {
  if (item.kind === "agent") return "eva-alert-bubble--agent"
  if (item.severity === "caution") return "eva-alert-bubble--caution"
  return "eva-alert-bubble--warning"
}

export function AlertBubbles() {
  const { warnings, agentAlerts } = useEvaAlerts()

  const items = [
    ...warnings.map((w) => ({ kind: "warning", key: `w-${w.code}`, ...w })),
    ...agentAlerts.map((a) => ({ kind: "agent", key: `a-${a.id}`, ...a })),
  ]

  if (items.length === 0) return null

  return (
    <div className="eva-alert-bubbles" role="list" aria-label="Active alerts">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`eva-alert-bubble ${severityClass(item)}`}
          title={bubbleTitle(item)}
          aria-label={bubbleTitle(item)}
        >
          {bubbleLabel(item)}
        </button>
      ))}
    </div>
  )
}

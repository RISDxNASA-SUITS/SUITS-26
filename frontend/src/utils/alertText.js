export function bubbleLabel(item) {
  if (item.kind === "warning") {
    return item.code?.slice(0, 3) || "!"
  }
  const code = item.codes?.[0]
  return code?.slice(0, 3) || "AI"
}

export function bubbleTitle(item) {
  if (item.kind === "warning") {
    return `${item.code}: ${item.message}`
  }
  return item.spoken_text || item.codes?.join(", ") || "Agent alert"
}

export function severityClass(item) {
  if (item.kind === "agent") return "eva-alert-bubble--agent"
  if (item.severity === "caution") return "eva-alert-bubble--caution"
  return "eva-alert-bubble--warning"
}

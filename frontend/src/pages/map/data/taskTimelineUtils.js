export function makeTaskConfig(title, remainingTime, steps, options = {}) {
  const { defaultActiveStep = 0, defaultHasAdvanced = false } = options
  const stepCount = steps.length
  return {
    remainingTime,
    pct: "0%",
    gridCols: `repeat(${stepCount}, 1fr)`,
    steps,
    defaultActiveStep,
    defaultHasAdvanced,
    upcomingEntry: {
      title,
      time: remainingTime.replace(/\s*min$/, " minutes"),
      sub: `${stepCount} ${stepCount === 1 ? "sub-task" : "sub-tasks"}`,
    },
  }
}

export function buildTimeline(configs) {
  const order = Object.keys(configs)
  return {
    configs,
    order,
    initialKey: order[0],
    initialUpcoming: order.slice(1).map((title) => configs[title].upcomingEntry),
  }
}

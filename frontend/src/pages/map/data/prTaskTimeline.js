import { makeTaskConfig, buildTimeline } from "./taskTimelineUtils"

/** Pressurized rover procedure timeline — text drives map task panel UI. */
const PR_TASK_CONFIGS = {
  "Pre-Nav Checklist": makeTaskConfig("Pre-Nav Checklist", "3 min", [
    "battery level is > 95%",
    "confirm O2 levels are > 95%",
    "confirm O2 pressure is > 2900 psi",
    "confirm PR Cabin Pressure is > 3.95 psi",
    "verify headlights are operational",
    "Pilot drop pin at current location",
    "Drop pin at LTV last known position",
    "Calculate optimal path to the LTV last nominal position",
    "confirm completion of checklist",
  ]),
  "Navigate to LTV Last Known Location": makeTaskConfig(
    "Navigate to LTV Last Known Location",
    "3 min",
    [
      "Begin navigation to LTV last nominal position",
      "Upon arrival, fully stop the PR, announce arrival at LTV last nominal position",
      "compare telemetry data with expected values",
      "announce beginning of LTV search",
    ],
  ),
  "Initial Ping and Calculate Search Area": makeTaskConfig(
    "Initial Ping and Calculate Search Area",
    "2 min",
    [
      "Set pin for next search waypoint",
      "calculate optimal path of navigation",
      "Review telemetry and vitals; assess point-of-no-return (PNR)",
      "begin return to HAB and disregard further procedures",
    ],
  ),
  "Execute Search Procedure, Find LTV": makeTaskConfig("Execute Search Procedure, Find LTV", "10 min", [
    "Begin navigation to next search waypoint",
    "fully stop the PR",
    "Determine next search location",
    "Repeat navigation",
    "Once LTV is located, verbally confirm visual of LTV",
    "Drop pin at exact location of LTV, verbally confirm success",
  ]),
  "Navigate Back to HAB": makeTaskConfig("Navigate Back to HAB", "4 min", [
    "Navigate back to HAB",
    "fully stop PR, announce arrival at HAB and conclusion of EVA",
  ]),
  "Conclusion of the Test": makeTaskConfig("Conclusion of the Test", "— min", [
    "Confirm sucess and mission objectives",
  ]),
}

export const PR_TASK_TIMELINE = buildTimeline(PR_TASK_CONFIGS)

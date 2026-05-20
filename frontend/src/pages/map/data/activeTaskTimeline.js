import { EVA_TASK_TIMELINE } from "./evaTaskTimeline"
import { PR_TASK_TIMELINE } from "./prTaskTimeline"

/** Active map task list timeline. Set to `eva` to restore the EVA timeline. */
export const ACTIVE_TASK_TIMELINE = "pr"

const TIMELINES = {
  eva: EVA_TASK_TIMELINE,
  pr: PR_TASK_TIMELINE,
}

export const TASK_TIMELINE = TIMELINES[ACTIVE_TASK_TIMELINE] ?? PR_TASK_TIMELINE
export const TASK_CONFIGS = TASK_TIMELINE.configs
export const TASK_ORDER = TASK_TIMELINE.order
export const INITIAL_TASK_KEY = TASK_TIMELINE.initialKey
export const INITIAL_UPCOMING = TASK_TIMELINE.initialUpcoming

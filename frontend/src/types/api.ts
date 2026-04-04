/**
 * Shared API types — align with backend Pydantic models.
 */

export type MissionPhase =
  | 'INIT'
  | 'PR_SEARCH'
  | 'EGRESS'
  | 'EVA_NAV'
  | 'LTV_REPAIR'
  | 'INGRESS'
  | 'COMPLETE'

export interface MissionState {
  phase: MissionPhase
}

export interface MissionPhaseUpdateRequest {
  phase: MissionPhase
}

export interface TelemetrySnapshot {
  primary_o2_pct: number
  secondary_o2_pct: number
  battery_pct: number
  co2_status: string
  comms_status: string
  safe_range_m: number
  ltv_status: string
}

/** Partial body for POST /telemetry/update */
export interface TelemetryUpdate {
  primary_o2_pct?: number
  secondary_o2_pct?: number
  battery_pct?: number
  co2_status?: string
  comms_status?: string
  safe_range_m?: number
  ltv_status?: string
}

export interface WarningItem {
  code: string
  severity: string
  message: string
}

export interface ProcedureSummary {
  procedure_id: string
  title: string
  allowed_phase: MissionPhase
}

export interface ProcedureCurrentState {
  active: boolean
  procedure_id: string | null
  title: string | null
  allowed_phase: MissionPhase | null
  step_index: number | null
  step_count: number | null
  current_step_id: string | null
  instruction: string | null
  check_key: string | null
}

export interface ProcedureStartRequest {
  procedure_id: string
}

export interface ProcedureActionResponse {
  message: string
  state: ProcedureCurrentState
}

export interface CommandRequest {
  text: string
}

export interface CommandResponse {
  success: boolean
  error_code: string | null
  input_text: string
  parsed_intent: string
  /** Subsystem or procedure target when applicable (e.g. oxygen, egress). */
  entity: string | null
  response_text: string
}

/** POST /asr/transcribe — local Whisper + optional command routing. */
export interface AsrCommandResultPayload {
  intent: string
  response_text: string
  success: boolean
  error_code: string | null
  entity: string | null
}

export interface AsrTranscribeResponse {
  success: boolean
  transcript: string
  normalized_text: string
  error: string | null
  command_result: AsrCommandResultPayload | null
  avg_logprob?: number | null
}

import type {
  AsrTranscribeResponse,
  CommandRequest,
  CommandResponse,
  MissionPhaseUpdateRequest,
  MissionState,
  ProcedureActionResponse,
  ProcedureCurrentState,
  ProcedureStartRequest,
  ProcedureSummary,
  TelemetrySnapshot,
  TelemetryUpdate,
  WarningItem,
} from '../types/api'

function apiOrigin(): string {
  const raw = import.meta.env.VITE_API_ORIGIN as string | undefined
  return raw?.replace(/\/$/, '') || 'http://localhost:8000'
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getTelemetry(): Promise<TelemetrySnapshot> {
  const res = await fetch(`${apiOrigin()}/telemetry`)
  return parseJson<TelemetrySnapshot>(res)
}

export async function getTelemetryWarnings(): Promise<WarningItem[]> {
  const res = await fetch(`${apiOrigin()}/telemetry/warnings`)
  return parseJson<WarningItem[]>(res)
}

export async function postTelemetryUpdate(body: TelemetryUpdate): Promise<TelemetrySnapshot> {
  const res = await fetch(`${apiOrigin()}/telemetry/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<TelemetrySnapshot>(res)
}

export async function getMission(): Promise<MissionState> {
  const res = await fetch(`${apiOrigin()}/mission`)
  return parseJson<MissionState>(res)
}

export async function postMissionPhase(body: MissionPhaseUpdateRequest): Promise<MissionState> {
  const res = await fetch(`${apiOrigin()}/mission/phase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<MissionState>(res)
}

export async function postCommand(body: CommandRequest): Promise<CommandResponse> {
  const res = await fetch(`${apiOrigin()}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<CommandResponse>(res)
}

/** Upload recorded audio to local Whisper; optional auto-route through /command pipeline. */
export async function postAsrTranscribe(
  blob: Blob,
  autoRouteToCommand = true,
): Promise<AsrTranscribeResponse> {
  const form = new FormData()
  form.append('audio', blob, 'clip.webm')
  form.append('auto_route_to_command', autoRouteToCommand ? 'true' : 'false')
  const res = await fetch(`${apiOrigin()}/asr/transcribe`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<AsrTranscribeResponse>
}

export async function getProcedureList(): Promise<ProcedureSummary[]> {
  const res = await fetch(`${apiOrigin()}/procedure/list`)
  return parseJson<ProcedureSummary[]>(res)
}

export async function getProcedureCurrent(): Promise<ProcedureCurrentState> {
  const res = await fetch(`${apiOrigin()}/procedure/current`)
  return parseJson<ProcedureCurrentState>(res)
}

export async function postProcedureStart(body: ProcedureStartRequest): Promise<ProcedureActionResponse> {
  const res = await fetch(`${apiOrigin()}/procedure/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<ProcedureActionResponse>(res)
}

export async function postProcedureNext(): Promise<ProcedureActionResponse> {
  const res = await fetch(`${apiOrigin()}/procedure/next`, { method: 'POST' })
  return parseJson<ProcedureActionResponse>(res)
}

export async function postProcedureRepeat(): Promise<ProcedureActionResponse> {
  const res = await fetch(`${apiOrigin()}/procedure/repeat`, { method: 'POST' })
  return parseJson<ProcedureActionResponse>(res)
}

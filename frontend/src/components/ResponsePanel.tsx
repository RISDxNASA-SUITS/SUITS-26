import type { CommandResponse } from '../types/api'

type Props = {
  response: CommandResponse | null
  error: string | null
  sending: boolean
}

export function ResponsePanel({ response, error, sending }: Props) {
  return (
    <section className="panel panel-assistant" aria-labelledby="assistant-heading">
      <h2 id="assistant-heading" className="panel-heading">
        Assistant
      </h2>
      {sending && <p className="muted">Processing command…</p>}
      {error && <p className="error">{error}</p>}
      {!sending && !error && !response && (
        <div className="assistant-hero">
          <p className="assistant-hero-label">Latest reply</p>
          <div className="assistant-message-box">
            <p className="response-message empty-assistant-hint">
              No command yet. Enter a phrase and send, or use the side panels for phase and procedures.
            </p>
          </div>
        </div>
      )}
      {response && (
        <div className="assistant-hero">
          {response.success === false && (
            <div className="guardrail-banner" role="alert">
              <p className="guardrail-title">Guardrail</p>
              {response.error_code && <p className="mono guardrail-code">{response.error_code}</p>}
            </div>
          )}
          <p className="assistant-hero-label">Latest reply</p>
          <div className="assistant-message-box">
            <p
              className={
                response.success === false ? 'response-message guardrail-message' : 'response-message'
              }
            >
              {response.response_text}
            </p>
          </div>
          <div className="assistant-meta">
            <dl className="response-meta">
              <div>
                <dt>Status</dt>
                <dd>
                  {response.success ? <span className="ok">ok</span> : <span className="warn">rejected</span>}
                </dd>
              </div>
              <div>
                <dt>Input</dt>
                <dd className="mono wrap">{response.input_text}</dd>
              </div>
              <div>
                <dt>Intent</dt>
                <dd className="mono">{response.parsed_intent}</dd>
              </div>
              {response.entity != null && response.entity !== '' && (
                <div>
                  <dt>Entity</dt>
                  <dd className="mono">{response.entity}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </section>
  )
}

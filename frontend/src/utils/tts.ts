/**
 * Browser Web Speech API (speechSynthesis) — no backend, no external APIs.
 *
 * Chrome often starts synthesis in a "paused" state; call resume() before speak().
 * Telemetry strings use Unicode subscripts (O₂, CO₂) — normalize to ASCII for reliable speech.
 */

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
    voices.find((v) => v.lang.toLowerCase().includes('en'))
  )
}

/** Make backend strings (O₂, CO₂, subscripts) readable by speech engines. */
export function prepareTextForSpeech(text: string): string {
  let s = text.normalize('NFKC').trim()
  // Unicode subscript digits U+2080–U+2089 → 0–9 (e.g. O₂ → O2)
  s = s.replace(/[\u2080-\u2089]/g, (ch) =>
    String.fromCharCode(0x30 + (ch.charCodeAt(0) - 0x2080)),
  )
  return s
}

/** Stop any in-progress or queued speech. */
export function stop(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
}

/**
 * Speak text aloud. Cancels any previous utterance first.
 * Prefer a neutral English voice when the browser exposes one.
 */
export function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const raw = text.trim()
  if (!raw) return

  const prepared = prepareTextForSpeech(raw)
  if (!prepared) return

  const syn = window.speechSynthesis
  syn.cancel()
  // Chrome/Chromium: synthesis may stay paused until resume(); without this, speak() can be silent.
  try {
    if (syn.paused) syn.resume()
  } catch {
    /* ignore */
  }

  const run = (): void => {
    try {
      if (syn.paused) syn.resume()
    } catch {
      /* ignore */
    }
    const u = new SpeechSynthesisUtterance(prepared)
    u.lang = 'en-US'
    u.rate = 0.95
    u.volume = 1
    const voice = pickEnglishVoice()
    if (voice) u.voice = voice
    syn.speak(u)
  }

  if (syn.getVoices().length > 0) {
    run()
    return
  }

  let played = false
  const once = () => {
    if (played) return
    played = true
    syn.removeEventListener('voiceschanged', once)
    run()
  }
  syn.addEventListener('voiceschanged', once)
  window.setTimeout(() => {
    if (!played) once()
  }, 200)
}

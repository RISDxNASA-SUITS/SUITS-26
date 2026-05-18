function pickEnglishVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    voices.find((v) => v.lang.toLowerCase().includes("en"))
  )
}

export function prepareTextForSpeech(text) {
  let s = text.normalize("NFKC").trim()
  s = s.replace(/[\u2080-\u2089]/g, (ch) =>
    String.fromCharCode(0x30 + (ch.charCodeAt(0) - 0x2080)),
  )
  return s
}

export function stop() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
}

export function speak(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const raw = text.trim()
  if (!raw) return

  const prepared = prepareTextForSpeech(raw)
  if (!prepared) return

  const syn = window.speechSynthesis
  syn.cancel()
  try {
    if (syn.paused) syn.resume()
  } catch {
    /* ignore */
  }

  const run = () => {
    try {
      if (syn.paused) syn.resume()
    } catch {
      /* ignore */
    }
    const u = new SpeechSynthesisUtterance(prepared)
    u.lang = "en-US"
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
    syn.removeEventListener("voiceschanged", once)
    run()
  }
  syn.addEventListener("voiceschanged", once)
  window.setTimeout(() => {
    if (!played) once()
  }, 200)
}

export function speakQueued(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const raw = text.trim()
  if (!raw) return

  const prepared = prepareTextForSpeech(raw)
  if (!prepared) return

  const syn = window.speechSynthesis
  try {
    if (syn.paused) syn.resume()
  } catch {
    /* ignore */
  }

  const run = () => {
    const u = new SpeechSynthesisUtterance(prepared)
    u.lang = "en-US"
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
    syn.removeEventListener("voiceschanged", once)
    run()
  }
  syn.addEventListener("voiceschanged", once)
  window.setTimeout(() => {
    if (!played) once()
  }, 200)
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SAMPLE_1 = `Doctor: Hi, I'm Dr Lewis. What brings you in today?
Patient: Hey. I wanted to get checked. I had casual sex about a week ago and I've been thinking about getting some Doxy
Doctor: Thanks for coming in. We can definitely do a full STI screen today. I'll ask a few questions so I understand your risk and what you might need. Is that okay?
Patient: Yeah, that's fine.
Doctor: When was your last STI test?
Patient: Maybe three or four months ago. Everything was clear.
Doctor: And since then, how many new partners have you had?
Patient: Around four guys. All casual.
Doctor: And you have sex with men only?
Patient: Yeah, just men.
Doctor: What kind of sex did you have—oral, anal, both?
Patient: Both. Mostly I'm the bottom.
Doctor: And with those partners, did you use condoms always, sometimes, or not usually?
Patient: Sometimes, it depended on the situation.
Doctor: The partner last week, did you use condoms?
Patient: No, we didn't.
Doctor: Okay. Any symptoms since then—pain when you pee, discharge, sores, rashes, fever, swollen glands?
Patient: No, nothing like that.
Doctor: Have you ever had an STI before?
Patient: I had chlamydia once when I was younger. That's it.
Doctor: Any history of syphilis?
Patient: No.
Doctor: Was there any alcohol or use drugs last time you had sex?
Patient: I drank a smoked a bit but no, nothing heavy.
Doctor: Any other drugs at all? like coke, ketamine, pills, GHB?
Patient: No, none of that.
Doctor: Thanks for being open. It helps me understand your overall risk. Now, about doxyPEP—can you tell me what made you think you might need it?
Patient: I saw stuff online saying it can stop STIs after sex.
Doctor: It's good you asked. DoxyPEP is something we offer to people at higher ongoing risk, but it only works when taken within a certain time window after sex. It needs to be taken no later than 72 hours of exposure, and you're outside that window now. So it wouldn't help for the sex you had last week.
Patient: Oh, okay. I didn't realise it had a time limit.
Doctor: That's really common. You do have some risk, but based on what you've told me, you don't meet the criteria for that today.
Patient: That makes sense.
Doctor: We can still do a full STI screen today—throat, rectal, and urine tests for chlamydia and gonorrhoea, plus blood tests for HIV, syphilis. That will give us a clear picture.
Patient: Yeah, that's what I want.
Doctor: Looking at your notes, I can see that you're up to date with all your Hep A and B vaccines but there's nothing on record about an be HPV vaccine. Have you had the HPV vaccine?
Patient: I don't think so. I don't remember ever getting it.
Doctor: In that case, we can offer it today. It protects against genital warts and some cancers, and it's recommended for gay and bisexual men up to age 45.
Patient: Yeah, I'd like to get that.
Doctor: Great. We'll get your tests done and give you the first of two HPV dose, you'll have to book an appointment with us in 6-months but don't worry we'll send you a text reminding you closer to the time.
Doctor: Your test results should come through in a few days so we will be in touch, is that okay?
Patient: Perfect.
Doctor: Would you like some condoms today?
Patient: Yes please.
Doctor: Cool, let's get those tests done.`

const SAMPLE_2 = `Nurse: Hiya, I'm Lucy, one of the nurses today. What can I help you with?
Patient: I just wanted an STI check. I've started seeing someone new and thought it'd be good to get tested.
Nurse: No problem at all, we can do that. I just need to ask a few questions first, is that alright?
Patient: Yeah, that's fine.
Nurse: Are you getting any symptoms at all? Things like unusual discharge, pain when you wee, bleeding between periods, tummy or pelvic pain, any sores or rashes?
Patient: No, none of that. I feel okay.
Nurse: Any fevers or swollen glands?
Patient: No.
Nurse: When was your last period?
Patient: About two weeks ago. They've been a bit up and down lately because I've been stressed with work.
Nurse: Any chance you could be pregnant?
Patient: No. I'm on the pill and I take it every day.
Nurse: Any medical conditions or allergies?
Patient: No allergies. Just mild asthma but it's under control.
Nurse: Have you had any STIs before?
Patient: Yeah, I had chlamydia when I was about 19, but that got treated.
Nurse: Have you ever had tests for HIV or syphilis, or hepatitis?
Patient: Yeah, my GP did them last year. Everything was clear.
Nurse: Are you sexually active at the moment?
Patient: Yes.
Nurse: When was the last time you had sex?
Patient: Four days ago.
Nurse: Was that with the same partner you mentioned?
Patient: Yeah.
Nurse: And how long have you been seeing them?
Patient: About six weeks.
Nurse: How many partners have you had in the last three months?
Patient: Just him.
Nurse: Do you know if he's seeing anyone else?
Patient: He says he's not. We haven't had the official "are we exclusive" chat, but I don't think he is.
Nurse: Okay. What kind of sex do you have together — oral, vaginal, anal?
Patient: Oral and vaginal. No anal.
Nurse: And condoms — do you use them?
Patient: We did at the start, like the first couple of times, but then stopped. Probably shouldn't have, which is why I'm here.
Nurse: Any partners you're worried might have an STI?
Patient: Not that I know of. He said he had a test "a while ago" but didn't say when.
Nurse: When you have sex, do either of you drink or use drugs?
Patient: Just drinks sometimes. The times we didn't use condoms were when we'd had a few. No drugs.
Nurse: Okay. Are you feeling safe in the relationship?
Patient: Yeah, completely.
Nurse: No pressure around sex or contraception?
Patient: No, nothing like that.
Nurse: Any concerns about controlling behaviour or anything that makes you uncomfortable?
Patient: No.
Nurse: You're on the pill — is it suiting you alright?
Patient: Yeah, it's fine. I changed to a different one a few months ago because the old one made me spot, but this one's been fine.
Nurse: And you remember to take it most days?
Patient: Yeah, I'm good with it.
Nurse: Right. Because you've got a new partner and you haven't always used condoms, we'll do a full STI screen today.
Patient: Yeah, that's what I want.
Nurse: So that'll be a self-taken vaginal swab for chlamydia and gonorrhoea, and a blood test for HIV and syphilis. We don't need to check for hepatitis today as you don't have any risks for that.
Patient: Okay, that's fine.
Nurse: Results normally come through in a few days. If anything comes back positive we'll give you a call, and if everything's negative you'll get a text.
Patient: Perfect.
Nurse: Would you like some condoms today?
Patient: Yes please.
Nurse: Great. And if you notice anything unusual — discharge, pain, bleeding, anything at all — just come back in.
Patient: I will.
Nurse: Great. Let's get those tests done.`

/**
 * Parse raw dialogue text into an array of { speaker, text } lines.
 * A speaker is any token before the first ":" on a line.
 * Lines without a colon are merged into the previous line.
 */
function parseDialogue(raw) {
  const lines = raw.split(/\r?\n/)
  const result = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && colonIndex < 40) {
      const speaker = line.slice(0, colonIndex).trim()
      const text = line.slice(colonIndex + 1).trim()
      if (speaker && text) {
        result.push({ speaker, text })
        continue
      }
    }

    if (result.length > 0) {
      result[result.length - 1].text += ' ' + line
    } else {
      result.push({ speaker: 'Narrator', text: line })
    }
  }

  return result
}

function pickDefaultVoices(voices) {
  if (!voices.length) return { a: '', b: '' }

  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voices

  const maleHints = ['male', 'david', 'mark', 'george', 'daniel', 'alex', 'fred', 'james']
  const femaleHints = ['female', 'zira', 'susan', 'hazel', 'samantha', 'victoria', 'karen', 'moira', 'lucy']

  const findBy = (hints) =>
    pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)))

  const a = findBy(maleHints) || pool[0]
  const b = findBy(femaleHints) || pool.find((v) => v !== a) || pool[0]

  return { a: a?.voiceURI || '', b: b?.voiceURI || '' }
}

const STORAGE_KEY = 'dual-voice-state'

const KOKORO_VOICES = [
  { id: 'af_heart', name: 'Heart (Female)', gender: 'female' },
  { id: 'af_bella', name: 'Bella (Female)', gender: 'female' },
  { id: 'af_sarah', name: 'Sarah (Female)', gender: 'female' },
  { id: 'af_nova', name: 'Nova (Female)', gender: 'female' },
  { id: 'am_adam', name: 'Adam (Male)', gender: 'male' },
  { id: 'am_michael', name: 'Michael (Male)', gender: 'male' },
  { id: 'bf_emma', name: 'Emma (Female, British)', gender: 'female' },
  { id: 'bm_george', name: 'George (Male, British)', gender: 'male' },
]



const PUTER_VOICES = [
  { id: 'Matthew', name: 'Matthew (Male)', gender: 'male', engine: 'neural' },
  { id: 'Joey', name: 'Joey (Male)', gender: 'male', engine: 'neural' },
  { id: 'Kevin', name: 'Kevin (Male)', gender: 'male', engine: 'neural' },
  { id: 'Joanna', name: 'Joanna (Female)', gender: 'female', engine: 'neural' },
  { id: 'Salli', name: 'Salli (Female)', gender: 'female', engine: 'neural' },
  { id: 'Kendra', name: 'Kendra (Female)', gender: 'female', engine: 'neural' },
  { id: 'Ivy', name: 'Ivy (Female)', gender: 'female', engine: 'neural' },
  { id: 'Ruth', name: 'Ruth (Female)', gender: 'female', engine: 'neural' },
  { id: 'Gregory', name: 'Gregory (Male)', gender: 'male', engine: 'neural' },
  { id: 'Danielle', name: 'Danielle (Female)', gender: 'female', engine: 'neural' },
  { id: 'Stephen', name: 'Stephen (Male)', gender: 'male', engine: 'neural' },
]

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function App() {
  const stored = loadStored()
  const [ttsEngine, setTtsEngine] = useState(stored.ttsEngine || 'browser')
  const [puterUser, setPuterUser] = useState(null)
  const [text, setText] = useState(stored.text || '')
  const [activeSample, setActiveSample] = useState(stored.activeSample ?? null)
  const [voices, setVoices] = useState([])
  const [voiceA, setVoiceA] = useState(stored.voiceA || '')
  const [voiceB, setVoiceB] = useState(stored.voiceB || '')
  const [puterVoiceA, setPuterVoiceA] = useState(stored.puterVoiceA || 'Matthew')
  const [puterVoiceB, setPuterVoiceB] = useState(stored.puterVoiceB || 'Joanna')
  const [kokoroVoiceA, setKokoroVoiceA] = useState(stored.kokoroVoiceA || 'am_adam')
  const [kokoroVoiceB, setKokoroVoiceB] = useState(stored.kokoroVoiceB || 'af_heart')
  const [kokoroStatus, setKokoroStatus] = useState('') // '', 'loading', 'ready'
  const [kokoroProgress, setKokoroProgress] = useState(null)
  const [rateA, setRateA] = useState(stored.rateA ?? stored.rate ?? 1)
  const [rateB, setRateB] = useState(stored.rateB ?? stored.rate ?? 1)
  const [lineRates, setLineRates] = useState(stored.lineRates || {})
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [error, setError] = useState('')
  // 'all' or a speaker key (lowercased speaker name)
  const [filter, setFilter] = useState('all')
  // 'sequential' plays all lines in order, 'single' plays only the clicked/current line
  const [playMode, setPlayMode] = useState(stored.playMode || 'sequential')

  const generationRef = useRef(0)
  const currentIndexRef = useRef(-1)
  const settingsRef = useRef({})
  const puterAudioRef = useRef(null)
  const transcriptListRef = useRef(null)
  const playableIndicesRef = useRef([])
  const playModeRef = useRef('sequential')
  const workerRef = useRef(null)
  const pendingResolveRef = useRef(null)
  const pendingRejectRef = useRef(null)

  useEffect(() => {
    playModeRef.current = playMode
  }, [playMode])

  useEffect(() => {
    settingsRef.current = { voiceA, voiceB, rateA, rateB, lineRates, ttsEngine, puterVoiceA, puterVoiceB, kokoroVoiceA, kokoroVoiceB }
  }, [voiceA, voiceB, rateA, rateB, lineRates, ttsEngine, puterVoiceA, puterVoiceB, kokoroVoiceA, kokoroVoiceB])

  // Persist user state to localStorage
  useEffect(() => {
    try {
      const data = { text, activeSample, voiceA, voiceB, puterVoiceA, puterVoiceB, kokoroVoiceA, kokoroVoiceB, rateA, rateB, playMode, lineRates, ttsEngine }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore (storage full / disabled)
    }
  }, [text, activeSample, voiceA, voiceB, puterVoiceA, puterVoiceB, kokoroVoiceA, kokoroVoiceB, rateA, rateB, playMode, lineRates, ttsEngine])

  // Reset line-specific rates when the dialogue script text changes
  useEffect(() => {
    setLineRates({})
  }, [text])

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) {
      setError('Your browser does not support the Web Speech API.')
      return
    }

    const loadVoices = () => {
      const list = synth.getVoices()
      if (list.length) setVoices(list)
    }

    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)
    const retry = setTimeout(loadVoices, 250)
    const retry2 = setTimeout(loadVoices, 1000)

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices)
      clearTimeout(retry)
      clearTimeout(retry2)
    }
  }, [])

  // Check Puter auth status
  useEffect(() => {
    if (ttsEngine !== 'puter') return
    if (typeof window.puter === 'undefined') return
    const checkAuth = async () => {
      try {
        const signedIn = await window.puter.auth.isSignedIn()
        if (signedIn) {
          const user = await window.puter.auth.getUser()
          setPuterUser(user)
        } else {
          setPuterUser(null)
        }
      } catch {
        setPuterUser(null)
      }
    }
    checkAuth()
  }, [ttsEngine])

  useEffect(() => {
    if (!voices.length) return
    setVoiceA((prev) => prev || pickDefaultVoices(voices).a)
    setVoiceB((prev) => prev || pickDefaultVoices(voices).b)
  }, [voices])

  // Initialize and manage Kokoro worker
  useEffect(() => {
    if (ttsEngine === 'kokoro') {
      if (!workerRef.current) {
        setKokoroStatus('loading')
        setKokoroProgress(0)

        const worker = new Worker(new URL('./kokoro.worker.js', import.meta.url), { type: 'module' })
        workerRef.current = worker

        worker.onmessage = (e) => {
          const { type, status, info, error, wav } = e.data
          if (type === 'progress') {
            if (info.status === 'progress') {
              let pct = info.progress
              if (pct !== undefined) {
                if (pct <= 1) pct = pct * 100
                setKokoroProgress(Math.round(pct))
              }
            } else if (info.status === 'ready' || info.status === 'done') {
              setKokoroProgress(100)
            }
          } else if (type === 'load-status') {
            if (status === 'ready') {
              setKokoroStatus('ready')
              setKokoroProgress(null)
            }
          } else if (type === 'error') {
            setError(`Kokoro error: ${error}`)
            setKokoroStatus('')
            setKokoroProgress(null)
            setIsPlaying(false)
            if (pendingRejectRef.current) {
              pendingRejectRef.current(new Error(error))
              pendingRejectRef.current = null
            }
          } else if (type === 'done') {
            if (pendingResolveRef.current) {
              pendingResolveRef.current(wav)
              pendingResolveRef.current = null
              pendingRejectRef.current = null
            }
          }
        }

        worker.postMessage({ type: 'load' })
      }
    } else {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        setKokoroStatus('')
        setKokoroProgress(null)
      }
    }
  }, [ttsEngine])

  // Terminate worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const parsed = useMemo(() => parseDialogue(text), [text])

  const speakerAssignments = useMemo(() => {
    const map = {}
    let nextSlot = 'A'
    for (const { speaker } of parsed) {
      const key = speaker.toLowerCase()
      if (!map[key]) {
        map[key] = { label: speaker, slot: nextSlot }
        nextSlot = nextSlot === 'A' ? 'B' : 'A'
      }
    }
    return map
  }, [parsed])

  // If the active filter points at a speaker that no longer exists, fall back to 'all'.
  useEffect(() => {
    if (filter !== 'all' && !speakerAssignments[filter]) {
      setFilter('all')
    }
  }, [speakerAssignments, filter])

  // Indices in `parsed` that match the current filter. Used for display AND playback order.
  const playableIndices = useMemo(() => {
    if (filter === 'all') return parsed.map((_, i) => i)
    return parsed
      .map((line, i) => ({ i, key: line.speaker.toLowerCase() }))
      .filter(({ key }) => key === filter)
      .map(({ i }) => i)
  }, [parsed, filter])

  playableIndicesRef.current = playableIndices

  // Only keep English voices
  const englishVoices = useMemo(
    () => voices.filter((v) => v.lang?.toLowerCase().startsWith('en')),
    [voices],
  )

  const getVoiceByURI = useCallback(
    (uri) => voices.find((v) => v.voiceURI === uri) || null,
    [voices],
  )

  const updateCurrent = useCallback((i) => {
    currentIndexRef.current = i
    setCurrentIndex(i)
  }, [])

  // Auto-scroll the active transcript item into view
  useEffect(() => {
    if (currentIndex < 0) return
    const list = transcriptListRef.current
    if (!list) return
    const el = list.querySelector(`[data-line-index="${currentIndex}"]`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentIndex])

  const startFrom = useCallback(
    (startAt) => {
      if (!parsed.length) {
        setError('There is nothing to read. Paste a dialogue first.')
        return
      }
      if (ttsEngine === 'kokoro' && kokoroStatus === 'loading') {
        setError('Kokoro model is still loading. Please wait.')
        return
      }
      const queue = playableIndicesRef.current
      if (!queue.length) {
        setError('No lines match the current filter.')
        return
      }

      // Find the position in the filtered queue that is >= startAt.
      let queuePos = queue.findIndex((idx) => idx >= startAt)
      if (queuePos === -1) queuePos = 0

      generationRef.current += 1
      const myGen = generationRef.current

      window.speechSynthesis?.cancel()
      if (puterAudioRef.current) {
        puterAudioRef.current.pause()
        puterAudioRef.current = null
      }
      setError('')
      setIsPlaying(true)
      setIsPaused(false)

      // Pre-fetch cache for Puter TTS (key: queue pos -> Audio promise)
      // Only prefetch 1 line ahead to avoid "too many concurrent requests"
      const audioCache = new Map()

      const prefetchNext = (currentPos) => {
        const nextPos = currentPos + 1
        const currentQueue = playableIndicesRef.current
        if (nextPos >= currentQueue.length) return
        if (audioCache.has(nextPos)) return
        const idx = currentQueue[nextPos]
        const { speaker, text: lineText } = parsed[idx]
        const assignment = speakerAssignments[speaker.toLowerCase()]
        const slot = assignment?.slot || 'A'
        const settings = settingsRef.current
        const voiceId = slot === 'A' ? settings.puterVoiceA : settings.puterVoiceB
        const voiceInfo = PUTER_VOICES.find(v => v.id === voiceId)
        const eng = voiceInfo?.engine || 'neural'
        const promise = window.puter.ai.txt2speech(lineText, { voice: voiceId, engine: eng })
        audioCache.set(nextPos, promise)
      }

      const speakAt = (pos) => {
        if (myGen !== generationRef.current) return
        const currentQueue = playableIndicesRef.current
        if (pos >= currentQueue.length) {
          setIsPlaying(false)
          setIsPaused(false)
          updateCurrent(-1)
          return
        }

        const i = currentQueue[pos]
        const { speaker, text: line } = parsed[i]
        const assignment = speakerAssignments[speaker.toLowerCase()]
        const slot = assignment?.slot || 'A'

        const settings = settingsRef.current
        const engineType = settings.ttsEngine || 'browser'

        if (engineType === 'kokoro') {
          // Kokoro AI TTS (runs in background Web Worker)
          updateCurrent(i)
          const speakRate = settings.lineRates?.[i] ?? (slot === 'A' ? settings.rateA : settings.rateB)
          const voiceId = slot === 'A' ? settings.kokoroVoiceA : settings.kokoroVoiceB

          const runKokoro = async () => {
            try {
              if (kokoroStatus !== 'ready' || !workerRef.current) {
                setError('Kokoro model is still loading. Please wait.')
                setIsPlaying(false)
                updateCurrent(-1)
                return
              }

              // Send generation request to worker and wait for 'done'
              const wav = await new Promise((resolve, reject) => {
                pendingResolveRef.current = resolve
                pendingRejectRef.current = reject
                workerRef.current.postMessage({ type: 'generate', text: line, voice: voiceId })
              })

              if (myGen !== generationRef.current) return

              const blob = new Blob([wav], { type: 'audio/wav' })
              const url = URL.createObjectURL(blob)
              const audioEl = new Audio(url)
              audioEl.playbackRate = speakRate
              puterAudioRef.current = audioEl
              audioEl.onended = () => {
                URL.revokeObjectURL(url)
                if (myGen !== generationRef.current) return
                puterAudioRef.current = null
                if (playModeRef.current === 'single') {
                  setIsPlaying(false)
                  setIsPaused(false)
                  return
                }
                speakAt(pos + 1)
              }
              audioEl.onerror = () => {
                URL.revokeObjectURL(url)
                if (myGen !== generationRef.current) return
                puterAudioRef.current = null
                setError('Kokoro TTS playback error.')
                setIsPlaying(false)
                updateCurrent(-1)
              }
              audioEl.play()
            } catch (err) {
              if (myGen !== generationRef.current) return
              setError(`Kokoro TTS error: ${err.message || err}`)
              setIsPlaying(false)
              updateCurrent(-1)
            }
          }
          runKokoro()
        } else if (engineType === 'puter') {
          // Puter.js TTS with pre-fetching
          updateCurrent(i)
          const speakRate = settings.lineRates?.[i] ?? (slot === 'A' ? settings.rateA : settings.rateB)

          if (typeof window.puter === 'undefined' || !window.puter?.ai?.txt2speech) {
            setError('Puter.js is not loaded. Check your internet connection.')
            setIsPlaying(false)
            return
          }

          // Prefetch only the next line
          prefetchNext(pos)

          // Get audio from cache or fetch now
          const audioPromise = audioCache.get(pos) || (() => {
            const voiceId = slot === 'A' ? settings.puterVoiceA : settings.puterVoiceB
            const voiceInfo = PUTER_VOICES.find(v => v.id === voiceId)
            const eng = voiceInfo?.engine || 'neural'
            return window.puter.ai.txt2speech(line, { voice: voiceId, engine: eng })
          })()

          audioPromise
            .then((audio) => {
              if (myGen !== generationRef.current) return
              const audioEl = audio instanceof Audio ? audio : new Audio(URL.createObjectURL(audio))
              audioEl.playbackRate = speakRate
              puterAudioRef.current = audioEl
              audioEl.onended = () => {
                if (myGen !== generationRef.current) return
                puterAudioRef.current = null
                if (playModeRef.current === 'single') {
                  setIsPlaying(false)
                  setIsPaused(false)
                  return
                }
                speakAt(pos + 1)
              }
              audioEl.onerror = () => {
                if (myGen !== generationRef.current) return
                puterAudioRef.current = null
                setError('Puter TTS playback error.')
                setIsPlaying(false)
                updateCurrent(-1)
              }
              audioEl.play()
            })
            .catch((err) => {
              if (myGen !== generationRef.current) return
              setError(`Puter TTS error: ${err.message || err}`)
              setIsPlaying(false)
              updateCurrent(-1)
            })
        } else {
          // Browser Web Speech API
          const synth = window.speechSynthesis
          if (!synth) {
            setError('Your browser does not support the Web Speech API.')
            return
          }

          const { voiceA: va, voiceB: vb, rateA: ra, rateB: rb, lineRates: lr } = settings
          const voice = getVoiceByURI(slot === 'A' ? va : vb)

          const utter = new SpeechSynthesisUtterance(line)
          if (voice) utter.voice = voice
          utter.rate = lr?.[i] ?? (slot === 'A' ? ra : rb)
          utter.lang = voice?.lang || 'en-US'

          utter.onstart = () => {
            if (myGen !== generationRef.current) return
            updateCurrent(i)
          }
          utter.onend = () => {
            if (myGen !== generationRef.current) return
            if (playModeRef.current === 'single') {
              setIsPlaying(false)
              setIsPaused(false)
              return
            }
            speakAt(pos + 1)
          }
          utter.onerror = (e) => {
            if (myGen !== generationRef.current) return
            if (e.error === 'canceled' || e.error === 'interrupted') return
            setError(`Speech error: ${e.error}`)
            setIsPlaying(false)
            setIsPaused(false)
            updateCurrent(-1)
          }

          synth.speak(utter)
        }
      }

      speakAt(queuePos)
    },
    [parsed, speakerAssignments, getVoiceByURI, updateCurrent],
  )

  const play = useCallback(() => {
    if (isPaused) {
      if (puterAudioRef.current) {
        puterAudioRef.current.play()
      } else {
        window.speechSynthesis.resume()
      }
      setIsPaused(false)
      return
    }
    if (isPlaying) return

    const queue = playableIndicesRef.current
    if (!queue.length) return

    // Start from the current line if it's still in the filtered queue,
    // otherwise from the first playable line.
    const cur = currentIndexRef.current
    const startAt = cur >= 0 && queue.includes(cur) ? cur : queue[0]
    startFrom(startAt)
  }, [isPaused, isPlaying, startFrom])

  const pause = useCallback(() => {
    if (!isPlaying || isPaused) return
    if (puterAudioRef.current) {
      puterAudioRef.current.pause()
    } else {
      window.speechSynthesis.pause()
    }
    setIsPaused(true)
  }, [isPlaying, isPaused])

  const stop = useCallback(() => {
    generationRef.current += 1
    window.speechSynthesis.cancel()
    if (puterAudioRef.current) {
      puterAudioRef.current.pause()
      puterAudioRef.current = null
    }
    if (pendingRejectRef.current) {
      pendingRejectRef.current(new Error('Playback stopped.'))
      pendingRejectRef.current = null
    }
    pendingResolveRef.current = null
    setIsPlaying(false)
    setIsPaused(false)
    updateCurrent(-1)
  }, [updateCurrent])

  const next = useCallback(() => {
    const queue = playableIndicesRef.current
    if (!queue.length) return
    const cur = currentIndexRef.current
    const curPos = queue.indexOf(cur)
    const targetPos = curPos < 0 ? 0 : curPos + 1
    if (targetPos >= queue.length) {
      stop()
      return
    }
    startFrom(queue[targetPos])
  }, [startFrom, stop])

  const previous = useCallback(() => {
    const queue = playableIndicesRef.current
    if (!queue.length) return
    const cur = currentIndexRef.current
    const curPos = queue.indexOf(cur)
    const targetPos = curPos <= 0 ? 0 : curPos - 1
    startFrom(queue[targetPos])
  }, [startFrom])

  const jumpTo = useCallback(
    (i) => {
      if (i < 0 || i >= parsed.length) return
      startFrom(i)
    },
    [parsed.length, startFrom],
  )

  useEffect(() => {
    return () => {
      generationRef.current += 1
      window.speechSynthesis?.cancel()
      if (puterAudioRef.current) {
        puterAudioRef.current.pause()
        puterAudioRef.current = null
      }
    }
  }, [])

  // Stop any running playback when the filter changes; user can hit Play to restart.
  useEffect(() => {
    generationRef.current += 1
    window.speechSynthesis?.cancel()
    if (puterAudioRef.current) {
      puterAudioRef.current.pause()
      puterAudioRef.current = null
    }
    setIsPlaying(false)
    setIsPaused(false)
    updateCurrent(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const voicesLoading = voices.length === 0 && !error
  const speakerEntries = Object.values(speakerAssignments)
  const hasDialogue = parsed.length > 0
  const currentPosInQueue = playableIndices.indexOf(currentIndex)
  const canPrev = playableIndices.length > 0 && currentPosInQueue > 0
  const canNext =
    playableIndices.length > 0 &&
    (currentPosInQueue === -1 ? true : currentPosInQueue < playableIndices.length - 1)

  return (
    <div className="min-h-full xl:h-full xl:overflow-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-50 overflow-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 xl:py-3 flex flex-col min-h-full xl:h-full xl:min-h-0">
        <header className="mb-3 sm:mb-4 xl:mb-3 text-center shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            Dual-Voice Dialogue Player
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Paste a script, pick two voices, and let each character speak in turn.
          </p>
        </header>

        {/* TTS Engine Toggle */}
        <div className="mb-3 sm:mb-4 xl:mb-3 flex flex-col items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">TTS Engine:</span>
            <select
              value={ttsEngine}
              onChange={(e) => { stop(); setTtsEngine(e.target.value) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            >
              <option value="browser">🖥️ Browser (Offline)</option>
              <option value="kokoro">🧠 Kokoro AI (Offline, HD)</option>
              <option value="puter">☁️ Cloud - Puter (Online)</option>
            </select>
            {kokoroStatus === 'loading' && ttsEngine === 'kokoro' && (
              <span className="text-xs text-amber-600 animate-pulse">
                Loading model{kokoroProgress !== null ? ` (${kokoroProgress}%)` : ''}...
              </span>
            )}
            {kokoroStatus === 'ready' && ttsEngine === 'kokoro' && (
              <span className="text-xs text-emerald-600">✓ Ready</span>
            )}
          </div>
          {ttsEngine === 'puter' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {puterUser ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-700 font-medium">
                    👤 {puterUser.username || puterUser.email || 'User'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await window.puter.auth.signOut()
                      setPuterUser(null)
                      await window.puter.auth.signIn()
                      const user = await window.puter.auth.getUser()
                      setPuterUser(user)
                    }}
                    className="rounded-md px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Đổi tài khoản
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await window.puter.auth.signIn()
                    const user = await window.puter.auth.getUser()
                    setPuterUser(user)
                  }}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition"
                >
                  Đăng nhập Puter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Audio Samples Section - hidden for now
        <section className="mb-3 sm:mb-4 xl:mb-3 rounded-2xl bg-white shadow-md shadow-slate-200/60 ring-1 ring-slate-100 p-4 sm:p-5 xl:p-4 shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            🎧 Audio Samples
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AudioPlayer src="/Sample1.mp3" label="Sample 1" accent="indigo" />
            <AudioPlayer src="/Sample2.mp3" label="Sample 2" accent="rose" />
          </div>
        </section>
        */}

        <main className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 p-4 sm:p-5 lg:p-6 xl:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6 flex-1 min-h-0">
            {/* LEFT: Input + controls */}
            <section className="flex flex-col min-w-0 min-h-0 overflow-y-auto rounded-xl xl:rounded-none xl:bg-transparent xl:p-0 xl:border-0 bg-blue-50/50 border border-blue-100 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <label className="block text-sm font-medium text-slate-700">
                  Dialogue script
                </label>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    title="Clear text"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <ClearIcon />
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={'Nurse: Hello, how can I help?\nPatient: I just need a check-up.'}
                className="w-full flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[120px]"
              />
              <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-slate-500">
                  Format each line as{' '}
                  <code className="bg-slate-100 rounded px-1">Speaker: text</code>. The first speaker becomes Character A, the second becomes Character B.
                </p>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setText(SAMPLE_1); setActiveSample(1) }}
                    className={`text-xs font-medium transition ${activeSample === 1
                        ? 'text-indigo-800 underline underline-offset-2 font-bold'
                        : 'text-indigo-600 hover:text-indigo-800 hover:underline'
                      }`}
                  >
                    Sample 1
                  </button>
                  <span className="text-xs text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => { setText(SAMPLE_2); setActiveSample(2) }}
                    className={`text-xs font-medium transition ${activeSample === 2
                        ? 'text-indigo-800 underline underline-offset-2 font-bold'
                        : 'text-indigo-600 hover:text-indigo-800 hover:underline'
                      }`}
                  >
                    Sample 2
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ttsEngine === 'browser' ? (
                  <>
                    <VoiceSelect
                      label={`Voice for Character A${speakerEntries[0] ? ` · ${speakerEntries[0].label}` : ''}`}
                      value={voiceA}
                      onChange={setVoiceA}
                      voices={englishVoices}
                      loading={voicesLoading}
                      accent="indigo"
                    />
                    <VoiceSelect
                      label={`Voice for Character B${speakerEntries[1] ? ` · ${speakerEntries[1].label}` : ''}`}
                      value={voiceB}
                      onChange={setVoiceB}
                      voices={englishVoices}
                      loading={voicesLoading}
                      accent="rose"
                    />
                  </>
                ) : ttsEngine === 'kokoro' ? (
                  <>
                    <KokoroVoiceSelect
                      label={`Voice for Character A${speakerEntries[0] ? ` · ${speakerEntries[0].label}` : ''}`}
                      value={kokoroVoiceA}
                      onChange={setKokoroVoiceA}
                      accent="indigo"
                    />
                    <KokoroVoiceSelect
                      label={`Voice for Character B${speakerEntries[1] ? ` · ${speakerEntries[1].label}` : ''}`}
                      value={kokoroVoiceB}
                      onChange={setKokoroVoiceB}
                      accent="rose"
                    />
                  </>
                ) : (
                  <>
                    <PuterVoiceSelect
                      label={`Voice for Character A${speakerEntries[0] ? ` · ${speakerEntries[0].label}` : ''}`}
                      value={puterVoiceA}
                      onChange={setPuterVoiceA}
                      accent="indigo"
                    />
                    <PuterVoiceSelect
                      label={`Voice for Character B${speakerEntries[1] ? ` · ${speakerEntries[1].label}` : ''}`}
                      value={puterVoiceB}
                      onChange={setPuterVoiceB}
                      accent="rose"
                    />
                  </>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Slider
                  label={`Rate for Character A${speakerEntries[0] ? ` · ${speakerEntries[0].label}` : ''}`}
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={rateA}
                  onChange={setRateA}
                />
                <Slider
                  label={`Rate for Character B${speakerEntries[1] ? ` · ${speakerEntries[1].label}` : ''}`}
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={rateB}
                  onChange={setRateB}
                />
              </div>

              {/* Playback controls */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ControlButton
                  onClick={previous}
                  disabled={!hasDialogue || voicesLoading || !canPrev}
                  title="Previous line"
                  variant="ghost"
                >
                  <PrevIcon />
                  <span className="hidden sm:inline">Previous</span>
                </ControlButton>

                {!isPlaying || isPaused ? (
                  <ControlButton
                    onClick={play}
                    disabled={!hasDialogue || voicesLoading || playableIndices.length === 0 || kokoroStatus === 'loading'}
                    title={isPaused ? 'Resume' : 'Play dialogue'}
                    variant="primary"
                  >
                    {kokoroStatus === 'loading' ? (
                      <>
                        <span className="animate-spin mr-1">⏳</span>
                        <span>Loading{kokoroProgress !== null ? ` (${kokoroProgress}%)` : ''}…</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon />
                        <span>{isPaused ? 'Resume' : 'Play'}</span>
                      </>
                    )}
                  </ControlButton>
                ) : (
                  <ControlButton onClick={pause} title="Pause" variant="primary">
                    <PauseIcon />
                    <span>Pause</span>
                  </ControlButton>
                )}

                <ControlButton
                  onClick={next}
                  disabled={!hasDialogue || voicesLoading || !canNext}
                  title="Next line"
                  variant="ghost"
                >
                  <span className="hidden sm:inline">Next</span>
                  <NextIcon />
                </ControlButton>

                <ControlButton
                  onClick={stop}
                  disabled={!isPlaying && !isPaused && currentIndex === -1}
                  title="Stop"
                  variant="dark"
                >
                  <StopIcon />
                  <span className="hidden sm:inline">Stop</span>
                </ControlButton>

                {voicesLoading && (
                  <span className="text-xs text-slate-500">Loading voices…</span>
                )}

                {hasDialogue && currentIndex >= 0 && (
                  <span className="ml-auto text-xs text-slate-500">
                    {currentPosInQueue >= 0 ? currentPosInQueue + 1 : 1}/{playableIndices.length}
                    {isPaused ? ' · paused' : ''}
                  </span>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </section>

            {/* RIGHT: Transcript */}
            <section className="flex flex-col min-w-0 min-h-0 max-h-[70vh] xl:max-h-none overflow-y-auto rounded-xl xl:rounded-none xl:bg-transparent xl:p-0 xl:border-0 bg-amber-50/50 border border-amber-100 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Transcript
                </h2>
                {hasDialogue && (
                  <span className="text-xs text-slate-400">
                    {filter === 'all'
                      ? `${parsed.length} line${parsed.length === 1 ? '' : 's'}`
                      : `${playableIndices.length} of ${parsed.length} lines`}
                  </span>
                )}
              </div>

              {/* Filter chips + play mode */}
              {hasDialogue && speakerEntries.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <FilterChip
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    variant="all"
                  >
                    All
                    <span className="ml-1.5 text-xs opacity-80">{parsed.length}</span>
                  </FilterChip>
                  {Object.entries(speakerAssignments).map(([key, { label, slot }]) => {
                    const count = parsed.reduce(
                      (n, l) => (l.speaker.toLowerCase() === key ? n + 1 : n),
                      0,
                    )
                    return (
                      <FilterChip
                        key={key}
                        active={filter === key}
                        onClick={() => setFilter(key)}
                        variant={slot === 'A' ? 'indigo' : 'rose'}
                      >
                        {label}
                        <span className="ml-1.5 text-xs opacity-80">{count}</span>
                      </FilterChip>
                    )
                  })}

                  <select
                    value={playMode}
                    onChange={(e) => setPlayMode(e.target.value)}
                    className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  >
                    <option value="sequential">Auto</option>
                    <option value="single">Single Line</option>
                  </select>
                </div>
              )}

              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4 min-h-0 overflow-y-auto">
                {!hasDialogue ? (
                  <div className="h-full flex items-center justify-center text-center text-sm text-slate-400 py-10">
                    Your dialogue will appear here after you paste a script.
                  </div>
                ) : playableIndices.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-sm text-slate-400 py-10">
                    No lines for this speaker.
                  </div>
                ) : (
                  <ol ref={transcriptListRef} className="space-y-2">
                    {playableIndices.map((i) => {
                      const line = parsed[i]
                      const assignment = speakerAssignments[line.speaker.toLowerCase()]
                      const slot = assignment?.slot || 'A'
                      const isActive = i === currentIndex
                      return (
                        <li key={i} data-line-index={i}>
                          <div
                            className={[
                              'rounded-lg border p-3 transition hover:shadow-sm flex flex-col gap-2 bg-white',
                              slot === 'A'
                                ? 'border-indigo-100 bg-indigo-50/50'
                                : 'border-rose-100 bg-rose-50/50',
                              isActive
                                ? 'ring-2 ring-offset-1 ' +
                                (slot === 'A' ? 'ring-indigo-400' : 'ring-rose-400')
                                : '',
                            ].join(' ')}
                          >
                            {/* Line header with character name and custom rate slider */}
                            <div className="flex items-center justify-between gap-4">
                              <span
                                className={[
                                  'rounded-full px-2 py-0.5 text-xs font-semibold text-white',
                                  slot === 'A' ? 'bg-indigo-600' : 'bg-rose-500',
                                ].join(' ')}
                              >
                                {line.speaker}
                              </span>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
                                <span>Rate: {(lineRates[i] ?? (slot === 'A' ? rateA : rateB)).toFixed(2)}x</span>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.05"
                                  value={lineRates[i] ?? (slot === 'A' ? rateA : rateB)}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    setLineRates((prev) => ({ ...prev, [i]: val }))
                                  }}
                                  className={[
                                    'w-20 sm:w-28 cursor-pointer h-1 rounded-lg bg-slate-200 appearance-none',
                                    slot === 'A' ? 'accent-indigo-600' : 'accent-rose-500',
                                  ].join(' ')}
                                />
                                {lineRates[i] !== undefined && lineRates[i] !== (slot === 'A' ? rateA : rateB) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLineRates((prev) => {
                                        const copy = { ...prev }
                                        delete copy[i]
                                        return copy
                                      })
                                    }}
                                    title="Reset to character default speed"
                                    className="text-slate-400 hover:text-rose-600 transition p-0.5"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Clickable text area to jump to / play this line */}
                            <button
                              type="button"
                              onClick={() => jumpTo(i)}
                              title="Play from this line"
                              className={[
                                'w-full text-left text-sm leading-relaxed transition focus:outline-none break-words',
                                isActive
                                  ? 'font-semibold text-slate-950'
                                  : 'text-slate-700 hover:text-slate-950 hover:underline decoration-slate-300',
                              ].join(' ')}
                            >
                              {line.text}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-4 py-2 text-center text-xs text-slate-400 shrink-0">
          Created by Tung Huynh
        </footer>
      </div>
    </div>
  )
}

// Shared ref: only one AudioPlayer can play at a time
let activeAudioElement = null

function AudioPlayer({ src, label, accent }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const bgClass = accent === 'rose' ? 'bg-rose-50/50' : 'bg-indigo-50/50'
  const borderClass = accent === 'rose' ? 'border-rose-100' : 'border-indigo-100'
  const labelClass = accent === 'rose' ? 'text-rose-600' : 'text-indigo-700'
  const btnClass = accent === 'rose'
    ? 'text-rose-600 bg-rose-100 hover:bg-rose-200'
    : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
  const progressClass = accent === 'rose' ? 'bg-rose-400' : 'bg-indigo-500'
  const trackClass = 'bg-slate-200'

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      if (activeAudioElement && activeAudioElement !== audio) {
        activeAudioElement.pause()
      }
      activeAudioElement = audio
      audio.play()
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    if (activeAudioElement && activeAudioElement !== audio) {
      activeAudioElement.pause()
    }
    activeAudioElement = audio
    audio.currentTime = 0
    audio.play()
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = pct * duration
  }

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-xl ${bgClass} border ${borderClass}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${labelClass}`}>{label}</span>
        <a
          href={src}
          download
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${btnClass} transition`}
        >
          <DownloadIcon />
          Download
        </a>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
      />

      {/* Progress bar */}
      <div
        className={`relative w-full h-2 rounded-full ${trackClass} cursor-pointer`}
        onClick={handleSeek}
      >
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${progressClass} transition-all duration-150`}
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={restart}
          title="Nghe lại"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
        >
          <RestartIcon />
        </button>
        <button
          type="button"
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5) }}
          title="-5s"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
        >
          -5
        </button>
        <button
          type="button"
          onClick={togglePlay}
          title={playing ? 'Pause' : 'Play'}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white transition ${accent === 'rose' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5) }}
          title="+5s"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
        >
          +5
        </button>
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

function VoiceSelect({ label, value, onChange, voices, loading, accent }) {
  const ringAccent =
    accent === 'rose'
      ? 'focus:ring-rose-200 focus:border-rose-400'
      : 'focus:ring-indigo-200 focus:border-indigo-400'

  const getGenderLabel = (name) => {
    const n = name.toLowerCase()
    const femaleHints = [
      'female', 'zira', 'susan', 'hazel', 'samantha', 'victoria', 'karen', 'moira',
      'lucy', 'linda', 'catherine', 'helena', 'elsa', 'sabina', 'heera', 'irina',
      'haruka', 'hanhan', 'tracy', 'huihui', 'yaoyao', 'ayumi', 'heami',
      'hedda', 'hortense', 'paulina', 'maria', 'katja', 'caroline', 'julie',
      'neerja', 'pattara', 'yelena', 'ekaterina', 'lili', 'yating', 'xiaoxiao',
      'xiaoyi', 'jenny', 'aria', 'sara', 'sonia', 'natasha', 'svetlana',
      'google us english', 'google uk english female',
      'google deutsch', 'google español', 'google français', 'google italiano',
      'google português', 'google polski', 'google nederlands', 'google русский',
      'google 日本語', 'google 한국의', 'google हिन्दी', 'google bahasa indonesia',
      'google 普通话', 'google 粵語', 'google 國語'
    ]
    const maleHints = [
      'male', 'david', 'mark', 'george', 'daniel', 'alex', 'fred', 'james',
      'richard', 'sean', 'ravi', 'frank', 'cosimo', 'pablo', 'paul', 'ichiro',
      'naayf', 'zhiwei', 'kangkang', 'adam', 'guy', 'ryan', 'liam',
      'google uk english male'
    ]
    if (maleHints.some((h) => n.includes(h))) return 'Men'
    if (femaleHints.some((h) => n.includes(h))) return 'Women'
    return 'Women' // default fallback for unrecognized Google TTS voices (most are female)
  }

  return (
    <label className="block min-w-0">
      <span className="block text-sm font-medium text-slate-700 mb-1 truncate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 ${ringAccent} disabled:cursor-not-allowed disabled:bg-slate-100`}
      >
        {loading && <option>Loading voices…</option>}
        {!loading && voices.length === 0 && <option>No voices available</option>}
        {!loading &&
          voices.map((v) => {
            const gender = getGenderLabel(v.name)
            return (
              <option key={v.voiceURI} value={v.voiceURI}>
                [{gender}] {v.name} — {v.lang}
                {v.default ? ' (default)' : ''}
              </option>
            )
          })}
      </select>
    </label>
  )
}

function PuterVoiceSelect({ label, value, onChange, accent }) {
  const ringAccent =
    accent === 'rose'
      ? 'focus:ring-rose-200 focus:border-rose-400'
      : 'focus:ring-indigo-200 focus:border-indigo-400'

  return (
    <label className="block min-w-0">
      <span className="block text-sm font-medium text-slate-700 mb-1 truncate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 ${ringAccent}`}
      >
        {PUTER_VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function KokoroVoiceSelect({ label, value, onChange, accent }) {
  const ringAccent =
    accent === 'rose'
      ? 'focus:ring-rose-200 focus:border-rose-400'
      : 'focus:ring-indigo-200 focus:border-indigo-400'

  return (
    <label className="block min-w-0">
      <span className="block text-sm font-medium text-slate-700 mb-1 truncate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 ${ringAccent}`}
      >
        {KOKORO_VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{value.toFixed(2)}x</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </label>
  )
}

function FilterChip({ active, onClick, variant = 'all', children }) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition border'
  const styles = {
    all: active
      ? 'bg-slate-800 text-white border-slate-800'
      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
    indigo: active
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50',
    rose: active
      ? 'bg-rose-500 text-white border-rose-500'
      : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50',
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[variant] || styles.all}`}>
      {children}
    </button>
  )
}

function ControlButton({ onClick, disabled, title, variant = 'primary', children }) {
  const base =
    'inline-flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed'
  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-400 disabled:bg-indigo-300',
    dark:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 disabled:bg-slate-300',
    ghost:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-300 disabled:text-slate-300 disabled:hover:bg-white',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}
function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h12v12H6z" />
    </svg>
  )
}
function PrevIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zM20 6v12l-10-6z" />
    </svg>
  )
}
function NextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 6h2v12h-2zM4 6l10 6-10 6z" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function RestartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

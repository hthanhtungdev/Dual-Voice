import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SAMPLE_DIALOGUE = ''

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

export default function App() {
  const [text, setText] = useState(SAMPLE_DIALOGUE)
  const [voices, setVoices] = useState([])
  const [voiceA, setVoiceA] = useState('')
  const [voiceB, setVoiceB] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [error, setError] = useState('')
  // 'all' or a speaker key (lowercased speaker name)
  const [filter, setFilter] = useState('all')
  // 'sequential' plays all lines in order, 'single' plays only the clicked/current line
  const [playMode, setPlayMode] = useState('sequential')

  const generationRef = useRef(0)
  const currentIndexRef = useRef(-1)
  const settingsRef = useRef({})
  const transcriptListRef = useRef(null)
  const playableIndicesRef = useRef([])
  const playModeRef = useRef('sequential')

  useEffect(() => {
    playModeRef.current = playMode
  }, [playMode])

  useEffect(() => {
    settingsRef.current = { voiceA, voiceB, rate, pitch }
  }, [voiceA, voiceB, rate, pitch])

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

  useEffect(() => {
    if (!voices.length) return
    setVoiceA((prev) => prev || pickDefaultVoices(voices).a)
    setVoiceB((prev) => prev || pickDefaultVoices(voices).b)
  }, [voices])

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
      const synth = window.speechSynthesis
      if (!synth) {
        setError('Your browser does not support the Web Speech API.')
        return
      }
      if (!parsed.length) {
        setError('There is nothing to read. Paste a dialogue first.')
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

      synth.cancel()
      setError('')
      setIsPlaying(true)
      setIsPaused(false)

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

        const { voiceA: va, voiceB: vb, rate: r, pitch: p } = settingsRef.current
        const voice = getVoiceByURI(slot === 'A' ? va : vb)

        const utter = new SpeechSynthesisUtterance(line)
        if (voice) utter.voice = voice
        utter.rate = r
        utter.pitch = p
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

      speakAt(queuePos)
    },
    [parsed, speakerAssignments, getVoiceByURI, updateCurrent],
  )

  const play = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume()
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
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [isPlaying, isPaused])

  const stop = useCallback(() => {
    generationRef.current += 1
    window.speechSynthesis.cancel()
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
    }
  }, [])

  // Stop any running playback when the filter changes; user can hit Play to restart.
  useEffect(() => {
    generationRef.current += 1
    window.speechSynthesis?.cancel()
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-100 via-white to-indigo-50 overflow-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col flex-1 min-h-0">
        <header className="mb-4 sm:mb-5 text-center shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            Multi-Voice Dialogue Player
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Paste a script, pick two voices, and let each character speak in turn.
          </p>
        </header>

        <main className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 p-4 sm:p-5 lg:p-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6 flex-1 min-h-0">
            {/* LEFT: Input + controls */}
            <section className="flex flex-col min-w-0 min-h-0 overflow-y-auto">
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
              <p className="mt-2 text-xs text-slate-500">
                Format each line as{' '}
                <code className="bg-slate-100 rounded px-1">Speaker: text</code>. The first speaker becomes Character A, the second becomes Character B.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Slider label="Rate" min={0.5} max={1.5} step={0.05} value={rate} onChange={setRate} />
                <Slider label="Pitch" min={0.5} max={1.5} step={0.05} value={pitch} onChange={setPitch} />
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
                    disabled={!hasDialogue || voicesLoading || playableIndices.length === 0}
                    title={isPaused ? 'Resume' : 'Play dialogue'}
                    variant="primary"
                  >
                    <PlayIcon />
                    <span>{isPaused ? 'Resume' : 'Play'}</span>
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
            <section className="flex flex-col min-w-0 min-h-0 overflow-y-auto">
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
                          <button
                            type="button"
                            onClick={() => jumpTo(i)}
                            title="Play from this line"
                            className={[
                              'w-full text-left rounded-lg border px-3 py-2 text-sm transition hover:shadow-sm',
                              slot === 'A'
                                ? 'border-indigo-100 bg-indigo-50/70 hover:bg-indigo-50'
                                : 'border-rose-100 bg-rose-50/70 hover:bg-rose-50',
                              isActive
                                ? 'ring-2 ring-offset-1 ' +
                                  (slot === 'A' ? 'ring-indigo-400' : 'ring-rose-400')
                                : '',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold align-middle',
                                slot === 'A' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white',
                              ].join(' ')}
                            >
                              {line.speaker}
                            </span>
                            <span className="text-slate-800 align-middle break-words">
                              {line.text}
                            </span>
                          </button>
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
          Created by Huynh Thanh Tung
        </footer>
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

import { KokoroTTS } from 'kokoro-js'

let ttsInstance = null
let loading = false

self.addEventListener('message', async (event) => {
  const { type, text, voice } = event.data

  if (type === 'load') {
    if (ttsInstance) {
      self.postMessage({ type: 'load-status', status: 'ready' })
      return
    }
    if (loading) return
    loading = true

    try {
      ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
        dtype: 'q8',
        progress_callback: (info) => {
          self.postMessage({ type: 'progress', info })
        },
      })
      loading = false
      self.postMessage({ type: 'load-status', status: 'ready' })
    } catch (err) {
      loading = false
      self.postMessage({ type: 'error', error: err.message || err })
    }
  }

  if (type === 'generate') {
    try {
      if (!ttsInstance) {
        throw new Error('Model is not initialized yet.')
      }
      const audio = await ttsInstance.generate(text, { voice })
      const wav = audio.toWav()
      // Transfer the ArrayBuffer back to the main thread
      self.postMessage({ type: 'done', wav }, [wav])
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message || err })
    }
  }
})

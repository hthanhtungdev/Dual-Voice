# Multi-Voice Dialogue Player

A React + Tailwind app that reads dialogue scripts aloud using the browser's native `speechSynthesis` API, with a distinct voice per speaker.

## Run

```bash
npm install
npm run dev
```

Then open the shown local URL in a modern browser (Chrome, Edge, or Safari work best — they ship the most voices).

## How it works

- Paste a script where each line starts with `Speaker:` (e.g. `Nurse:`, `Patient:`, `Doctor:`).
- The first two distinct speakers are automatically assigned to Character A and Character B.
- Pick a system voice for each character from the dropdowns.
- Click **Play Dialogue**. Each line only starts after the previous one finishes (via `SpeechSynthesisUtterance.onend`).
- Click **Stop** to cancel playback immediately.

## Notes

- Available voices depend on your OS + browser. On Windows you typically get David (male) and Zira (female) out of the box.
- Some browsers load voices asynchronously; the app listens for `voiceschanged` and retries, so the dropdowns populate as soon as voices are ready.

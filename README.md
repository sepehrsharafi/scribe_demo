# scribe_demo

A doctor-facing AI medical scribe demo built with Next.js 16, React 19, Tailwind CSS 4, Motion, and Lucide icons.

The demo covers the complete consultation loop: consent-gated recording with pause and resume, attaching the patient during or after the recording, crash recovery, background processing, a structured note (triage vitals, a medications table with unconfirmed rows, highlighted uncertain phrases), direct editing, scoped AI revision with a before/after diff, transcript evidence with every speaker labelled, patient context beside the note, a consolidated patient history, version history, and one-tap approval.

All patient and visit information is synthetic. Audio capture, transcription, authentication, and persistence are represented by realistic front-end states; no clinical backend is connected. Recordings, added patients and approvals made during a demo are kept in a cookie so every page agrees on them — Settings → Privacy → Reset demo puts it back as it shipped.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run build
```

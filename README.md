# scribe_demo

A doctor-facing AI medical scribe demo built with Next.js 16, React 19, Tailwind CSS 4 and shadcn on Base UI.

The demo follows one visit from start to approval, on one page:

- **Start** — Home shows the day so far drawn to scale, with the time Scribe gave back, then asks "Who's next?"; the sidebar's New visit button (or the N key) asks the same. Pick the patient, tick consent, press Start. Anyone new is added with a name and a date of birth.
- **Context** — a written brief of what to know going in, drawn from the record and earlier notes (each one linked), the doctor's own notes for the visit, and attached files: images and PDFs, previewed in place.
- **Transcript** — the conversation, turn by turn, every voice labelled.
- **Note** — the clinical note as a rich-text document, headings included, saved as you type: uncertain phrases highlighted and explained, unconfirmed medications block approval, an examination nobody did stays an explicit gap.
- **Instructions** — the same plan as a short letter to the patient, just as editable; their medicines are read live from the note's table.

Recording runs in the visit's header and carries on in a corner card if the doctor leaves; in Chrome and Edge it also floats in a small always-on-top window when the doctor switches tabs (or pops out by hand). Finishing shows each processing step as it happens, then the note and instructions take its place. Approving signs both off without locking them — a later change is flagged until it is approved again. The sidebar lists every visit by day and says only what still needs the doctor.

All patient and visit information is synthetic. While recording, the microphone is opened so the browser treats the page as recording, but nothing is kept from it. Transcription, authentication and persistence are realistic front-end states; no clinical backend is connected. Recordings, added patients, retried uploads and approvals are kept in a cookie so every page agrees on them — Settings → Privacy → Reset demo puts it back as it shipped. Notes, files and edits to the write-up are kept in memory for the session.

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

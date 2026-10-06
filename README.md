# scribe_demo

A doctor-facing AI medical scribe demo built with Next.js 16, React 19, Tailwind CSS 4 and shadcn on Base UI.

Home shows the time Scribe gave back — today, this week and since the doctor started, against what the day would have taken without it — and the visits still waiting on the doctor. The sidebar lists every visit by day (search it with /), marks only what still needs the doctor, and starts the next one: **New visit** (or the N key) asks who it is with. Anyone new is added with a name and a date of birth.

A visit then lives on one page, with four tabs:

- **Context** — what to know going in: a one-line summary, each problem on the record with what earlier notes say about it (each one linked), the plan for the visit, the medications on record, and attached files — images and PDFs, previewed in place, dropped, chosen or pasted (scan with the computer's scanner app, copy, paste).
- **Note** — the clinical note as a rich-text document, headings included, saved as you type: uncertain phrases highlighted and explained, a medication table where unconfirmed medications block approval, vitals the doctor can rename, add and remove, and an examination nobody did stays an explicit gap.
- **Instructions** — the same plan as a short letter to the patient, just as editable; their medicines are read live from the note's table.
- **Transcript** — the conversation, turn by turn, every voice labelled.

One press of Start records — the button says that pressing it confirms the patient's consent. Recording runs in the visit's header; in Chrome and Edge, Start also opens a small always-on-top window that stays with the doctor across tabs and apps; without it, leaving the visit minimises the recording to a corner card rather than ending it. With nothing to record — a phone call, a home visit — the doctor can write the note themselves. Finishing shows each processing step as it happens, then the note and instructions take its place. Approving signs both off without locking them — a later change is flagged until it is approved again.

The demo also runs in Farsi and Arabic, right to left, interface and data alike, and in a dark theme — both switched from the account menu at the foot of the sidebar or on the sign-in screen.

All patient and visit information is synthetic. Sign-in is an email and a one-time code; in the demo any six digits are accepted. While recording, the microphone is opened so the browser treats the page as recording, but nothing is kept from it. Transcription, authentication and persistence are realistic front-end states; no clinical backend is connected. Recordings, added patients, retried uploads and approvals are kept in a cookie so every page agrees on them — Settings → Privacy → Reset demo puts it back as it shipped. Attached files and edits to the write-up are kept in memory for the session.

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

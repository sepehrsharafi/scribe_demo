// Synthetic demo data. No real patient information belongs in this file.

import type { Locale } from "@/lib/i18n/locales";
import { farsi } from "@/lib/demo-data-fa";

export type VisitStatus =
  | "uploading"
  | "transcribing"
  | "drafting"
  | "draft-ready"
  | "signed"
  | "failed";

export type Patient = {
  id: string;
  name: string;
  initials: string;
  dob: string;
  age: number;
  registered: string;
  /** The standing clinical picture, kept consistent with the notes below. */
  summary: PatientSummary;
};

export type PatientSummary = {
  problems: string[];
  medications: string[];
  allergies: string[];
};

export type Visit = {
  id: string;
  patientId: string;
  reason: string;
  date: string;
  dateLong: string;
  time: string;
  status: VisitStatus;
  duration: string;
  durationSeconds: number;
  failureReason?: string;
  /** Typed straight into the note: no audio, no transcript, no pipeline. */
  manual?: boolean;
};

export type NoteSectionId =
  | "reason"
  | "history"
  | "examination"
  | "assessment"
  | "plan";

export type NoteSection = {
  id: NoteSectionId;
  label: string;
  body: string;
  /** True when the consultation never covered this ground. Never filled in by the model. */
  gap?: boolean;
};

export type TranscriptLine = {
  speaker: "Doctor" | "Patient";
  time: string;
  text: string;
};

export type NoteVersion = {
  id: number;
  label: string;
  author: string;
  time: string;
  kind: "ai" | "manual" | "signature";
};

export type VisitFilter = "all" | "draft-ready" | "signed" | "failed";

/**
 * Everything in the demo that is written in a language. A second language is
 * this shape filled in again, keyed by the same ids; numbers, times and
 * statuses stay with the English source. Digits stay ASCII — the Farsi font
 * draws them as Persian numerals.
 */
export type DemoTranslation = {
  doctor: { name: string; initials: string; specialty: string; registration: string };
  today: { weekday: string; long: string };
  patients: Record<
    string,
    Pick<Patient, "name" | "initials" | "dob" | "registered" | "summary">
  >;
  visits: Record<string, Pick<Visit, "reason" | "date" | "dateLong" | "failureReason">>;
  statusMeta: Record<VisitStatus, { label: string; description: string }>;
  /** Section label and body, per visit, per section id. */
  notes: Record<string, Partial<Record<NoteSectionId, { label: string; body: string }>>>;
  /** The spoken text of each transcript line, in order. */
  transcripts: Record<string, string[]>;
  /** The label of each version, in order. */
  versions: Record<string, string[]>;
  /** Version authors, keyed by their English name. */
  authors: Record<string, string>;
  signedAt: Record<string, string>;
  visitFilters: Record<VisitFilter, string>;
};

const doctor = {
  name: "Dr. Priya Shah",
  initials: "PS",
  specialty: "General practice",
  registration: "GMC 7654321",
  email: "priya@scribe.demo",
};

const today = { weekday: "Tuesday", long: "22 September 2026" };

const patients: Patient[] = [
  {
    id: "p1",
    name: "Maya Thompson",
    initials: "MT",
    dob: "14 May 1988",
    age: 38,
    registered: "March 2021",
    summary: {
      problems: ["Persistent post-viral cough, since Aug 2026"],
      medications: [],
      allergies: [],
    },
  },
  {
    id: "p2",
    name: "Jon Bell",
    initials: "JB",
    dob: "02 November 1971",
    age: 54,
    registered: "August 2016",
    summary: {
      problems: ["Hypertension, controlled"],
      medications: ["Amlodipine 5 mg once daily"],
      allergies: [],
    },
  },
  {
    id: "p3",
    name: "Elena Marquez",
    initials: "EM",
    dob: "29 January 1995",
    age: 31,
    registered: "January 2024",
    summary: {
      problems: ["Migraine with aura", "Low-normal ferritin, repeat Dec 2026"],
      medications: ["Propranolol 40 mg twice daily"],
      allergies: ["Penicillin — rash"],
    },
  },
  {
    id: "p4",
    name: "Arthur Wright",
    initials: "AW",
    dob: "07 July 1948",
    age: 78,
    registered: "June 2009",
    summary: {
      problems: ["Type 2 diabetes", "Atrial fibrillation", "Osteoarthritis, both hips"],
      medications: [
        "Metformin 500 mg twice daily",
        "Apixaban 5 mg twice daily",
        "Bisoprolol 2.5 mg once daily",
        "Paracetamol 1 g as needed",
      ],
      allergies: [],
    },
  },
  {
    id: "p5",
    name: "Nadia Okonkwo",
    initials: "NO",
    dob: "23 March 1990",
    age: 36,
    registered: "November 2022",
    summary: {
      problems: ["Postnatal, delivered Aug 2026"],
      medications: [],
      allergies: ["Latex"],
    },
  },
  {
    id: "p6",
    name: "Tomas Lindqvist",
    initials: "TL",
    dob: "11 December 1966",
    age: 59,
    registered: "February 2018",
    summary: {
      problems: ["Right knee pain, medial, since Aug 2026"],
      medications: ["Ibuprofen 400 mg as needed"],
      allergies: [],
    },
  },
];

const visits: Visit[] = [
  {
    id: "v7",
    patientId: "p5",
    reason: "Postnatal check",
    date: "Today",
    dateLong: "22 Sep 2026",
    time: "10:05",
    status: "transcribing",
    duration: "16:52",
    durationSeconds: 1012,
  },
  {
    id: "v1",
    patientId: "p1",
    reason: "Persistent cough",
    date: "Today",
    dateLong: "22 Sep 2026",
    time: "09:20",
    status: "draft-ready",
    duration: "14:26",
    durationSeconds: 866,
  },
  {
    id: "v2",
    patientId: "p2",
    reason: "Blood pressure review",
    date: "Today",
    dateLong: "22 Sep 2026",
    time: "08:40",
    status: "signed",
    duration: "11:08",
    durationSeconds: 668,
  },
  {
    id: "v3",
    patientId: "p3",
    reason: "Migraine follow-up",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    time: "16:10",
    status: "signed",
    duration: "17:42",
    durationSeconds: 1062,
  },
  {
    id: "v4",
    patientId: "p4",
    reason: "Medication review",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    time: "14:30",
    status: "failed",
    duration: "09:18",
    durationSeconds: 558,
    failureReason: "Upload interrupted at 74%. The audio is safe on this device.",
  },
  {
    id: "v5",
    patientId: "p6",
    reason: "Knee pain, right",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    time: "11:15",
    status: "signed",
    duration: "12:40",
    durationSeconds: 760,
  },
  {
    id: "v6",
    patientId: "p1",
    reason: "Upper respiratory infection",
    date: "18 Aug 2026",
    dateLong: "18 Aug 2026",
    time: "15:45",
    status: "signed",
    duration: "08:54",
    durationSeconds: 534,
  },
  {
    // A phone call: nothing to record, so the note was typed straight in.
    id: "v8",
    patientId: "p3",
    reason: "Telephone review — blood results",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    time: "09:05",
    status: "signed",
    duration: "—",
    durationSeconds: 0,
    manual: true,
  },
];

const statusMeta: Record<
  VisitStatus,
  { label: string; tone: "signal" | "hold" | "ink" | "mute"; description: string }
> = {
  uploading: {
    label: "Uploading",
    tone: "mute",
    description: "Audio is being sent in resumable parts.",
  },
  transcribing: {
    label: "Transcribing",
    tone: "mute",
    description: "Separating doctor and patient turns.",
  },
  drafting: {
    label: "Drafting",
    tone: "mute",
    description: "Building the structured note from the transcript.",
  },
  "draft-ready": {
    label: "Ready to review",
    tone: "hold",
    description: "A draft note is waiting for your review.",
  },
  signed: {
    label: "Signed",
    tone: "ink",
    description: "Locked clinical record. Later changes become addenda.",
  },
  failed: {
    label: "Needs attention",
    tone: "signal",
    description: "Processing was interrupted. The audio is safe and the visit can be retried.",
  },
};

const notes: Record<string, NoteSection[]> = {
  v1: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Persistent dry cough for approximately six weeks, most noticeable at night.",
    },
    {
      id: "history",
      label: "History",
      body: "Maya reports a dry, non-productive cough that began around six weeks ago following an upper respiratory infection. It is worse at night and occasionally interrupts sleep. She denies fever, breathlessness, chest pain, haemoptysis, reflux symptoms, and recent travel. She has tried an over-the-counter cough syrup without meaningful improvement.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "No examination was discussed during this consultation.",
      gap: true,
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Persistent post-viral cough. No red-flag symptoms reported during the consultation.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Discussed watchful waiting and supportive care. Maya will trial honey and warm fluids before bed. Review in two weeks if the cough has not improved, or sooner for breathlessness, chest pain, fever, or haemoptysis. A chest X-ray was offered; Maya declined today and prefers to review symptoms first.",
    },
  ],
  v2: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Routine review of hypertension, six months after the last medication change.",
    },
    {
      id: "history",
      label: "History",
      body: "Jon reports good adherence to amlodipine and no side effects. Home readings have averaged around 138/84. He has reduced added salt and walks three times a week. He denies headaches, visual disturbance, chest pain, and ankle swelling.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "Blood pressure 136/82 in the right arm, seated. Pulse regular at 72 beats per minute.",
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Hypertension, adequately controlled on current therapy. No reported end-organ symptoms.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Continue amlodipine at the current dose. Continue home monitoring twice weekly and bring the log to the next review. Routine bloods including renal function before the next appointment. Review in six months, sooner if home readings exceed 150/95.",
    },
  ],
  v3: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Follow-up of migraine with aura, eight weeks after starting preventive treatment.",
    },
    {
      id: "history",
      label: "History",
      body: "Elena reports a reduction from roughly six migraine days per month to two. Attacks remain preceded by visual aura but are shorter and less severe. She has had no adverse effects from propranolol. Sleep remains irregular on night shifts, which she identifies as her main trigger.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "No examination was discussed during this consultation.",
      gap: true,
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Migraine with aura, responding to preventive therapy. Shift-pattern sleep disruption remains the dominant trigger.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Continue propranolol at the current dose. Continue the headache diary for a further eight weeks. Discussed sleep timing around night shifts. Review in three months, or sooner if attack frequency rises above four days per month.",
    },
  ],
  v5: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Right knee pain following a hiking trip three weeks ago.",
    },
    {
      id: "history",
      label: "History",
      body: "Tomas describes medial right knee pain that began after a long descent while hiking. Pain is worse going downstairs and after sitting. He reports no locking, no giving way, and no swelling. He has been taking ibuprofen intermittently with partial relief.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "Tenderness reported over the medial joint line. Full range of movement described without effusion.",
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Likely medial collateral strain or early medial compartment irritation. No mechanical symptoms suggesting meniscal tear.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Relative rest with continued light activity. Quadriceps strengthening exercises provided. Continue simple analgesia as required. Review in four weeks if not settling, and consider physiotherapy referral at that point.",
    },
  ],
  v6: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Three days of sore throat, nasal congestion, and fatigue.",
    },
    {
      id: "history",
      label: "History",
      body: "Maya reports a sore throat and blocked nose for three days with mild fatigue. No fever, no difficulty swallowing, and no shortness of breath. She has been drinking fluids and taking paracetamol.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "No examination was discussed during this consultation.",
      gap: true,
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Self-limiting upper respiratory tract infection.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Supportive care with fluids and simple analgesia. Advised to return if symptoms persist beyond ten days, or sooner with fever, breathlessness, or difficulty swallowing.",
    },
  ],
  // Written by hand: a phone call, so there is no transcript behind it.
  v8: [
    {
      id: "reason",
      label: "Reason for visit",
      body: "Telephone review of the blood tests requested at the migraine follow-up.",
    },
    {
      id: "history",
      label: "History",
      body: "Elena called for her results. Headaches have been less frequent since starting the preventer — two in the past fortnight, neither with visual aura. Sleeping better. No new neurological symptoms and no rebound analgesia use.",
    },
    {
      id: "examination",
      label: "Examination findings",
      body: "Telephone consultation. No examination performed.",
      gap: true,
    },
    {
      id: "assessment",
      label: "Assessment",
      body: "Full blood count, renal and liver function all within normal limits. Ferritin 42 µg/L — low-normal. Migraine control improving on the current preventer.",
    },
    {
      id: "plan",
      label: "Plan",
      body: "Results explained and reassurance given. Dietary iron advice discussed; ferritin to be repeated in three months. Continue the preventer at the current dose and keep the headache diary. Review in person in six weeks, sooner if the headaches change in character.",
    },
  ],
};

const transcripts: Record<string, TranscriptLine[]> = {
  v1: [
    {
      speaker: "Doctor",
      time: "00:18",
      text: "Tell me what has been happening with the cough, Maya.",
    },
    {
      speaker: "Patient",
      time: "00:24",
      text: "It started about six weeks ago after I had a cold. The cold went away but the cough just stayed.",
    },
    {
      speaker: "Doctor",
      time: "01:06",
      text: "Is it bringing anything up? Any fever, shortness of breath, pain in your chest, or blood?",
    },
    {
      speaker: "Patient",
      time: "01:14",
      text: "No, none of those. It is dry. It is mostly annoying at night and sometimes wakes me up.",
    },
    {
      speaker: "Patient",
      time: "02:31",
      text: "I tried one of those cough syrups from the pharmacy but it did not really do anything.",
    },
    {
      speaker: "Doctor",
      time: "04:38",
      text: "We can arrange a chest X-ray now, or give it another two weeks as there are no warning signs in what you have told me.",
    },
    {
      speaker: "Patient",
      time: "04:51",
      text: "I would rather wait and see for now, if that is safe.",
    },
    {
      speaker: "Doctor",
      time: "05:02",
      text: "That is reasonable. Try honey and warm drinks before bed, and come back in two weeks if it has not settled. Sooner if you get breathless, feverish, or see any blood.",
    },
  ],
  v2: [
    {
      speaker: "Doctor",
      time: "00:22",
      text: "How have the home readings been since we changed the dose?",
    },
    {
      speaker: "Patient",
      time: "00:29",
      text: "Pretty steady. Mostly around 138 over 84, give or take.",
    },
    {
      speaker: "Doctor",
      time: "01:40",
      text: "Any headaches, changes in your vision, chest pain, or swelling in your ankles?",
    },
    {
      speaker: "Patient",
      time: "01:48",
      text: "None of that. I have been walking three times a week and cut back on salt.",
    },
    {
      speaker: "Doctor",
      time: "03:12",
      text: "Your reading here is 136 over 82, pulse 72 and regular. That is where we want it.",
    },
    {
      speaker: "Doctor",
      time: "06:05",
      text: "Let us keep the same dose, carry on with the home log, and I will book bloods before we meet again in six months.",
    },
  ],
  v3: [
    {
      speaker: "Doctor",
      time: "00:15",
      text: "How many migraine days have you had this month?",
    },
    {
      speaker: "Patient",
      time: "00:21",
      text: "Two. It was about six before I started the propranolol, so it is a big difference.",
    },
    {
      speaker: "Patient",
      time: "02:44",
      text: "I still get the visual aura first, but the headache afterwards is shorter and not as bad.",
    },
    {
      speaker: "Doctor",
      time: "04:02",
      text: "Any side effects from the propranolol? Tiredness, cold hands, anything like that?",
    },
    {
      speaker: "Patient",
      time: "04:10",
      text: "No, nothing. The night shifts are still the thing that sets it off.",
    },
    {
      speaker: "Doctor",
      time: "07:20",
      text: "Stay on the same dose, keep the diary going for another couple of months, and we will review in three.",
    },
  ],
  v5: [
    {
      speaker: "Doctor",
      time: "00:19",
      text: "When did the knee start bothering you?",
    },
    {
      speaker: "Patient",
      time: "00:26",
      text: "About three weeks ago, after a long hike. It was the way down that did it.",
    },
    {
      speaker: "Doctor",
      time: "01:33",
      text: "Does it ever lock, or give way underneath you? Any swelling?",
    },
    {
      speaker: "Patient",
      time: "01:41",
      text: "No locking, no giving way, and it has not swollen up. It is worse on stairs going down.",
    },
    {
      speaker: "Doctor",
      time: "03:58",
      text: "It is tender along the inside joint line, and you are moving it fully without any fluid there.",
    },
    {
      speaker: "Doctor",
      time: "08:12",
      text: "Keep moving but ease off the long descents, do these quad exercises, and come back in four weeks if it is still there.",
    },
  ],
  v6: [
    {
      speaker: "Doctor",
      time: "00:14",
      text: "What has been going on over the last few days?",
    },
    {
      speaker: "Patient",
      time: "00:20",
      text: "Sore throat, blocked nose, and I am just tired. Three days now.",
    },
    {
      speaker: "Doctor",
      time: "01:02",
      text: "Any fever, trouble swallowing, or breathlessness?",
    },
    {
      speaker: "Patient",
      time: "01:09",
      text: "No, none of that. Just miserable.",
    },
    {
      speaker: "Doctor",
      time: "03:30",
      text: "This should settle by itself. Fluids and paracetamol, and come back if it drags past ten days.",
    },
  ],
};

const versions: Record<string, NoteVersion[]> = {
  v1: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "09:38", kind: "ai" },
    { id: 2, label: "History corrected", author: "You", time: "09:41", kind: "manual" },
  ],
  v2: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "08:54", kind: "ai" },
    { id: 2, label: "Plan rewritten as actions", author: "Scribe", time: "08:58", kind: "ai" },
    { id: 3, label: "Signed and locked", author: "Dr. Priya Shah", time: "09:01", kind: "signature" },
  ],
  v3: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "16:29", kind: "ai" },
    { id: 2, label: "Signed and locked", author: "Dr. Priya Shah", time: "16:34", kind: "signature" },
  ],
  v5: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "11:33", kind: "ai" },
    { id: 2, label: "Examination clarified", author: "You", time: "11:36", kind: "manual" },
    { id: 3, label: "Signed and locked", author: "Dr. Priya Shah", time: "11:38", kind: "signature" },
  ],
  v6: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "15:58", kind: "ai" },
    { id: 2, label: "Signed and locked", author: "Dr. Priya Shah", time: "16:02", kind: "signature" },
  ],
  v8: [
    { id: 1, label: "Written by hand", author: "Dr. Priya Shah", time: "09:12", kind: "manual" },
    { id: 2, label: "Signed and locked", author: "Dr. Priya Shah", time: "09:16", kind: "signature" },
  ],
};

const signedAt: Record<string, string> = {
  v2: "22 Sep 2026 at 09:01",
  v3: "21 Sep 2026 at 16:34",
  v5: "21 Sep 2026 at 11:38",
  v6: "18 Aug 2026 at 16:02",
  v8: "21 Sep 2026 at 09:16",
};

/** The worklist filters. Lives here so server components can read them too. */
const visitFilters: { id: VisitFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft-ready", label: "To review" },
  { id: "signed", label: "Signed" },
  { id: "failed", label: "Attention" },
];

/** Audio restored from the device after the browser closed mid-visit. */
const recovery = { patientId: "p1", seconds: 522 };

type Dataset = {
  doctor: typeof doctor;
  today: typeof today;
  patients: Patient[];
  visits: Visit[];
  statusMeta: typeof statusMeta;
  notes: Record<string, NoteSection[]>;
  transcripts: Record<string, TranscriptLine[]>;
  versions: Record<string, NoteVersion[]>;
  signedAt: Record<string, string>;
  visitFilters: typeof visitFilters;
  recovery: typeof recovery;
};

const english: Dataset = {
  doctor,
  today,
  patients,
  visits,
  statusMeta,
  notes,
  transcripts,
  versions,
  signedAt,
  visitFilters,
  recovery,
};

/** The English dataset with every written field replaced by its translation. */
function translated(to: DemoTranslation): Dataset {
  const byId = <T,>(list: Record<string, T[]>, map: (item: T, index: number, id: string) => T) =>
    Object.fromEntries(
      Object.entries(list).map(([id, items]) => [id, items.map((item, i) => map(item, i, id))]),
    );

  return {
    doctor: { ...doctor, ...to.doctor },
    today: to.today,
    patients: patients.map((patient) => ({ ...patient, ...to.patients[patient.id] })),
    visits: visits.map((visit) => ({ ...visit, ...to.visits[visit.id] })),
    statusMeta: Object.fromEntries(
      Object.entries(statusMeta).map(([status, meta]) => [
        status,
        { ...meta, ...to.statusMeta[status as VisitStatus] },
      ]),
    ) as typeof statusMeta,
    notes: byId(notes, (section, _, id) => ({ ...section, ...to.notes[id]?.[section.id] })),
    transcripts: byId(transcripts, (line, i, id) => ({
      ...line,
      text: to.transcripts[id]?.[i] ?? line.text,
    })),
    versions: byId(versions, (version, i, id) => ({
      ...version,
      label: to.versions[id]?.[i] ?? version.label,
      author: to.authors[version.author] ?? version.author,
    })),
    signedAt: { ...signedAt, ...to.signedAt },
    visitFilters: visitFilters.map((filter) => ({ ...filter, label: to.visitFilters[filter.id] })),
    recovery,
  };
}

/** Lookups over one language's dataset. Every screen reads the demo through this. */
function views(data: Dataset) {
  const getPatient = (patientId: string | undefined) =>
    data.patients.find((patient) => patient.id === patientId);
  const getVisit = (visitId: string | undefined) =>
    data.visits.find((visit) => visit.id === visitId);
  const firstDraft = data.versions.v1[0];

  return {
    ...data,
    getPatient,
    getVisit,
    getPatientForVisit: (visitId: string | undefined) => getPatient(getVisit(visitId)?.patientId),
    getVisitsForPatient: (patientId: string) =>
      data.visits.filter((visit) => visit.patientId === patientId),
    getNote: (visitId: string): NoteSection[] | undefined => data.notes[visitId],
    getTranscript: (visitId: string): TranscriptLine[] => data.transcripts[visitId] ?? [],
    getVersions: (visitId: string): NoteVersion[] => data.versions[visitId] ?? [firstDraft],
    /** Visits that cannot move forward without the doctor. */
    actionableVisits: data.visits.filter(
      (visit) => visit.status === "draft-ready" || visit.status === "failed",
    ),
    /** The consultations held today. The English label is the stable key. */
    todaysVisits: data.visits.filter((_, index) => visits[index].date === "Today"),
    /**
     * The note a freshly captured demo consultation lands on. The source note is
     * Maya's, so it is rewritten for whoever was actually in the room.
     */
    freshNoteFor(firstName: string): NoteSection[] {
      const source = data.patients[0].name.split(" ")[0];
      if (firstName === source) return data.notes.v1;
      return data.notes.v1.map((section) => ({
        ...section,
        body: section.body
          .replaceAll(source, firstName)
          .replace(/\bShe\b/g, "They"),
      }));
    },
  };
}

export type Demo = ReturnType<typeof views>;

const datasets = { en: views(english), fa: views(translated(farsi)) };

/** The demo in one language. */
export function demo(locale: Locale): Demo {
  return datasets[locale];
}

/**
 * Writing a consultation up by hand costs roughly two thirds of the time the
 * consultation itself took. That ratio is the only assumption behind every
 * "time saved" figure in the product, and it is stated on screen rather than
 * hidden, because the number is the whole claim.
 */
const writeUpRatio = 0.65;

/** Minutes of write-up Scribe absorbed for these consultations. */
export function minutesSaved(list: Visit[]) {
  const seconds = list
    .filter((visit) => visit.status !== "failed")
    .reduce((total, visit) => total + visit.durationSeconds * writeUpRatio, 0);
  return Math.round(seconds / 60);
}

export function toVisitFilter(value: string | string[] | undefined): VisitFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return visitFilters.some((option) => option.id === candidate)
    ? (candidate as VisitFilter)
    : "all";
}

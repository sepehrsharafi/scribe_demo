// Synthetic demo data. No real patient information belongs in this file.

import type { Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";
import { farsi } from "@/lib/demo-data-fa";
import { formatDuration } from "@/lib/utils";
import {
  noChanges,
  recordedStatus,
  type WorkspaceChanges,
} from "@/lib/workspace";

export type VisitStatus =
  | "uploading"
  | "transcribing"
  | "drafting"
  | "draft-ready"
  | "approved"
  | "failed";

export type Patient = {
  id: string;
  name: string;
  initials: string;
  dob: string;
  age: number;
  registered: string;
  /** The standing clinical picture, kept consistent with the notes below. */
  record: ClinicalEntry[];
};

/** One problem, medication or allergy on the patient record, and where it came from. */
export type ClinicalEntry = {
  id: string;
  kind: "problem" | "medication" | "allergy";
  text: string;
  /** The consultation it was recorded at. Absent when it came with the registration record. */
  visitId?: string;
  /** The consultation at which it resolved or was stopped. */
  endedVisitId?: string;
};

export type Visit = {
  id: string;
  patientId: string;
  reason: string;
  date: string;
  dateLong: string;
  /** yyyy-mm-dd. The language-neutral key visits are sorted by. */
  day: string;
  time: string;
  status: VisitStatus;
  duration: string;
  durationSeconds: number;
  failureReason?: string;
  /** Typed straight into the note: no audio, no transcript, no pipeline. */
  manual?: boolean;
};

/** Every section a note can have, in the order it is read. */
export const noteOrder = [
  "reason",
  "history",
  "examination",
  "assessment",
  "medications",
  "tests",
  "advice",
] as const;

export type NoteSectionId = (typeof noteOrder)[number];

/** Section titles, in English. Screens render them through `t()`. */
export const sectionLabels: Record<NoteSectionId, string> = {
  reason: "Reason for visit",
  history: "History",
  examination: "Examination & vitals",
  assessment: "Assessment",
  medications: "Medications",
  tests: "Tests & referrals",
  advice: "Advice & follow-up",
};

/** Every section except medications is prose. Medications are a table. */
export type TextSectionId = Exclude<NoteSectionId, "medications">;

/** A phrase the model heard but could not be sure of, and why. */
export type Uncertain = { text: string; reason: string };

export type NoteSection = {
  id: TextSectionId;
  body: string;
  /** True when the consultation never covered this ground. Never filled in by the model. */
  gap?: boolean;
  /** Highlighted in the note until the doctor has checked them. */
  uncertain?: Uncertain[];
};

/** Taken before the doctor sees the patient. Shown at the top of Examination & vitals. */
export type Triage = {
  complaint: string;
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
  weight: string;
};

export type Medication = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  /** Why the model could not confirm this row. A note cannot be approved while any row has one. */
  unconfirmed?: string;
};

/**
 * A note holds only the sections the consultation produced — a section with
 * nothing in it is left out, except the examination, which is always kept so
 * that an examination nobody did stays a visible gap.
 */
export type Note = {
  triage?: Triage;
  sections: NoteSection[];
  medications: Medication[];
};

export type Speaker = "Doctor" | "Patient" | "Companion";

export type TranscriptLine = {
  speaker: Speaker;
  time: string;
  text: string;
};

export type NoteVersion = {
  id: number;
  label: string;
  author: string;
  time: string;
  kind: "ai" | "manual" | "approval";
};

export type VisitFilter = "all" | "draft-ready" | "approved" | "failed";

/** A record entry with the consultation it came from, as a doctor reads it in context. */
export type SourcedEntry = {
  entry: ClinicalEntry;
  /** Absent when the entry came with the registration record. */
  source?: Visit;
  /** Recorded at a consultation whose note is not approved yet. */
  pending: boolean;
};

/**
 * Everything in the demo that is written in a language. A second language is
 * this shape filled in again, keyed by the same ids; numbers, times and
 * statuses stay with the English source. Digits stay ASCII — the Farsi font
 * draws them as Persian numerals.
 */
export type DemoTranslation = {
  doctor: { name: string; initials: string; specialty: string; registration: string };
  today: { weekday: string; long: string; short: string; label: string };
  patients: Record<
    string,
    Pick<Patient, "name" | "initials" | "dob" | "registered"> & {
      /** Entry id → text. */
      record: Record<string, string>;
    }
  >;
  visits: Record<string, Pick<Visit, "reason" | "date" | "dateLong" | "failureReason">>;
  statusMeta: Record<VisitStatus, { label: string; description: string }>;
  notes: Record<
    string,
    {
      complaint?: string;
      sections: Partial<Record<TextSectionId, { body: string; uncertain?: Uncertain[] }>>;
      /** Medication id → the written fields of that row. */
      medications?: Record<string, Partial<Omit<Medication, "id">>>;
    }
  >;
  /** The spoken text of each transcript line, in order. */
  transcripts: Record<string, string[]>;
  /** The label of each version, in order. */
  versions: Record<string, string[]>;
  /** Version authors, keyed by their English name. */
  authors: Record<string, string>;
  approvedAt: Record<string, string>;
  visitFilters: Record<VisitFilter, string>;
};

const doctor = {
  name: "Dr. Priya Shah",
  initials: "PS",
  specialty: "General practice",
  registration: "GMC 7654321",
  email: "priya@scribe.demo",
};

const today = {
  weekday: "Tuesday",
  long: "22 September 2026",
  short: "22 Sep 2026",
  label: "Today",
  iso: "2026-09-22",
};

const patients: Patient[] = [
  {
    id: "p1",
    name: "Maya Thompson",
    initials: "MT",
    dob: "14 May 1988",
    age: 38,
    registered: "March 2021",
    record: [
      {
        id: "p1.1",
        kind: "problem",
        text: "Upper respiratory tract infection",
        visitId: "v6",
        endedVisitId: "v1",
      },
      { id: "p1.2", kind: "problem", text: "Persistent post-viral cough", visitId: "v1" },
      {
        id: "p1.3",
        kind: "medication",
        text: "Paracetamol 1 g up to four times daily, as needed",
        visitId: "v6",
      },
      {
        id: "p1.4",
        kind: "medication",
        text: "Simple linctus 5 ml at night, as needed",
        visitId: "v1",
      },
      { id: "p1.5", kind: "medication", text: "Cetirizine, most days", visitId: "v1" },
    ],
  },
  {
    id: "p2",
    name: "Jon Bell",
    initials: "JB",
    dob: "02 November 1971",
    age: 54,
    registered: "August 2016",
    record: [
      { id: "p2.1", kind: "problem", text: "Hypertension, controlled", visitId: "v2" },
      { id: "p2.2", kind: "medication", text: "Amlodipine 5 mg once daily", visitId: "v2" },
    ],
  },
  {
    id: "p3",
    name: "Elena Marquez",
    initials: "EM",
    dob: "29 January 1995",
    age: 31,
    registered: "January 2024",
    record: [
      { id: "p3.1", kind: "problem", text: "Migraine with aura", visitId: "v3" },
      {
        id: "p3.2",
        kind: "problem",
        text: "Low-normal ferritin, repeat Dec 2026",
        visitId: "v8",
      },
      {
        id: "p3.3",
        kind: "medication",
        text: "Propranolol 40 mg twice daily",
        visitId: "v3",
      },
      { id: "p3.4", kind: "allergy", text: "Penicillin — rash" },
    ],
  },
  {
    id: "p4",
    name: "Arthur Wright",
    initials: "AW",
    dob: "07 July 1948",
    age: 78,
    registered: "June 2009",
    record: [
      { id: "p4.1", kind: "problem", text: "Type 2 diabetes" },
      { id: "p4.2", kind: "problem", text: "Atrial fibrillation" },
      { id: "p4.3", kind: "problem", text: "Osteoarthritis, both hips" },
      { id: "p4.4", kind: "medication", text: "Metformin 500 mg twice daily" },
      { id: "p4.5", kind: "medication", text: "Apixaban 5 mg twice daily" },
      { id: "p4.6", kind: "medication", text: "Bisoprolol 2.5 mg once daily" },
      { id: "p4.7", kind: "medication", text: "Paracetamol 1 g as needed" },
      {
        id: "p4.8",
        kind: "medication",
        text: "Gliclazide once daily with breakfast",
        visitId: "v9",
      },
      { id: "p4.9", kind: "allergy", text: "Codeine — confusion" },
    ],
  },
  {
    id: "p5",
    name: "Nadia Okonkwo",
    initials: "NO",
    dob: "23 March 1990",
    age: 36,
    registered: "November 2022",
    record: [
      { id: "p5.1", kind: "problem", text: "Postnatal, delivered Aug 2026" },
      { id: "p5.2", kind: "allergy", text: "Latex" },
    ],
  },
  {
    id: "p6",
    name: "Tomas Lindqvist",
    initials: "TL",
    dob: "11 December 1966",
    age: 59,
    registered: "February 2018",
    record: [
      { id: "p6.1", kind: "problem", text: "Right knee pain, medial", visitId: "v5" },
      {
        id: "p6.2",
        kind: "medication",
        text: "Ibuprofen 400 mg up to three times daily, as needed",
        visitId: "v5",
      },
    ],
  },
];

const visits: Visit[] = [
  {
    id: "v9",
    patientId: "p4",
    reason: "Diabetes review",
    date: "Today",
    dateLong: "22 Sep 2026",
    day: "2026-09-22",
    time: "11:10",
    status: "draft-ready",
    duration: "13:05",
    durationSeconds: 785,
  },
  {
    id: "v7",
    patientId: "p5",
    reason: "Postnatal check",
    date: "Today",
    dateLong: "22 Sep 2026",
    day: "2026-09-22",
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
    day: "2026-09-22",
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
    day: "2026-09-22",
    time: "08:40",
    status: "approved",
    duration: "11:08",
    durationSeconds: 668,
  },
  {
    id: "v3",
    patientId: "p3",
    reason: "Migraine follow-up",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    day: "2026-09-21",
    time: "16:10",
    status: "approved",
    duration: "17:42",
    durationSeconds: 1062,
  },
  {
    id: "v4",
    patientId: "p4",
    reason: "Medication review",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    day: "2026-09-21",
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
    day: "2026-09-21",
    time: "11:15",
    status: "approved",
    duration: "12:40",
    durationSeconds: 760,
  },
  {
    // A phone call: nothing to record, so the note was typed straight in.
    id: "v8",
    patientId: "p3",
    reason: "Telephone review — blood results",
    date: "Yesterday",
    dateLong: "21 Sep 2026",
    day: "2026-09-21",
    time: "09:05",
    status: "approved",
    duration: "—",
    durationSeconds: 0,
    manual: true,
  },
  {
    id: "v6",
    patientId: "p1",
    reason: "Upper respiratory infection",
    date: "18 Aug 2026",
    dateLong: "18 Aug 2026",
    day: "2026-08-18",
    time: "15:45",
    status: "approved",
    duration: "08:54",
    durationSeconds: 534,
  },
];

const statusMeta: Record<
  VisitStatus,
  { label: string; tone: "signal" | "hold" | "ink" | "mute"; description: string }
> = {
  // The three pipeline stages share one word: the doctor only needs to know
  // the note is not ready yet. The stage itself is on the Activity tab.
  uploading: {
    label: "Processing",
    tone: "mute",
    description: "Uploading the audio in resumable parts.",
  },
  transcribing: {
    label: "Processing",
    tone: "mute",
    description: "Transcribing and separating the speakers.",
  },
  drafting: {
    label: "Processing",
    tone: "mute",
    description: "Building the structured note from the transcript.",
  },
  "draft-ready": {
    label: "Ready to review",
    tone: "hold",
    description: "A draft note is waiting for your review.",
  },
  approved: {
    label: "Approved",
    tone: "ink",
    description: "Locked clinical record. Later changes become addenda.",
  },
  failed: {
    label: "Needs attention",
    tone: "signal",
    description: "Processing was interrupted. The audio is safe and the visit can be retried.",
  },
};

const notes: Record<string, Note> = {
  v1: {
    triage: {
      complaint: "Dry cough, six weeks",
      bp: "118/76",
      hr: "78",
      temp: "36.8",
      spo2: "98",
      weight: "64",
    },
    sections: [
      {
        id: "reason",
        body: "Persistent dry cough for approximately six weeks, most noticeable at night.",
      },
      {
        id: "history",
        body: "Maya reports a dry, non-productive cough that began around six weeks ago following an upper respiratory infection. It is worse at night and occasionally interrupts sleep; Maya's partner, who attended the consultation, adds that it is worst in the early hours. No fever, breathlessness, chest pain, haemoptysis, reflux symptoms, or recent travel. An over-the-counter cough syrup gave no meaningful improvement. Taking an antihistamine, cetirizine, most days.",
        uncertain: [
          {
            text: "cetirizine",
            reason: "The patient was unsure of the name: “cetirizine, I think”.",
          },
        ],
      },
      {
        id: "examination",
        body: "No examination was discussed during this consultation.",
        gap: true,
      },
      {
        id: "assessment",
        body: "Persistent post-viral cough. No red-flag symptoms reported during the consultation.",
      },
      {
        id: "tests",
        body: "Chest X-ray offered; Maya declined today and prefers to review symptoms first. Reconsider at review if the cough persists.",
      },
      {
        id: "advice",
        body: "Watchful waiting with supportive care: honey and warm fluids before bed. Review in two weeks if the cough has not improved, or sooner for breathlessness, chest pain, fever, or haemoptysis.",
        uncertain: [
          {
            text: "two weeks",
            reason: "Said as “a couple of weeks” — confirm the interval.",
          },
        ],
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Simple linctus",
        dose: "5 ml",
        frequency: "At night, as needed",
        duration: "Up to 2 weeks",
      },
      {
        id: "m2",
        drug: "Cetirizine",
        dose: "",
        frequency: "Most days",
        duration: "Ongoing",
        unconfirmed: "Named by the patient as “cetirizine, I think”. The dose was not said.",
      },
    ],
  },
  v2: {
    triage: {
      complaint: "Blood pressure review",
      bp: "140/86",
      hr: "74",
      temp: "36.6",
      spo2: "98",
      weight: "88",
    },
    sections: [
      {
        id: "reason",
        body: "Routine review of hypertension, six months after the last medication change.",
      },
      {
        id: "history",
        body: "Jon reports good adherence to amlodipine and no side effects. Home readings have averaged around 138/84. Added salt reduced; walking three times a week. No headaches, visual disturbance, chest pain, or ankle swelling.",
      },
      {
        id: "examination",
        body: "Blood pressure 136/82 in the right arm, seated. Pulse regular at 72 beats per minute.",
      },
      {
        id: "assessment",
        body: "Hypertension, adequately controlled on current therapy. No reported end-organ symptoms.",
      },
      {
        id: "tests",
        body: "Routine bloods including renal function before the next appointment.",
      },
      {
        id: "advice",
        body: "Continue home monitoring twice weekly and bring the log to the next review. Review in six months, sooner if home readings exceed 150/95.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Amlodipine",
        dose: "5 mg",
        frequency: "Once daily",
        duration: "Ongoing",
      },
    ],
  },
  v3: {
    triage: {
      complaint: "Migraine follow-up",
      bp: "112/70",
      hr: "62",
      temp: "36.7",
      spo2: "99",
      weight: "58",
    },
    sections: [
      {
        id: "reason",
        body: "Follow-up of migraine with aura, eight weeks after starting preventive treatment.",
      },
      {
        id: "history",
        body: "Elena reports a reduction from roughly six migraine days per month to two. Attacks remain preceded by visual aura but are shorter and less severe. No adverse effects from propranolol. Sleep remains irregular on night shifts, which Elena identifies as the main trigger.",
      },
      {
        id: "examination",
        body: "No examination was discussed during this consultation.",
        gap: true,
      },
      {
        id: "assessment",
        body: "Migraine with aura, responding to preventive therapy. Shift-pattern sleep disruption remains the dominant trigger.",
      },
      {
        id: "tests",
        body: "Full blood count, renal and liver function, and ferritin.",
      },
      {
        id: "advice",
        body: "Continue the headache diary for a further eight weeks. Sleep timing around night shifts discussed. Review in three months, or sooner if attack frequency rises above four days per month.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Propranolol",
        dose: "40 mg",
        frequency: "Twice daily",
        duration: "Ongoing",
      },
    ],
  },
  v5: {
    triage: {
      complaint: "Right knee pain",
      bp: "128/80",
      hr: "70",
      temp: "36.6",
      spo2: "98",
      weight: "82",
    },
    sections: [
      {
        id: "reason",
        body: "Right knee pain following a hiking trip three weeks ago.",
      },
      {
        id: "history",
        body: "Tomas describes medial right knee pain that began after a long descent while hiking. Pain is worse going downstairs and after sitting. No locking, no giving way, and no swelling. Intermittent ibuprofen has given partial relief.",
      },
      {
        id: "examination",
        body: "Tenderness reported over the medial joint line. Full range of movement described without effusion.",
      },
      {
        id: "assessment",
        body: "Likely medial collateral strain or early medial compartment irritation. No mechanical symptoms suggesting meniscal tear.",
      },
      {
        id: "tests",
        body: "Consider physiotherapy referral at the four-week review if not settling.",
      },
      {
        id: "advice",
        body: "Relative rest with continued light activity; ease off long descents. Quadriceps strengthening exercises provided. Review in four weeks if not settling.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Ibuprofen",
        dose: "400 mg",
        frequency: "Up to three times daily with food, as needed",
        duration: "Up to 4 weeks",
      },
    ],
  },
  v6: {
    triage: {
      complaint: "Sore throat, blocked nose",
      bp: "116/74",
      hr: "84",
      temp: "37.4",
      spo2: "98",
      weight: "63",
    },
    // Nothing was requested or referred, so there is no Tests & referrals section.
    sections: [
      {
        id: "reason",
        body: "Three days of sore throat, nasal congestion, and fatigue.",
      },
      {
        id: "history",
        body: "Maya reports a sore throat and blocked nose for three days with mild fatigue. No fever, no difficulty swallowing, and no shortness of breath. Drinking fluids and taking paracetamol.",
      },
      {
        id: "examination",
        body: "No examination was discussed during this consultation.",
        gap: true,
      },
      {
        id: "assessment",
        body: "Self-limiting upper respiratory tract infection.",
      },
      {
        id: "advice",
        body: "Supportive care with fluids and rest. Return if symptoms persist beyond ten days, or sooner with fever, breathlessness, or difficulty swallowing.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Paracetamol",
        dose: "1 g",
        frequency: "Up to four times daily, as needed",
        duration: "Until symptoms settle",
      },
    ],
  },
  // Written by hand: a phone call, so there is no transcript and no triage.
  v8: {
    sections: [
      {
        id: "reason",
        body: "Telephone review of the blood tests requested at the migraine follow-up.",
      },
      {
        id: "history",
        body: "Elena called for her results. Headaches less frequent since starting the preventer — two in the past fortnight, neither with visual aura. Sleeping better. No new neurological symptoms and no rebound analgesia use.",
      },
      {
        id: "examination",
        body: "Telephone consultation. No examination performed.",
        gap: true,
      },
      {
        id: "assessment",
        body: "Full blood count, renal and liver function all within normal limits. Ferritin 42 µg/L — low-normal. Migraine control improving on the current preventer.",
      },
      {
        id: "tests",
        body: "Ferritin to be repeated in three months.",
      },
      {
        id: "advice",
        body: "Results explained and reassurance given. Dietary iron advice discussed. Keep the headache diary. Review in person in six weeks, sooner if the headaches change in character.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Propranolol",
        dose: "40 mg",
        frequency: "Twice daily",
        duration: "Ongoing",
      },
    ],
  },
  v9: {
    triage: {
      complaint: "Diabetes review",
      bp: "146/80",
      hr: "78",
      temp: "36.5",
      spo2: "96",
      weight: "79",
    },
    sections: [
      {
        id: "reason",
        body: "Review of type 2 diabetes control; home glucose readings running high.",
      },
      {
        id: "history",
        body: "Arthur reports fasting home readings of 8–9 mmol/L most mornings. His daughter, who attended and helps with his tablets, reports that the evening metformin is sometimes missed. No falls and no bleeding on apixaban; bruises easily.",
        uncertain: [
          {
            text: "8–9 mmol/L",
            reason: "The units were not said — only “eight or nine”.",
          },
        ],
      },
      {
        id: "examination",
        body: "Blood pressure 142/78. Pulse irregular at around 76 beats per minute, consistent with known atrial fibrillation.",
      },
      {
        id: "assessment",
        body: "Type 2 diabetes, suboptimally controlled, partly explained by missed evening doses. Atrial fibrillation, rate controlled.",
      },
      {
        id: "tests",
        body: "HbA1c and renal function in three months.",
      },
      {
        id: "advice",
        body: "Evening metformin to go in the pill organiser. Hypoglycaemia explained: shakiness, sweating, confusion. Review in three months, sooner with any hypoglycaemia.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Metformin",
        dose: "500 mg",
        frequency: "Twice daily",
        duration: "Ongoing",
      },
      {
        id: "m2",
        drug: "Gliclazide",
        dose: "",
        frequency: "Once daily with breakfast",
        duration: "Ongoing",
        unconfirmed: "Started at “a small dose”. The dose was not said.",
      },
      {
        id: "m3",
        drug: "Apixaban",
        dose: "5 mg",
        frequency: "Twice daily",
        duration: "Ongoing",
      },
      {
        id: "m4",
        drug: "Bisoprolol",
        dose: "2.5 mg",
        frequency: "Once daily",
        duration: "Ongoing",
      },
    ],
  },
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
      speaker: "Companion",
      time: "01:22",
      text: "It is worst in the early hours. It wakes us both most nights.",
    },
    {
      speaker: "Patient",
      time: "02:31",
      text: "I tried one of those cough syrups from the pharmacy but it did not really do anything. I have been taking an antihistamine most days too — cetirizine, I think.",
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
      text: "That is reasonable. Try honey and warm drinks before bed, and a simple linctus at night — five millilitres, for up to two weeks. Come back in a couple of weeks if it has not settled. Sooner if you get breathless, feverish, or see any blood.",
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
      text: "Let us keep the amlodipine at five milligrams once a day, carry on with the home log, and I will book bloods before we meet again in six months.",
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
      text: "Stay on forty milligrams twice a day, keep the diary going for another couple of months, and we will review in three. I would also like some routine bloods, including your iron levels.",
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
      text: "Keep moving but ease off the long descents, do these quad exercises, and take ibuprofen 400 with food up to three times a day if you need it. Come back in four weeks if it is still there and we will think about physio.",
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
      text: "This should settle by itself. Fluids, rest, and paracetamol — one gram up to four times a day. Come back if it drags past ten days.",
    },
  ],
  v9: [
    {
      speaker: "Doctor",
      time: "00:16",
      text: "How have the sugars been since we last met, Arthur?",
    },
    {
      speaker: "Patient",
      time: "00:24",
      text: "Up and down. The machine says eight or nine most mornings.",
    },
    {
      speaker: "Companion",
      time: "00:41",
      text: "I help Dad with his tablets. He sometimes forgets the evening metformin.",
    },
    {
      speaker: "Doctor",
      time: "01:30",
      text: "Any dizziness, falls, or bleeding — from the gums, or in the urine? You are on the blood thinner.",
    },
    {
      speaker: "Patient",
      time: "01:39",
      text: "No falls. I bruise easily, but nothing else.",
    },
    {
      speaker: "Doctor",
      time: "03:05",
      text: "Your blood pressure is 142 over 78 and the pulse is irregular at about 76, which fits with the atrial fibrillation.",
    },
    {
      speaker: "Doctor",
      time: "05:40",
      text: "I would like to add gliclazide, a small dose with breakfast, alongside the metformin. We will check the HbA1c and your kidneys in three months.",
    },
    {
      speaker: "Companion",
      time: "05:58",
      text: "Should we keep the pill organiser the same?",
    },
    {
      speaker: "Doctor",
      time: "06:04",
      text: "Yes — and put the evening metformin in it too. Come back in three months, or sooner if he has a hypo: shakiness, sweating, or confusion.",
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
    { id: 2, label: "Advice rewritten as actions", author: "Scribe", time: "08:58", kind: "ai" },
    { id: 3, label: "Approved and locked", author: "Dr. Priya Shah", time: "09:01", kind: "approval" },
  ],
  v3: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "16:29", kind: "ai" },
    { id: 2, label: "Approved and locked", author: "Dr. Priya Shah", time: "16:34", kind: "approval" },
  ],
  v5: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "11:33", kind: "ai" },
    { id: 2, label: "Examination clarified", author: "You", time: "11:36", kind: "manual" },
    { id: 3, label: "Approved and locked", author: "Dr. Priya Shah", time: "11:38", kind: "approval" },
  ],
  v6: [
    { id: 1, label: "AI draft generated", author: "Scribe", time: "15:58", kind: "ai" },
    { id: 2, label: "Approved and locked", author: "Dr. Priya Shah", time: "16:02", kind: "approval" },
  ],
  v8: [
    { id: 1, label: "Written by hand", author: "Dr. Priya Shah", time: "09:12", kind: "manual" },
    { id: 2, label: "Approved and locked", author: "Dr. Priya Shah", time: "09:16", kind: "approval" },
  ],
  v9: [{ id: 1, label: "AI draft generated", author: "Scribe", time: "11:26", kind: "ai" }],
};

const approvedAt: Record<string, string> = {
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
  { id: "approved", label: "Approved" },
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
  notes: Record<string, Note>;
  transcripts: Record<string, TranscriptLine[]>;
  versions: Record<string, NoteVersion[]>;
  approvedAt: Record<string, string>;
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
  approvedAt,
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
    today: { ...today, ...to.today },
    patients: patients.map((patient) => {
      const { record, ...written } = to.patients[patient.id];
      return {
        ...patient,
        ...written,
        record: patient.record.map((entry) => ({ ...entry, text: record[entry.id] ?? entry.text })),
      };
    }),
    visits: visits.map((visit) => ({ ...visit, ...to.visits[visit.id] })),
    statusMeta: Object.fromEntries(
      Object.entries(statusMeta).map(([status, meta]) => [
        status,
        { ...meta, ...to.statusMeta[status as VisitStatus] },
      ]),
    ) as typeof statusMeta,
    notes: Object.fromEntries(
      Object.entries(notes).map(([id, note]) => {
        const into = to.notes[id];
        return [
          id,
          {
            triage: note.triage && {
              ...note.triage,
              complaint: into?.complaint ?? note.triage.complaint,
            },
            sections: note.sections.map((section) => ({
              ...section,
              ...into?.sections[section.id],
            })),
            medications: note.medications.map((row) => ({
              ...row,
              ...into?.medications?.[row.id],
            })),
          },
        ];
      }),
    ),
    transcripts: byId(transcripts, (line, i, id) => ({
      ...line,
      text: to.transcripts[id]?.[i] ?? line.text,
    })),
    versions: byId(versions, (version, i, id) => ({
      ...version,
      label: to.versions[id]?.[i] ?? version.label,
      author: to.authors[version.author] ?? version.author,
    })),
    approvedAt: { ...approvedAt, ...to.approvedAt },
    visitFilters: visitFilters.map((filter) => ({ ...filter, label: to.visitFilters[filter.id] })),
    recovery,
  };
}

const initialsOf = (name: string, locale: Locale) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    // Persian letters would join into a word; a zero-width non-joiner keeps them apart.
    .join(locale === "fa" ? "‌" : "")
    .slice(0, 2)
    .toUpperCase();

/** When a visit happened, as a key that sorts. Language-neutral. */
export const visitOrder = (visit: Visit) => `${visit.day}T${visit.time}`;

/** HH:MM, some minutes on. */
function later(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Once a note is approved, everything the doctor had to check has been checked. */
function settled(note: Note): Note {
  return {
    ...note,
    sections: note.sections.map((section) => ({ ...section, uncertain: undefined })),
    medications: note.medications.map((row) => ({ ...row, unconfirmed: undefined })),
  };
}

/**
 * One language's dataset with this browser's changes laid over it: recorded
 * visits and added patients joined in, approvals applied. `now` is fixed per
 * request, so the server render and the client hydration agree on every
 * status.
 */
function withChanges(
  data: Dataset,
  locale: Locale,
  changes: WorkspaceChanges,
  now: number,
): Dataset {
  const t = translate(locale);
  const source = data.patients[0];
  const sourceName = source.name.split(" ")[0];

  const added: Patient[] = changes.patients.map((patient) => {
    const born = new Date(patient.dob);
    return {
      id: patient.id,
      name: patient.name,
      initials: initialsOf(patient.name, locale),
      dob: born.toLocaleDateString(locale === "fa" ? "fa-IR-u-nu-latn" : "en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      age: Math.max(0, new Date(now).getFullYear() - born.getFullYear()),
      registered: data.today.label,
      record: [],
    };
  });
  const allPatients = [...data.patients, ...added];

  const recorded = changes.recorded.map((entry) => ({
    entry,
    visit: {
      id: entry.id,
      patientId: entry.patientId,
      reason: data.visits.find((visit) => visit.id === "v1")?.reason ?? "",
      date: data.today.label,
      dateLong: data.today.short,
      day: data.today.iso,
      time: entry.time,
      status: recordedStatus(entry, now),
      duration: formatDuration(entry.seconds),
      durationSeconds: entry.seconds,
    } satisfies Visit,
  }));

  const firstName = (patientId: string) =>
    allPatients.find((patient) => patient.id === patientId)?.name.split(" ")[0] ?? sourceName;
  // A freshly recorded demo consultation is Maya's, rewritten for whoever was in the room.
  const rename = (text: string, name: string) => text.replaceAll(sourceName, name);

  const notesNow = { ...data.notes };
  const transcriptsNow = { ...data.transcripts };
  const versionsNow = { ...data.versions };
  for (const { entry, visit } of recorded) {
    if (visit.status !== "draft-ready") continue;
    const name = firstName(entry.patientId);
    const draft = data.notes.v1;
    notesNow[entry.id] = {
      ...draft,
      sections: draft.sections.map((section) => ({
        ...section,
        body: rename(section.body, name),
        uncertain: section.uncertain?.map((flag) => ({ ...flag, text: rename(flag.text, name) })),
      })),
    };
    transcriptsNow[entry.id] = data.transcripts.v1.map((line) => ({
      ...line,
      text: rename(line.text, name),
    }));
    versionsNow[entry.id] = [
      { ...data.versions.v1[0], time: later(entry.time, Math.ceil(entry.seconds / 60) + 1) },
    ];
  }

  const visitsNow = [...recorded.map(({ visit }) => visit), ...data.visits].map((visit) =>
    visit.status === "draft-ready" && changes.approved[visit.id]
      ? { ...visit, status: "approved" as const }
      : visit,
  );

  const approvedNow = { ...data.approvedAt };
  for (const [id, time] of Object.entries(changes.approved)) {
    if (!notesNow[id]) continue;
    notesNow[id] = settled(notesNow[id]);
    const chain = versionsNow[id] ?? [];
    versionsNow[id] = [
      ...chain,
      {
        id: chain.length + 1,
        label: t("Approved and locked"),
        author: data.doctor.name,
        time,
        kind: "approval",
      },
    ];
    approvedNow[id] = t("{date} at {time}", { date: data.today.short, time });
  }

  return {
    ...data,
    patients: allPatients,
    visits: visitsNow,
    notes: notesNow,
    transcripts: transcriptsNow,
    versions: versionsNow,
    approvedAt: approvedNow,
  };
}

/** Lookups over one language's dataset. Every screen reads the demo through this. */
function views(data: Dataset) {
  const getPatient = (patientId: string | undefined) =>
    data.patients.find((patient) => patient.id === patientId);
  const getVisit = (visitId: string | undefined) =>
    data.visits.find((visit) => visit.id === visitId);
  const getVisitsForPatient = (patientId: string) =>
    data.visits
      .filter((visit) => visit.patientId === patientId)
      .sort((a, b) => visitOrder(b).localeCompare(visitOrder(a)));

  return {
    ...data,
    getPatient,
    getVisit,
    getPatientForVisit: (visitId: string | undefined) => getPatient(getVisit(visitId)?.patientId),
    getVisitsForPatient,
    /** The consultation this patient had before the given one, if any. */
    getPreviousVisit(visit: Visit) {
      return getVisitsForPatient(visit.patientId).find(
        (other) => other.id !== visit.id && visitOrder(other) < visitOrder(visit),
      );
    },
    /**
     * What a doctor wants to know going into a consultation: the visit before
     * it, and the problems, medications and allergies on record at the time —
     * each with the consultation it came from. Entries this visit itself
     * records are in its note, not here.
     */
    getPatientContext(patientId: string, visitId?: string) {
      const current = getVisit(visitId);
      const before = (visit: Visit | undefined) =>
        !current || !visit || visitOrder(visit) < visitOrder(current);
      const earlier = getVisitsForPatient(patientId).filter(
        (visit) => visit.id !== visitId && before(visit),
      );
      const previous = earlier.find((visit) => data.notes[visit.id]) ?? earlier[0];

      const entries: SourcedEntry[] = (getPatient(patientId)?.record ?? []).flatMap((entry) => {
        const source = getVisit(entry.visitId);
        const ended = getVisit(entry.endedVisitId);
        if (entry.visitId === visitId || (entry.visitId && !source) || !before(source)) return [];
        if (ended && (!current || before(ended))) return [];
        return [{ entry, source, pending: Boolean(source && source.status !== "approved") }];
      });
      const of = (kind: ClinicalEntry["kind"]) =>
        entries.filter((item) => item.entry.kind === kind);

      return {
        previous,
        previousSummary: previous
          ? data.notes[previous.id]?.sections.find((section) => section.id === "assessment")?.body
          : undefined,
        problems: of("problem"),
        medications: of("medication"),
        allergies: of("allergy"),
      };
    },
    getNote: (visitId: string): Note | undefined => data.notes[visitId],
    getTranscript: (visitId: string): TranscriptLine[] => data.transcripts[visitId] ?? [],
    getVersions: (visitId: string): NoteVersion[] => data.versions[visitId] ?? [],
    /** Visits that cannot move forward without the doctor. */
    actionableVisits: data.visits.filter(
      (visit) => visit.status === "draft-ready" || visit.status === "failed",
    ),
    /** Drafts waiting for the doctor's approval — the sidebar's only number. */
    toReview: data.visits.filter((visit) => visit.status === "draft-ready"),
    /** The consultations held today. */
    todaysVisits: data.visits.filter((visit) => visit.day === data.today.iso),
  };
}

export type Demo = ReturnType<typeof views>;

const datasets = { en: english, fa: translated(farsi) };
const untouched = { en: views(datasets.en), fa: views(datasets.fa) };

/** The demo in one language, with whatever this browser has changed in it. */
export function demo(
  locale: Locale,
  changes: WorkspaceChanges = noChanges,
  now = 0,
): Demo {
  const changed =
    changes.recorded.length || changes.patients.length || Object.keys(changes.approved).length;
  return changed
    ? views(withChanges(datasets[locale], locale, changes, now))
    : untouched[locale];
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

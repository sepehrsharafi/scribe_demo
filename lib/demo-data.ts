// Synthetic demo data. No real patient information belongs in this file.
//
// Only facts are stored: names, yyyy-mm-dd dates, HH:MM times, seconds. Every
// label, relative day and age is worked out when it is shown (lib/format.ts),
// and every status word lives with the component that says it.

import type { Locale } from "@/lib/i18n/locales";
import { arabic } from "@/lib/demo-data-ar";
import { farsi } from "@/lib/demo-data-fa";
import { demoToday } from "@/lib/format";
import { noChanges, readyAt, type WorkspaceChanges } from "@/lib/workspace";

export type VisitStatus = "processing" | "ready" | "approved" | "failed";

export type Patient = {
  id: string;
  name: string;
  /** yyyy-mm-dd. */
  born: string;
  /** yyyy-mm. */
  registered: string;
  /** Where their instructions are emailed. Not everyone has given one. */
  email?: string;
  /** The standing clinical picture, kept consistent with the notes below. */
  record: ClinicalEntry[];
};

/** One problem, medication or allergy on the patient record, and where it came from. */
export type ClinicalEntry = {
  id: string;
  kind: "problem" | "medication" | "allergy";
  text: string;
  /** The visit it was recorded at. Absent when it came with the registration record. */
  visitId?: string;
  /** The visit at which it resolved or was stopped. */
  endedVisitId?: string;
};

/** What kind of visit it was, in the order the doctor picks from. */
export const visitTypes = ["first", "follow-up", "new-complaint", "results-review", "treatment-check"] as const;

export type VisitType = (typeof visitTypes)[number];

/** Visit type names, in English. Screens render them through `t()`. */
export const visitTypeLabels: Record<VisitType, string> = {
  first: "First visit",
  "follow-up": "Follow-up",
  "new-complaint": "New complaint",
  "results-review": "Results review",
  "treatment-check": "Treatment check",
};

export type Visit = {
  id: string;
  patientId: string;
  /** Empty until the note has been written — Scribe takes it from the conversation. */
  reason: string;
  /**
   * Scribe takes it from the conversation too, and the doctor can overrule it.
   * Absent for a visit just recorded: `getVisitType` then says first or
   * follow-up by whether the patient has been seen before.
   */
  type?: VisitType;
  /** yyyy-mm-dd. */
  day: string;
  /** HH:MM. */
  time: string;
  /** Length of the recording. 0 when nothing was recorded and the note was written by hand. */
  seconds: number;
  status: VisitStatus;
  /** HH:MM on the day of the visit. */
  approvedAt?: string;
  /** When the patient was last emailed their instructions, and where to. */
  emailed?: EmailedInstructions;
  /** Why processing stopped. */
  failure?: string;
  /** When processing began, in epoch ms. Only visits processed in this browser have one. */
  since?: number;
};

export type EmailedInstructions = {
  to: string;
  /** yyyy-mm-dd. */
  day: string;
  /** HH:MM. */
  time: string;
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
  /** True when the visit never covered this ground. Never filled in by the model. */
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
 * What the patient takes home, in plain words, written from the same
 * conversation as the note. The medicines are not repeated here: the patient's
 * copy lists them straight from the note's table.
 */
export const instructionOrder = ["summary", "steps", "followUp", "warning"] as const;

export type InstructionId = (typeof instructionOrder)[number];

export const instructionLabels: Record<InstructionId, string> = {
  summary: "What we found",
  steps: "What to do",
  followUp: "Coming back",
  warning: "Get help straight away if",
};

export type Instructions = Record<InstructionId, string>;

/**
 * The write-up of one visit: the clinical note and the patient's instructions.
 * The note holds only the sections the visit produced — except the
 * examination, which is always kept so that one nobody did stays a visible gap.
 */
export type Note = {
  triage?: Triage;
  sections: NoteSection[];
  medications: Medication[];
  instructions: Instructions;
};

export type Speaker = "Doctor" | "Patient" | "Companion";

export type TranscriptLine = {
  speaker: Speaker;
  time: string;
  text: string;
  /** Talks about an earlier visit. A new recording reuses this transcript for someone else and leaves it out. */
  earlier?: boolean;
};

/** A file attached to a visit: a letter, a scan, a result. */
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "pdf";
  /** Bytes. */
  size: number;
  src: string;
};

/** What the practice attached to a visit besides the conversation itself. */
export type VisitContext = {
  files?: Attachment[];
};

/**
 * What to know going into a visit: one line on who the patient is and why
 * they are here, each problem on the record with what the notes say about
 * it, and what the visit is for. Strings carry **bold** and [](visitId) links.
 */
export type Brief = {
  summary: string;
  problems: { title: string; points: string[] }[];
  /** For a visit, what it was for; for a patient, what is open for their next one. */
  plan: string[];
};

/** A record entry with the visit it came from, as a doctor reads it in context. */
export type SourcedEntry = {
  entry: ClinicalEntry;
  /** Absent when the entry came with the registration record. */
  source?: Visit;
  /** Recorded at a visit whose note is not approved yet. */
  pending: boolean;
};

/**
 * Everything in the demo that is written in a language. A second language is
 * this shape filled in again, keyed by the same ids; dates, times and numbers
 * stay with the English source.
 */
export type DemoTranslation = {
  doctor: { name: string; specialty: string; registration: string };
  patients: Record<string, { name: string; record: Record<string, string> }>;
  visits: Record<string, { reason: string; failure?: string }>;
  notes: Record<
    string,
    {
      complaint?: string;
      sections: Partial<Record<TextSectionId, { body: string; uncertain?: Uncertain[] }>>;
      /** Medication id → the written fields of that row. */
      medications?: Record<string, Partial<Omit<Medication, "id">>>;
    }
  >;
  instructions: Record<string, Instructions>;
  /** The spoken text of each transcript line, in order. */
  transcripts: Record<string, string[]>;
  /** Visit id → its files, file id → name. */
  contexts: Record<string, { files?: Record<string, string> }>;
  /** Visit or patient id → its brief, in the same markup. */
  briefs: Record<string, Brief>;
};

const doctor = {
  name: "Dr. Priya Shah",
  specialty: "General practice",
  registration: "GMC 7654321",
  email: "priya@scribe.demo",
};

const patients: Patient[] = [
  {
    id: "p1",
    name: "Maya Thompson",
    born: "1988-05-14",
    registered: "2021-03",
    email: "maya.thompson@example.com",
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
    born: "1971-11-02",
    registered: "2016-08",
    email: "jon.bell71@example.net",
    record: [
      { id: "p2.1", kind: "problem", text: "Hypertension, controlled", visitId: "v2" },
      { id: "p2.2", kind: "medication", text: "Amlodipine 5 mg once daily", visitId: "v2" },
    ],
  },
  {
    id: "p3",
    name: "Elena Marquez",
    born: "1995-01-29",
    registered: "2024-01",
    email: "elena.marquez@example.org",
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
    // No email on file: his instructions go home on paper, until the doctor adds one.
    born: "1948-07-07",
    registered: "2009-06",
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
    // Registered, never seen in Scribe: her first visit starts from the record alone.
    id: "p5",
    name: "Nadia Okonkwo",
    born: "1990-03-23",
    registered: "2022-11",
    email: "nadia.okonkwo@example.com",
    record: [
      { id: "p5.1", kind: "problem", text: "Postnatal, delivered Aug 2026" },
      { id: "p5.2", kind: "allergy", text: "Latex" },
    ],
  },
  {
    id: "p6",
    name: "Tomas Lindqvist",
    born: "1966-12-11",
    registered: "2018-02",
    email: "t.lindqvist@example.com",
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
    type: "follow-up",
    day: "2026-09-22",
    time: "11:10",
    seconds: 785,
    status: "ready",
  },
  {
    id: "v1",
    patientId: "p1",
    reason: "Persistent cough",
    type: "new-complaint",
    day: "2026-09-22",
    time: "09:20",
    seconds: 866,
    status: "ready",
  },
  {
    id: "v2",
    patientId: "p2",
    reason: "Blood pressure review",
    type: "treatment-check",
    day: "2026-09-22",
    time: "08:40",
    seconds: 668,
    status: "approved",
    approvedAt: "09:01",
    emailed: { to: "jon.bell71@example.net", day: "2026-09-22", time: "09:02" },
  },
  {
    id: "v3",
    patientId: "p3",
    reason: "Migraine follow-up",
    type: "follow-up",
    // Two weeks before the telephone call (v8) that went through the bloods it asked for.
    day: "2026-09-07",
    time: "16:10",
    seconds: 1062,
    status: "approved",
    approvedAt: "16:34",
  },
  {
    // The upload stopped part-way. Retrying it runs the pipeline and this note arrives.
    id: "v4",
    patientId: "p4",
    reason: "Hip pain",
    type: "first",
    day: "2026-09-21",
    time: "14:30",
    seconds: 558,
    status: "failed",
    failure: "Upload interrupted at 74%. The audio is safe on this device.",
  },
  {
    id: "v5",
    patientId: "p6",
    reason: "Knee pain, right",
    type: "first",
    day: "2026-09-21",
    time: "11:15",
    seconds: 760,
    status: "approved",
    approvedAt: "11:38",
  },
  {
    // A phone call: nothing to record, so the note was typed straight in.
    id: "v8",
    patientId: "p3",
    reason: "Telephone review — blood results",
    type: "results-review",
    day: "2026-09-21",
    time: "09:05",
    seconds: 0,
    status: "approved",
    approvedAt: "09:16",
  },
  {
    id: "v6",
    patientId: "p1",
    reason: "Upper respiratory infection",
    type: "first",
    day: "2026-08-18",
    time: "15:45",
    seconds: 534,
    status: "approved",
    approvedAt: "16:02",
    emailed: { to: "maya.thompson@example.com", day: "2026-08-18", time: "16:04" },
  },
];

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
        body: "Since the visit on 18 August, when an upper respiratory infection was managed with fluids, rest and paracetamol: the infection has cleared but a cough has persisted.\nMaya reports a dry, non-productive cough that began around six weeks ago. It is worse at night and occasionally interrupts sleep; Maya's partner, who attended the consultation, adds that it is worst in the early hours. No fever, breathlessness, chest pain, haemoptysis, reflux symptoms, or recent travel. An over-the-counter cough syrup gave no meaningful improvement. Taking an antihistamine, cetirizine, most days.",
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
    instructions: {
      summary:
        "Your cough is most likely a post-viral cough. It often follows a cold and can take several weeks to settle. Nothing you told me today suggests anything more serious.",
      steps:
        "• Have honey and a warm drink before bed.\n• Take the simple linctus at night if the cough keeps you awake, for up to two weeks.\n• You chose to hold off on a chest X-ray for now. We can arrange one at any time.",
      followUp: "Come back in two weeks if the cough has not improved.",
      warning:
        "• You become breathless.\n• You have chest pain.\n• You develop a fever.\n• You cough up blood.",
    },
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
        body: "Since the amlodipine dose was changed six months ago: home readings steady at around 138/84 and no new symptoms.\nJon reports good adherence to amlodipine and no side effects. Added salt reduced; walking three times a week. No headaches, visual disturbance, chest pain, or ankle swelling.",
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
    instructions: {
      summary:
        "Your blood pressure is well controlled on amlodipine. Today's reading was 136/82, which is where we want it.",
      steps:
        "• Check your blood pressure at home twice a week and write the readings down.\n• Keep up the walking and the lower-salt diet.\n• Book a blood test before your next appointment.",
      followUp: "Come back in six months, and bring your home readings with you.",
      warning:
        "• Your home readings are above 150/95.\n• You get a severe headache, changes in your vision, or chest pain.",
    },
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
        body: "Since propranolol was started eight weeks ago: migraine days down from about six a month to two.\nElena reports attacks remain preceded by visual aura but are shorter and less severe. No adverse effects from propranolol. Sleep remains irregular on night shifts, which Elena identifies as the main trigger.",
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
    instructions: {
      summary:
        "Propranolol is working: your migraines have gone from about six days a month to two.",
      steps:
        "• Keep your headache diary for another eight weeks.\n• Keep your sleep times as regular as you can around night shifts.\n• Book a blood test for your blood count, kidneys, liver and iron.",
      followUp: "Come back in three months.",
      warning:
        "• Your migraines rise above four days a month.\n• A headache feels different from your usual migraines, or comes with weakness, numbness or confusion.",
    },
  },
  v4: {
    triage: {
      complaint: "Hip pain, both sides",
      bp: "138/76",
      hr: "74",
      temp: "36.6",
      spo2: "97",
      weight: "80",
    },
    sections: [
      {
        id: "reason",
        body: "Worsening pain in both hips over the past two months.",
      },
      {
        id: "history",
        body: "Arthur describes aching in both hips, worse on the right, after walking for more than ten minutes. Morning stiffness settles within half an hour. No falls, no pain at night, no fever or weight loss. His daughter reports paracetamol most days, taken only when the pain is bad. Codeine previously caused confusion.",
      },
      {
        id: "examination",
        body: "Pain at the end of rotation in both hips, right more than left. Walking without an aid.",
      },
      {
        id: "assessment",
        body: "Osteoarthritis of both hips, now limiting walking distance. Oral anti-inflammatories avoided because of apixaban.",
      },
      {
        id: "tests",
        body: "Physiotherapy referral for a strengthening programme.",
      },
      {
        id: "advice",
        body: "Paracetamol regularly rather than as needed, with ibuprofen gel to both hips. Keep active within comfort. Review in six weeks, sooner with a fall or a sudden worsening.",
      },
    ],
    medications: [
      {
        id: "m1",
        drug: "Paracetamol",
        dose: "1 g",
        frequency: "Four times daily",
        duration: "Ongoing",
      },
      {
        id: "m2",
        drug: "Ibuprofen 5% gel",
        dose: "Thin layer",
        frequency: "Up to three times daily, to both hips",
        duration: "Ongoing",
      },
    ],
    instructions: {
      summary:
        "Your hip pain comes from wear in both hip joints (osteoarthritis). It is common, and keeping active helps it more than resting does.",
      steps:
        "• Take the paracetamol regularly, not only when the pain is bad.\n• Rub the ibuprofen gel into both hips up to three times a day.\n• Do not take ibuprofen tablets or other anti-inflammatory tablets — they do not mix safely with your blood thinner.\n• Keep walking every day, in stretches you are comfortable with. The physiotherapy team will contact you.",
      followUp: "Come back in six weeks so we can see how you are getting on.",
      warning:
        "• You have a fall.\n• A hip suddenly becomes much more painful, or you cannot put weight on the leg.\n• You notice any bleeding.",
    },
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
    instructions: {
      summary:
        "Your knee pain is most likely a strain of the ligament on the inside of the knee. There are no signs of torn cartilage.",
      steps:
        "• Keep moving, but ease off long downhill walks for now.\n• Do the thigh-strengthening exercises every day.\n• Take the ibuprofen with food, and only when you need it.",
      followUp:
        "Come back in four weeks if it has not settled — we can then think about physiotherapy.",
      warning:
        "• Your knee locks or gives way.\n• It becomes swollen, hot or red.\n• You get stomach pain or black stools while taking ibuprofen.",
    },
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
    instructions: {
      summary: "You have a viral infection of the throat and nose. It will get better on its own.",
      steps: "• Drink plenty of fluids and rest.\n• Take paracetamol if you need it.",
      followUp: "Come back if you are not better after ten days.",
      warning: "• You develop a fever.\n• You become breathless.\n• You find it hard to swallow.",
    },
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
        body: "Since the visit on 7 September, when propranolol was continued and blood tests were requested: two headaches in the fortnight, neither with visual aura, and sleeping better.\nElena called for her results. Headaches remain less frequent than before the preventer. No new neurological symptoms and no rebound analgesia use.",
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
    instructions: {
      summary:
        "Your blood results are normal. Your iron stores are at the low end of normal, so we will check them again.",
      steps:
        "• Eat more iron-rich foods: red meat, beans, lentils and dark green vegetables.\n• Keep your headache diary.\n• Book a repeat iron blood test in three months.",
      followUp: "We will see you in person in six weeks.",
      warning:
        "• Your headaches change in character, or come with weakness, numbness or confusion.",
    },
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
        body: "Since the visit on 21 September, when he was seen about his hips: the hips are no different, he has had no falls or bleeding on apixaban, and he bruises easily.\nArthur reports fasting home readings of 8–9 mmol/L most mornings. His daughter, who attended and helps with his tablets, reports that the evening metformin is sometimes missed.",
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
    instructions: {
      summary:
        "Your sugar levels have been running high, partly because the evening metformin is sometimes missed. We are adding a new tablet, gliclazide.",
      steps:
        "• Put the evening metformin in your pill organiser.\n• Take the gliclazide once a day with breakfast.\n• Book a blood test for your HbA1c and kidneys in three months.",
      followUp: "Come back in three months.",
      warning:
        "• You feel shaky, sweaty or confused — your sugar may be too low. Have something sugary straight away, then call us.\n• You notice any bleeding.",
    },
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
      time: "00:38",
      text: "Is that the cold you came in with in August? We agreed fluids, rest and paracetamol.",
      earlier: true,
    },
    {
      speaker: "Patient",
      time: "00:46",
      text: "Yes, that one. It cleared up, but the cough did not.",
      earlier: true,
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
      text: "It is six months since we changed your amlodipine dose. How have the home readings been since?",
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
      text: "It is eight weeks since you started the propranolol. How many migraine days have you had this month?",
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
  v4: [
    {
      speaker: "Doctor",
      time: "00:15",
      text: "What has been happening with your hips, Arthur?",
    },
    {
      speaker: "Patient",
      time: "00:22",
      text: "They ache, both of them, the right one worse. After ten minutes of walking I have to stop.",
    },
    {
      speaker: "Doctor",
      time: "01:05",
      text: "Are they stiff first thing? Any pain at night, falls, fevers, or weight loss?",
    },
    {
      speaker: "Patient",
      time: "01:14",
      text: "Stiff for half an hour in the morning, then it eases. No falls. Nothing at night.",
    },
    {
      speaker: "Companion",
      time: "01:40",
      text: "He takes the paracetamol most days, but only when it is bad. Codeine made him muddled last time.",
    },
    {
      speaker: "Doctor",
      time: "03:10",
      text: "It hurts at the end of turning both hips, the right more than the left, and you are walking without a stick.",
    },
    {
      speaker: "Doctor",
      time: "05:25",
      text: "This is wear and tear in the hips. I will not give you anti-inflammatory tablets because of the blood thinner. Take the paracetamol regularly, one gram four times a day, and rub ibuprofen gel into both hips up to three times a day.",
    },
    {
      speaker: "Doctor",
      time: "06:02",
      text: "I will refer you to physiotherapy, and I would like to see you again in six weeks — sooner if you fall or it suddenly gets worse.",
    },
    {
      speaker: "Companion",
      time: "06:20",
      text: "We will keep him walking a little every day.",
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
      text: "How have the sugars been lately, Arthur?",
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
      time: "01:12",
      text: "I saw you yesterday about your hips. Have they been any different since?",
    },
    {
      speaker: "Patient",
      time: "01:20",
      text: "No, much the same.",
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

/** What the practice gathered ahead of a visit. Files are served from /public/demo. */
const contexts: Record<string, VisitContext> = {
  v9: {
    files: [
      { id: "f1", name: "ECG, lead II — 19 Sep 2026", kind: "image", size: 20_150, src: "/demo/ecg.svg" },
    ],
  },
  v8: {
    files: [
      {
        id: "f2",
        name: "Blood results — 19 Sep 2026",
        kind: "pdf",
        size: 3_340,
        src: "/demo/blood-results.pdf",
      },
    ],
  },
};

/**
 * What Scribe tells the doctor before they go in, gathered from the record
 * and the earlier notes: one brief per filed visit, as things stood going
 * into it, and one per patient for their next visit. It says only what the
 * record and those notes say.
 *
 * **Bold** marks a condition or a medicine; [](v6) is a link to the note a
 * statement comes from, labelled with that visit's date when it is shown.
 */
const briefs: Record<string, Brief> = {
  v6: {
    summary: "38F, registered since March 2021 and seen in Scribe for the first time, so there is no earlier note to draw on.",
    problems: [],
    plan: [
      "Take the history from the start — nothing earlier is in Scribe.",
      "Her record carries no long-term conditions, regular medicines or allergies; confirm that still stands.",
    ],
  },
  v1: {
    summary: "38F seen on [](v6) with a self-limiting **upper respiratory tract infection**; there has been no contact since, so this is the first look at how it settled.",
    problems: [
      {
        title: "Upper respiratory tract infection",
        points: [
          "Three days of sore throat, blocked nose and tiredness on [](v6).",
          "No fever, no difficulty swallowing and no breathlessness.",
          "Advised fluids and rest, with **paracetamol 1 g** up to four times a day as needed.",
        ],
      },
    ],
    plan: [
      "Find out how the infection settled — she was to come back if it had not cleared within ten days.",
      "Ask about the warning signs set last time: a fever, breathlessness or difficulty swallowing.",
    ],
  },
  p1: {
    summary: "38F with a **persistent post-viral cough** of about six weeks after an August infection; the note from [](v1) is still waiting for review, so its details are not yet confirmed.",
    problems: [
      {
        title: "Persistent post-viral cough",
        points: [
          "Dry cough for about six weeks, worst at night and in the early hours, sometimes waking her.",
          "Followed the upper respiratory infection of [](v6), which has since settled.",
          "No red flags on [](v1); she declined a chest X-ray for now.",
        ],
      },
    ],
    plan: [
      "Ask whether honey, warm drinks and **simple linctus** at night have helped.",
      "Offer the chest X-ray again if the cough has not improved; sooner with breathlessness, chest pain, a fever or coughing up blood.",
      "Confirm the **cetirizine** dose — Maya named it herself and gave none.",
    ],
  },
  v2: {
    summary: "54M, registered since August 2016 and seen in Scribe for the first time; his earlier care is in the old notes.",
    problems: [],
    plan: [
      "Nothing from the old notes has been carried across yet — confirm his conditions, regular medicines and allergies.",
      "Take the history from the start.",
    ],
  },
  p2: {
    summary: "54M with **hypertension**, adequately controlled on **amlodipine 5 mg** at the review on [](v2); the next review is due six months on.",
    problems: [
      {
        title: "Hypertension, controlled",
        points: [
          "Home readings averaged about 138/84; 136/82 in clinic, with a regular pulse of 72, on [](v2).",
          "Takes **amlodipine 5 mg** once daily without side effects.",
          "Has cut down on salt and walks three times a week.",
        ],
      },
    ],
    plan: [
      "Go through the routine bloods, including kidney function, taken before this appointment.",
      "Look over the home-reading log — twice a week since [](v2).",
      "Bring the review forward if home readings go above 150/95.",
    ],
  },
  v3: {
    summary: "31F, registered since January 2024 and seen in Scribe for the first time; the care before this is in the old notes.",
    problems: [],
    plan: [
      "Take the history from the start — nothing earlier is in Scribe.",
      "No regular medicines are recorded; confirm what she takes.",
    ],
  },
  v8: {
    summary: "31F with **migraine with aura**, improving on **propranolol 40 mg**; the bloods asked for on [](v3) are back and attached.",
    problems: [
      {
        title: "Migraine with aura",
        points: [
          "Migraine days fell from about six a month to two, eight weeks after starting **propranolol 40 mg** twice daily.",
          "Attacks shorter and milder, still preceded by visual aura; no side effects.",
          "Irregular sleep around night shifts is the trigger she names.",
        ],
      },
    ],
    plan: [
      "Go through the results that came back on 19 Sep: full blood count, kidney and liver function, and ferritin.",
      "Ferritin is borderline — worth a word about iron in her diet.",
      "Check the headache diary; review in three months, sooner if attacks go above four days a month.",
    ],
  },
  p3: {
    summary: "31F with **migraine with aura**, still improving on **propranolol**, and a **low-normal ferritin** found at the telephone review on [](v8).",
    problems: [
      {
        title: "Migraine with aura",
        points: [
          "Two headaches in the fortnight before [](v8), neither with aura; sleeping better.",
          "On **propranolol 40 mg** twice daily; reviewed eight weeks into treatment on [](v3).",
          "Night-shift sleep has been the main trigger.",
        ],
      },
      {
        title: "Low-normal ferritin",
        points: [
          "Ferritin 42 µg/L; full blood count, kidney and liver function normal.",
          "Iron in her diet was discussed on [](v8); the ferritin is to be repeated in three months.",
        ],
      },
    ],
    plan: [
      "An in-person review about six weeks after [](v8) — sooner if the headaches change in character.",
      "Go through the headache diary.",
      "Repeat the ferritin in December 2026.",
    ],
  },
  v4: {
    summary: "78M with **type 2 diabetes**, **atrial fibrillation** and **osteoarthritis of both hips**, seen in Scribe for the first time; all of this comes from his registration record.",
    problems: [
      { title: "Type 2 diabetes", points: ["Takes **metformin 500 mg** twice daily."] },
      {
        title: "Atrial fibrillation",
        points: ["Takes **apixaban 5 mg** twice daily and **bisoprolol 2.5 mg** once daily."],
      },
      { title: "Osteoarthritis, both hips", points: ["**Paracetamol 1 g** when he needs it."] },
    ],
    plan: [
      "Prescribe with his anticoagulant in mind: anti-inflammatories by mouth carry a bleeding risk.",
      "Avoid **codeine** — it has made him confused before.",
    ],
  },
  v9: {
    summary: "78M with **type 2 diabetes**, **atrial fibrillation** and **hip osteoarthritis**; the recording from [](v4) stopped part-way through uploading, so there is no note from it yet.",
    problems: [
      {
        title: "Type 2 diabetes",
        points: [
          "Takes **metformin 500 mg** twice daily.",
          "His daughter rang on Monday: the evening metformin is being missed.",
        ],
      },
      {
        title: "Atrial fibrillation",
        points: [
          "Takes **apixaban 5 mg** twice daily and **bisoprolol 2.5 mg** once daily.",
          "The practice nurse took an ECG on Saturday; it is with the files.",
        ],
      },
      {
        title: "Osteoarthritis, both hips",
        points: ["Seen about his hips on [](v4); that note is waiting on the upload.", "**Paracetamol** as needed."],
      },
    ],
    plan: [
      "Review his diabetes control, and how the evening **metformin** is being taken.",
      "Look at the nurse's ECG from Saturday.",
      "Retry the upload from [](v4) to bring in the hip note.",
    ],
  },
  p4: {
    summary: "78M with **type 2 diabetes**, started on **gliclazide** on [](v9) with its dose still to be confirmed; that note is waiting for review.",
    problems: [
      {
        title: "Type 2 diabetes",
        points: [
          "Fasting home readings of 8–9 mmol/L most mornings on [](v9).",
          "The evening **metformin** was sometimes missed; it went into the pill organiser.",
          "**Gliclazide** started once daily with breakfast; the signs of a low sugar were explained.",
        ],
      },
      {
        title: "Atrial fibrillation",
        points: [
          "Irregular pulse of about 76, blood pressure 142/78, on [](v9).",
          "Takes **apixaban** and **bisoprolol**.",
        ],
      },
      {
        title: "Osteoarthritis, both hips",
        points: ["Seen on [](v4), but that recording did not finish uploading.", "**Paracetamol** as needed."],
      },
    ],
    plan: [
      "Confirm the **gliclazide** dose.",
      "HbA1c and kidney function are due three months after [](v9).",
      "Avoid **codeine** — it has made him confused before.",
    ],
  },
  p5: {
    summary: "36F, registered since November 2022, in the **postnatal** period after a birth in August 2026; she has not been seen in Scribe before.",
    problems: [
      {
        title: "Postnatal",
        points: ["Delivered in August 2026.", "No regular medicines are recorded."],
      },
    ],
    plan: [
      "Use latex-free gloves for any examination — she is allergic to **latex**.",
      "Take the history from the start; this comes from her record alone.",
    ],
  },
  v5: {
    summary: "59M, registered since February 2018 and seen in Scribe for the first time.",
    problems: [],
    plan: [
      "Take the history from the start — nothing earlier is in Scribe.",
      "His record carries no long-term conditions, regular medicines or allergies; confirm that still stands.",
    ],
  },
  p6: {
    summary: "59M with **right medial knee pain** after a long hiking descent, seen on [](v5); review is due if it has not settled within four weeks.",
    problems: [
      {
        title: "Right knee pain, medial",
        points: [
          "Began three weeks before [](v5), after a long descent on a hiking trip.",
          "Worse going downstairs and after sitting; no locking, giving way or swelling.",
          "Most likely a **medial collateral strain** or early irritation of the inner joint; nothing to suggest a torn meniscus.",
        ],
      },
    ],
    plan: [
      "Ask how relative rest, easing off long descents and the quadriceps exercises have gone.",
      "Check how much **ibuprofen 400 mg** he is taking — up to three times a day with food.",
      "Consider physiotherapy if it has not settled.",
    ],
  },
};

/** Audio restored from the device after the browser closed mid-visit. */
const recovery = { patientId: "p1", seconds: 522 };

type Dataset = {
  doctor: typeof doctor;
  patients: Patient[];
  visits: Visit[];
  notes: Record<string, Note>;
  transcripts: Record<string, TranscriptLine[]>;
  contexts: Record<string, VisitContext>;
  briefs: Record<string, Brief>;
};

const english: Dataset = { doctor, patients, visits, notes, transcripts, contexts, briefs };

/** The English dataset with every written field replaced by its translation. */
function translated(to: DemoTranslation): Dataset {
  return {
    doctor: { ...doctor, ...to.doctor },
    patients: patients.map((patient) => {
      const { name, record } = to.patients[patient.id];
      return {
        ...patient,
        name,
        record: patient.record.map((entry) => ({ ...entry, text: record[entry.id] ?? entry.text })),
      };
    }),
    visits: visits.map((visit) => ({ ...visit, ...to.visits[visit.id] })),
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
            sections: note.sections.map((section) => ({ ...section, ...into?.sections[section.id] })),
            medications: note.medications.map((row) => ({ ...row, ...into?.medications?.[row.id] })),
            instructions: to.instructions[id] ?? note.instructions,
          },
        ];
      }),
    ),
    transcripts: Object.fromEntries(
      Object.entries(transcripts).map(([id, lines]) => [
        id,
        lines.map((line, index) => ({ ...line, text: to.transcripts[id]?.[index] ?? line.text })),
      ]),
    ),
    contexts: Object.fromEntries(
      Object.entries(contexts).map(([id, context]) => {
        const into = to.contexts[id];
        return [
          id,
          {
            files: context.files?.map((file) => ({ ...file, name: into?.files?.[file.id] ?? file.name })),
          },
        ];
      }),
    ),
    briefs: { ...briefs, ...to.briefs },
  };
}

/**
 * When a visit happened, as a key that sorts. The demo's day is fixed but the
 * clock is real, so a visit recorded in this browser is simply the newest of
 * its day, whatever time it says.
 */
export const visitOrder = (visit: Visit) =>
  `${visit.day}T${visit.since && visit.day === demoToday ? `~${visit.since}` : visit.time}`;

/** Keys are compared by code point: collation would put the "~" above before digits. */
const latestFirst = (a: Visit, b: Visit) => {
  const [x, y] = [visitOrder(a), visitOrder(b)];
  return x === y ? 0 : x < y ? 1 : -1;
};

/** Once a note is approved, everything the doctor had to check has been checked. */
function settled(note: Note): Note {
  return {
    ...note,
    sections: note.sections.map((section) => ({ ...section, uncertain: undefined })),
    medications: note.medications.map((row) => ({ ...row, unconfirmed: undefined })),
  };
}

/**
 * One language's dataset with this browser's changes laid over it: added
 * patients and recorded visits joined in, retried uploads, approvals, emailed
 * instructions, typed-in addresses and the doctor's visit types applied. `now` is fixed per request, so every component in a render agrees
 * on every status.
 */
function withChanges(data: Dataset, changes: WorkspaceChanges, now: number): Dataset {
  const template = data.visits.find((visit) => visit.id === "v1")!;
  const source = data.patients.find((patient) => patient.id === template.patientId)!;
  const sourceName = source.name.split(" ")[0];

  const patientsNow = [
    ...data.patients,
    ...changes.patients.map((patient) => ({
      ...patient,
      registered: demoToday.slice(0, 7),
      record: [],
    })),
  ].map((patient) => (changes.addresses[patient.id] ? { ...patient, email: changes.addresses[patient.id] } : patient));

  const notesNow = { ...data.notes };
  const transcriptsNow = { ...data.transcripts };

  // A freshly recorded demo visit is Maya's, rewritten for whoever was in the room.
  const recorded: Visit[] = changes.recorded.map((entry) => {
    const ready = now >= readyAt(entry.stoppedAt);
    const name = patientsNow.find((patient) => patient.id === entry.patientId)?.name.split(" ")[0];
    const rename = (text: string) => (name ? text.replaceAll(sourceName, name) : text);
    const draft = data.notes.v1;
    // The first line of History compares today with the last visit, which was Maya's and no one else's.
    const body = (section: NoteSection) =>
      rename(section.id === "history" ? section.body.split("\n").slice(1).join("\n") : section.body);
    notesNow[entry.id] = {
      ...draft,
      sections: draft.sections.map((section) => ({
        ...section,
        body: body(section),
        uncertain: section.uncertain?.map((flag) => ({ ...flag, text: rename(flag.text) })),
      })),
    };
    transcriptsNow[entry.id] = data.transcripts.v1
      .filter((line) => !line.earlier)
      .map((line) => ({ ...line, text: rename(line.text) }));
    return {
      id: entry.id,
      patientId: entry.patientId,
      reason: ready ? template.reason : "",
      day: demoToday,
      time: entry.time,
      seconds: entry.seconds,
      status: ready ? "ready" : "processing",
      since: entry.stoppedAt,
    };
  });

  const visitsNow = [...recorded, ...data.visits].map((visit): Visit => {
    const retried = changes.retried[visit.id];
    const current: Visit =
      visit.status === "failed" && retried
        ? {
            ...visit,
            status: now >= readyAt(retried) ? "ready" : "processing",
            failure: undefined,
            since: retried,
          }
        : visit;
    const sent = changes.emailed[visit.id];
    const typed: Visit = {
      ...current,
      ...(changes.types[visit.id] && { type: changes.types[visit.id] }),
      ...(sent && { emailed: { ...sent, day: demoToday } }),
    };
    const approvedAt = changes.approved[visit.id];
    if (typed.status !== "ready" || !approvedAt) return typed;
    notesNow[visit.id] = settled(notesNow[visit.id]);
    return { ...typed, status: "approved", approvedAt };
  });

  return { ...data, patients: patientsNow, visits: visitsNow, notes: notesNow, transcripts: transcriptsNow };
}

/** Lookups over one language's dataset. Every screen reads the demo through this. */
function views(data: Dataset) {
  const visits = [...data.visits].sort(latestFirst);
  const getPatient = (patientId: string | undefined) =>
    data.patients.find((patient) => patient.id === patientId);
  const getVisit = (visitId: string | undefined) => visits.find((visit) => visit.id === visitId);
  const getVisitsForPatient = (patientId: string) =>
    visits.filter((visit) => visit.patientId === patientId);
  /** The doctor's pick, else what Scribe took from the note, else first or follow-up by whether they have been seen before. */
  const getVisitType = (visit: Visit): VisitType =>
    visit.type ??
    (getVisitsForPatient(visit.patientId).some(
      (other) => other.id !== visit.id && visitOrder(other) < visitOrder(visit),
    )
      ? "follow-up"
      : "first");
  /** Nothing is written until processing has finished. */
  const written = (visitId: string) => {
    const status = getVisit(visitId)?.status;
    return status === "ready" || status === "approved";
  };
  const getNote = (visitId: string): Note | undefined =>
    written(visitId) ? data.notes[visitId] : undefined;

  return {
    doctor: data.doctor,
    recovery,
    patients: data.patients,
    /** Latest first. */
    visits,
    getPatient,
    getVisit,
    getVisitsForPatient,
    getVisitType,
    getNote,
    getTranscript: (visitId: string): TranscriptLine[] =>
      written(visitId) ? (data.transcripts[visitId] ?? []) : [],
    getContext: (visitId: string): VisitContext => data.contexts[visitId] ?? {},
    /**
     * The brief for going into a visit: as things stood before a filed one,
     * or as they stand now for the next. Undefined for someone with nothing
     * on record yet.
     */
    getBrief: (patientId: string, visitId?: string): Brief | undefined =>
      (visitId ? data.briefs[visitId] : undefined) ?? data.briefs[patientId],
    /**
     * What a doctor wants to know going into a visit: the one before it, and
     * the problems, medications and allergies on record at the time — each
     * with the visit it came from. Entries this visit itself records are in
     * its note, not here.
     */
    getPatientContext(patientId: string, visitId?: string) {
      const current = getVisit(visitId);
      const before = (visit: Visit | undefined) =>
        !current || !visit || visitOrder(visit) < visitOrder(current);
      const earlier = getVisitsForPatient(patientId).filter(
        (visit) => visit.id !== visitId && before(visit),
      );
      const previous = earlier.find((visit) => getNote(visit.id)) ?? earlier[0];

      const entries: SourcedEntry[] = (getPatient(patientId)?.record ?? []).flatMap((entry) => {
        const source = getVisit(entry.visitId);
        const ended = getVisit(entry.endedVisitId);
        const recordedHere = Boolean(visitId) && entry.visitId === visitId;
        if (recordedHere || (entry.visitId && !source) || !before(source)) return [];
        if (ended && (!current || before(ended))) return [];
        return [{ entry, source, pending: Boolean(source && source.status !== "approved") }];
      });
      const of = (kind: ClinicalEntry["kind"]) => entries.filter((item) => item.entry.kind === kind);

      return {
        previous,
        allergies: of("allergy"),
        problems: of("problem"),
        medications: of("medication"),
      };
    },
    /** Visits that cannot move forward without the doctor, latest first. */
    waiting: visits.filter((visit) => visit.status === "ready" || visit.status === "failed"),
  };
}

export type Demo = ReturnType<typeof views>;

const datasets = { en: english, fa: translated(farsi), ar: translated(arabic) };
const untouched = { en: views(datasets.en), fa: views(datasets.fa), ar: views(datasets.ar) };

/** The demo in one language, with whatever this browser has changed in it. */
export function demo(locale: Locale, changes: WorkspaceChanges = noChanges, now = 0): Demo {
  const changed =
    changes.recorded.length ||
    changes.patients.length ||
    Object.keys(changes.approved).length ||
    Object.keys(changes.retried).length ||
    Object.keys(changes.types).length ||
    Object.keys(changes.emailed).length ||
    Object.keys(changes.addresses).length;
  return changed ? views(withChanges(datasets[locale], changes, now)) : untouched[locale];
}

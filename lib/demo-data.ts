// Synthetic demo data. No real patient information belongs in this file.

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
  pronouns: string;
  registered: string;
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
  /** Which note section this turn is evidence for. */
  evidence?: NoteSectionId;
};

export type NoteVersion = {
  id: number;
  label: string;
  author: string;
  time: string;
  kind: "ai" | "manual" | "signature";
};

export const doctor = {
  name: "Dr. Priya Shah",
  initials: "PS",
  specialty: "General practice",
  registration: "GMC 7654321",
  email: "priya@cima.demo",
};

export const today = { weekday: "Tuesday", long: "22 September 2026" };

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Maya Thompson",
    initials: "MT",
    dob: "14 May 1988",
    age: 38,
    pronouns: "she/her",
    registered: "March 2021",
  },
  {
    id: "p2",
    name: "Jon Bell",
    initials: "JB",
    dob: "02 November 1971",
    age: 54,
    pronouns: "he/him",
    registered: "August 2016",
  },
  {
    id: "p3",
    name: "Elena Marquez",
    initials: "EM",
    dob: "29 January 1995",
    age: 31,
    pronouns: "she/her",
    registered: "January 2024",
  },
  {
    id: "p4",
    name: "Arthur Wright",
    initials: "AW",
    dob: "07 July 1948",
    age: 78,
    pronouns: "he/him",
    registered: "June 2009",
  },
  {
    id: "p5",
    name: "Nadia Okonkwo",
    initials: "NO",
    dob: "23 March 1990",
    age: 36,
    pronouns: "she/her",
    registered: "November 2022",
  },
  {
    id: "p6",
    name: "Tomas Lindqvist",
    initials: "TL",
    dob: "11 December 1966",
    age: 59,
    pronouns: "he/him",
    registered: "February 2018",
  },
];

export const visits: Visit[] = [
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
];

export const statusMeta: Record<
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
};

const transcripts: Record<string, TranscriptLine[]> = {
  v1: [
    {
      speaker: "Doctor",
      time: "00:18",
      text: "Tell me what has been happening with the cough, Maya.",
      evidence: "reason",
    },
    {
      speaker: "Patient",
      time: "00:24",
      text: "It started about six weeks ago after I had a cold. The cold went away but the cough just stayed.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "01:06",
      text: "Is it bringing anything up? Any fever, shortness of breath, pain in your chest, or blood?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "01:14",
      text: "No, none of those. It is dry. It is mostly annoying at night and sometimes wakes me up.",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "02:31",
      text: "I tried one of those cough syrups from the pharmacy but it did not really do anything.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "04:38",
      text: "We can arrange a chest X-ray now, or give it another two weeks as there are no warning signs in what you have told me.",
      evidence: "plan",
    },
    {
      speaker: "Patient",
      time: "04:51",
      text: "I would rather wait and see for now, if that is safe.",
      evidence: "plan",
    },
    {
      speaker: "Doctor",
      time: "05:02",
      text: "That is reasonable. Try honey and warm drinks before bed, and come back in two weeks if it has not settled. Sooner if you get breathless, feverish, or see any blood.",
      evidence: "plan",
    },
  ],
  v2: [
    {
      speaker: "Doctor",
      time: "00:22",
      text: "How have the home readings been since we changed the dose?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "00:29",
      text: "Pretty steady. Mostly around 138 over 84, give or take.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "01:40",
      text: "Any headaches, changes in your vision, chest pain, or swelling in your ankles?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "01:48",
      text: "None of that. I have been walking three times a week and cut back on salt.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "03:12",
      text: "Your reading here is 136 over 82, pulse 72 and regular. That is where we want it.",
      evidence: "examination",
    },
    {
      speaker: "Doctor",
      time: "06:05",
      text: "Let us keep the same dose, carry on with the home log, and I will book bloods before we meet again in six months.",
      evidence: "plan",
    },
  ],
  v3: [
    {
      speaker: "Doctor",
      time: "00:15",
      text: "How many migraine days have you had this month?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "00:21",
      text: "Two. It was about six before I started the propranolol, so it is a big difference.",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "02:44",
      text: "I still get the visual aura first, but the headache afterwards is shorter and not as bad.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "04:02",
      text: "Any side effects from the propranolol? Tiredness, cold hands, anything like that?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "04:10",
      text: "No, nothing. The night shifts are still the thing that sets it off.",
      evidence: "assessment",
    },
    {
      speaker: "Doctor",
      time: "07:20",
      text: "Stay on the same dose, keep the diary going for another couple of months, and we will review in three.",
      evidence: "plan",
    },
  ],
  v5: [
    {
      speaker: "Doctor",
      time: "00:19",
      text: "When did the knee start bothering you?",
      evidence: "reason",
    },
    {
      speaker: "Patient",
      time: "00:26",
      text: "About three weeks ago, after a long hike. It was the way down that did it.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "01:33",
      text: "Does it ever lock, or give way underneath you? Any swelling?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "01:41",
      text: "No locking, no giving way, and it has not swollen up. It is worse on stairs going down.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "03:58",
      text: "It is tender along the inside joint line, and you are moving it fully without any fluid there.",
      evidence: "examination",
    },
    {
      speaker: "Doctor",
      time: "08:12",
      text: "Keep moving but ease off the long descents, do these quad exercises, and come back in four weeks if it is still there.",
      evidence: "plan",
    },
  ],
  v6: [
    {
      speaker: "Doctor",
      time: "00:14",
      text: "What has been going on over the last few days?",
      evidence: "reason",
    },
    {
      speaker: "Patient",
      time: "00:20",
      text: "Sore throat, blocked nose, and I am just tired. Three days now.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "01:02",
      text: "Any fever, trouble swallowing, or breathlessness?",
      evidence: "history",
    },
    {
      speaker: "Patient",
      time: "01:09",
      text: "No, none of that. Just miserable.",
      evidence: "history",
    },
    {
      speaker: "Doctor",
      time: "03:30",
      text: "This should settle by itself. Fluids and paracetamol, and come back if it drags past ten days.",
      evidence: "plan",
    },
  ],
};

const versions: Record<string, NoteVersion[]> = {
  v1: [
    { id: 1, label: "AI draft generated", author: "Cima", time: "09:38", kind: "ai" },
    { id: 2, label: "History corrected", author: "You", time: "09:41", kind: "manual" },
  ],
  v2: [
    { id: 1, label: "AI draft generated", author: "Cima", time: "08:54", kind: "ai" },
    { id: 2, label: "Plan rewritten as actions", author: "Cima", time: "08:58", kind: "ai" },
    { id: 3, label: "Signed and locked", author: "Dr. Priya Shah", time: "09:01", kind: "signature" },
  ],
  v3: [
    { id: 1, label: "AI draft generated", author: "Cima", time: "16:29", kind: "ai" },
    { id: 2, label: "Signed and locked", author: "Dr. Priya Shah", time: "16:34", kind: "signature" },
  ],
  v5: [
    { id: 1, label: "AI draft generated", author: "Cima", time: "11:33", kind: "ai" },
    { id: 2, label: "Examination clarified", author: "You", time: "11:36", kind: "manual" },
    { id: 3, label: "Signed and locked", author: "Dr. Priya Shah", time: "11:38", kind: "signature" },
  ],
  v6: [
    { id: 1, label: "AI draft generated", author: "Cima", time: "15:58", kind: "ai" },
    { id: 2, label: "Signed and locked", author: "Dr. Priya Shah", time: "16:02", kind: "signature" },
  ],
};

export const signedAt: Record<string, string> = {
  v2: "22 Sep 2026 at 09:01",
  v3: "21 Sep 2026 at 16:34",
  v5: "21 Sep 2026 at 11:38",
  v6: "18 Aug 2026 at 16:02",
};

export function getPatient(patientId: string | undefined) {
  return patients.find((patient) => patient.id === patientId);
}

export function getVisit(visitId: string | undefined) {
  return visits.find((visit) => visit.id === visitId);
}

export function getPatientForVisit(visitId: string | undefined) {
  return getPatient(getVisit(visitId)?.patientId);
}

export function getVisitsForPatient(patientId: string) {
  return visits.filter((visit) => visit.patientId === patientId);
}

export function getNote(visitId: string): NoteSection[] | undefined {
  return notes[visitId];
}

export function getTranscript(visitId: string): TranscriptLine[] {
  return transcripts[visitId] ?? [];
}

export function getVersions(visitId: string): NoteVersion[] {
  return (
    versions[visitId] ?? [
      { id: 1, label: "AI draft generated", author: "Cima", time: "09:38", kind: "ai" },
    ]
  );
}

/** Visits carrying a note the doctor can open. */
export const noteVisits = visits.filter(
  (visit) => visit.status === "draft-ready" || visit.status === "signed",
);

/** Visits that cannot move forward without the doctor. */
export const actionableVisits = visits.filter(
  (visit) => visit.status === "draft-ready" || visit.status === "failed",
);

/** The note a freshly captured demo consultation lands on. */
export const freshNote: NoteSection[] = notes.v1;

/** The worklist filters. Lives here so server components can read them too. */
export const visitFilters = [
  { id: "all", label: "All" },
  { id: "draft-ready", label: "To review" },
  { id: "signed", label: "Signed" },
  { id: "failed", label: "Attention" },
] as const;

export type VisitFilter = (typeof visitFilters)[number]["id"];

export function toVisitFilter(value: string | string[] | undefined): VisitFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return visitFilters.some((option) => option.id === candidate)
    ? (candidate as VisitFilter)
    : "all";
}

// What this browser has done to the demo since it opened it: consultations
// recorded, patients added, notes approved. It is a cookie rather than client
// state so that every server-rendered surface — Home, the sidebar badge, the
// patient record — reads the same workspace as the page that changed it.

import type { VisitStatus } from "@/lib/demo-data";

export const workspaceCookie = "scribe-workspace";

/** A consultation recorded in this browser. Its note is drafted on a mock timer. */
export type RecordedVisit = {
  id: string;
  patientId: string;
  seconds: number;
  /** Local clock time the recording started, HH:MM. */
  time: string;
  /** When the recording stopped, in epoch ms. Processing is timed from here. */
  stoppedAt: number;
};

/** A patient added from the capture screen: the only two fields the product asks for. */
export type AddedPatient = {
  id: string;
  name: string;
  /** yyyy-mm-dd, formatted per language when read. */
  dob: string;
};

export type WorkspaceChanges = {
  recorded: RecordedVisit[];
  patients: AddedPatient[];
  /** Visit id → local clock time it was approved, HH:MM. */
  approved: Record<string, string>;
};

export const noChanges: WorkspaceChanges = { recorded: [], patients: [], approved: {} };

export function parseChanges(raw: string | undefined): WorkspaceChanges {
  if (!raw) return noChanges;
  try {
    const value = JSON.parse(raw) as Partial<WorkspaceChanges>;
    return {
      recorded: Array.isArray(value.recorded) ? value.recorded : [],
      patients: Array.isArray(value.patients) ? value.patients : [],
      approved:
        value.approved && typeof value.approved === "object" ? value.approved : {},
    };
  } catch {
    return noChanges;
  }
}

/**
 * The mock pipeline behind a freshly recorded visit: seconds after the
 * recording stopped at which each stage hands over to the next. Every stage
 * reads "Processing" on the badge; the Activity tab shows which one it is on.
 */
const stages: { status: VisitStatus; until: number }[] = [
  { status: "uploading", until: 3 },
  { status: "transcribing", until: 7 },
  { status: "drafting", until: 11 },
];

export function recordedStatus(visit: RecordedVisit, now: number): VisitStatus {
  const elapsed = (now - visit.stoppedAt) / 1000;
  return stages.find((stage) => elapsed < stage.until)?.status ?? "draft-ready";
}

/** The moment this visit next changes status, or null once its draft is ready. */
export function nextStatusChange(visit: RecordedVisit, now: number): number | null {
  const boundary = stages
    .map((stage) => visit.stoppedAt + stage.until * 1000)
    .find((at) => at > now);
  return boundary ?? null;
}

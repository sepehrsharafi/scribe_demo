// What this browser has done to the demo since it opened it: visits recorded,
// patients added, notes approved, uploads retried, visits retyped, instructions
// emailed. It is a
// cookie rather than client state so that every server-rendered surface — the
// sidebar, Home, the patient record — reads the same workspace as the page
// that changed it.

import type { VisitType } from "@/lib/demo-data";

export const workspaceCookie = "scribe-workspace";

/** A visit recorded in this browser. Its note is written on a mock timer. */
export type RecordedVisit = {
  id: string;
  patientId: string;
  seconds: number;
  /** Local clock time the recording started, HH:MM. */
  time: string;
  /** When the recording stopped, in epoch ms. Processing is timed from here. */
  stoppedAt: number;
};

/** A patient added from the picker: the only two things the product asks for. */
export type AddedPatient = {
  id: string;
  name: string;
  /** yyyy-mm-dd. */
  born: string;
};

export type WorkspaceChanges = {
  recorded: RecordedVisit[];
  patients: AddedPatient[];
  /** Visit id → local clock time it was approved, HH:MM. */
  approved: Record<string, string>;
  /** Visit id → when a failed upload was retried, in epoch ms. */
  retried: Record<string, number>;
  /** Visit id → the type the doctor chose, which outranks Scribe's. */
  types: Record<string, VisitType>;
  /** Visit id → where its instructions were last emailed, and the local clock time, HH:MM. */
  emailed: Record<string, { to: string; time: string }>;
  /** Patient id → an address the doctor typed when emailing; it replaces the one on file. */
  addresses: Record<string, string>;
};

export const noChanges: WorkspaceChanges = {
  recorded: [],
  patients: [],
  approved: {},
  retried: {},
  types: {},
  emailed: {},
  addresses: {},
};

const list = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : []);
const map = <T,>(value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, T>) : {};

export function parseChanges(raw: string | undefined): WorkspaceChanges {
  if (!raw) return noChanges;
  try {
    const value = JSON.parse(raw) as Partial<WorkspaceChanges>;
    return {
      recorded: list(value.recorded),
      patients: list(value.patients),
      approved: map(value.approved),
      retried: map(value.retried),
      types: map(value.types),
      emailed: map(value.emailed),
      addresses: map(value.addresses),
    };
  } catch {
    return noChanges;
  }
}

/**
 * What happens to a recording once it stops, and roughly how long each part
 * takes. The visit page walks through these one at a time, so the doctor
 * always knows what they are waiting for.
 */
export const processingSteps = [
  { id: "upload", seconds: 2.5 },
  { id: "transcribe", seconds: 4 },
  { id: "note", seconds: 4 },
  { id: "instructions", seconds: 2.5 },
] as const;

export type ProcessingStep = (typeof processingSteps)[number]["id"];

/** From the moment processing starts to the moment the note is ready, in ms. */
export const processingTime = processingSteps.reduce((total, step) => total + step.seconds, 0) * 1000;

export const readyAt = (since: number) => since + processingTime;

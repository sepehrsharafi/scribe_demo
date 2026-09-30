"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sessionCookie } from "@/lib/session";
import { parseChanges, workspaceCookie, type WorkspaceChanges } from "@/lib/workspace";

/** Reads this browser's changes, applies one more, and writes them back. */
async function change(update: (changes: WorkspaceChanges) => WorkspaceChanges) {
  const store = await cookies();
  if (!store.has(sessionCookie)) throw new Error("Signed out");
  const next = update(parseChanges(store.get(workspaceCookie)?.value));
  store.set(workspaceCookie, JSON.stringify(next), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  // The sidebar's visit list and Home read these too, not just the page that changed.
  revalidatePath("/", "layout");
}

const clock = (value: string) => (/^\d{2}:\d{2}$/.test(value) ? value : "00:00");

/** Registers someone new — a name and a date of birth — and opens a visit for them. */
export async function addPatient(input: { name: string; born: string }) {
  const name = input.name.trim().slice(0, 80);
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(input.born)) throw new Error("A name and a date of birth are needed");
  let id = "";
  await change((changes) => {
    id = `n${changes.patients.length + 1}`;
    return { ...changes, patients: [...changes.patients, { id, name, born: input.born }] };
  });
  redirect(`/new?patient=${id}`);
}

/**
 * Files a finished recording and opens the visit it became, where the note
 * is written step by step. The id comes from the browser so that anything the
 * doctor attached while recording can follow the visit to its new address.
 */
export async function saveRecording(input: {
  id: string;
  patientId: string;
  seconds: number;
  /** Local clock time the recording started, HH:MM. */
  time: string;
  stoppedAt: number;
}) {
  if (!/^r[a-z0-9]{4,16}$/.test(input.id)) throw new Error("Not a visit id");
  await change((changes) => ({
    ...changes,
    recorded: [
      {
        id: input.id,
        patientId: input.patientId,
        seconds: Math.max(0, Math.round(input.seconds)),
        time: clock(input.time),
        stoppedAt: Number(input.stoppedAt) || Date.now(),
      },
      ...changes.recorded.filter((visit) => visit.id !== input.id),
    ],
  }));
  redirect(`/visits/${input.id}`);
}

/** Picks a stopped upload up again. The audio never left the device, so nothing is re-recorded. */
export async function retryUpload(visitId: string) {
  await change((changes) => ({ ...changes, retried: { ...changes.retried, [visitId]: Date.now() } }));
}

export async function approveNote(visitId: string, time: string) {
  await change((changes) => ({
    ...changes,
    approved: { ...changes.approved, [visitId]: clock(time) },
  }));
}

/** Undoes an approval made a moment ago. */
export async function reopenNote(visitId: string) {
  await change((changes) => {
    const approved = { ...changes.approved };
    delete approved[visitId];
    return { ...changes, approved };
  });
}

/** Puts the demo back as it shipped, ready for the next walkthrough. */
export async function resetWorkspace() {
  const store = await cookies();
  store.delete(workspaceCookie);
  revalidatePath("/", "layout");
}

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
  // The sidebar badge and Home read these too, not just the page that changed.
  revalidatePath("/", "layout");
}

const clock = (value: string) => (/^\d{2}:\d{2}$/.test(value) ? value : "00:00");

/**
 * Files a stopped recording against its patient and hands the doctor back to
 * the worklist, where the visit shows itself processing. There is no screen to
 * wait on.
 */
export async function saveRecording(input: {
  patient: { id: string } | { name: string; dob: string };
  seconds: number;
  /** Local clock time the recording started, HH:MM. */
  time: string;
  stoppedAt: number;
}) {
  await change((changes) => {
    let patients = changes.patients;
    let patientId: string;
    if ("id" in input.patient) {
      patientId = input.patient.id;
    } else {
      patientId = `n${patients.length + 1}`;
      patients = [
        ...patients,
        { id: patientId, name: input.patient.name.trim(), dob: input.patient.dob },
      ];
    }
    return {
      ...changes,
      patients,
      recorded: [
        {
          id: `r${changes.recorded.length + 1}`,
          patientId,
          seconds: Math.max(0, Math.round(input.seconds)),
          time: clock(input.time),
          stoppedAt: Number(input.stoppedAt) || Date.now(),
        },
        ...changes.recorded,
      ],
    };
  });
  redirect("/visits");
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

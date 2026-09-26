"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiCollapseDiagonalLine } from "@remixicon/react";
import { useState, useTransition } from "react";
import type { Note, Patient } from "@/lib/demo-data";
import { saveRecording } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Page, PageHead } from "@/components/page-layout";
import { Consultation } from "@/components/consultation";
import { useI18n } from "@/components/i18n-provider";
import {
  elapsedSeconds,
  useActiveRecording,
  type LiveRecording,
  type NewPatient,
} from "@/components/active-recording";
import { PatientDialog } from "./pick-patient";
import { Recorder } from "./recorder";
import { WriteUp } from "./write-up";

type Stage = "record" | "write" | "review";

/** A consultation the doctor typed instead of recording. */
type Written = { reason: string; note: Note };

/** HH:MM, some seconds ago. */
const clockAt = (secondsAgo: number) =>
  new Date(Date.now() - secondsAgo * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Record the consultation, or write it up by hand. The patient can be chosen
 * before, during or after — only saving needs one. A saved recording goes
 * straight back to the worklist, where it shows itself processing; there is
 * no screen to wait on.
 *
 * Until a recording starts, the patient is this screen's to hold. Once it
 * starts, the recording holds it — it outlives the screen, so a recording in
 * progress is what this screen shows, whatever the link that opened it asked for.
 */
export function Capture({
  patientId,
  resumed = false,
}: {
  patientId?: string;
  resumed?: boolean;
}) {
  const { t, demo } = useI18n();
  const router = useRouter();
  const { doctor, getPatient, recovery } = demo;

  // A recovered recording, or a patient already in context, arrives attached.
  const known = getPatient(resumed ? recovery.patientId : patientId);

  const controls = useActiveRecording();
  const [stage, setStage] = useState<Stage>("record");
  const [chosen, setChosen] = useState<{ patient: Patient | null; added: NewPatient | null }>({
    patient: known ?? null,
    added: null,
  });
  // The recording as it was handed to the server, shown while it saves: the
  // live one is cleared at once so the corner card never outlives it.
  const [filed, setFiled] = useState<LiveRecording | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [written, setWritten] = useState<Written | null>(null);
  const [saving, startSaving] = useTransition();

  const recording = controls.recording ?? filed;
  const patient = recording ? recording.patient : chosen.patient;

  function choose(next: Patient, added: NewPatient | null) {
    if (controls.recording) controls.attach(next, added);
    else setChosen({ patient: next, added });
  }

  function save() {
    if (!recording?.patient) return;
    const now = Date.now();
    const seconds = elapsedSeconds(recording, now);
    const target = recording.added ?? { id: recording.patient.id };
    setFiled({ ...recording, phase: "stopped", banked: seconds * 1000, since: null });
    controls.clear();
    startSaving(() =>
      saveRecording({ patient: target, seconds, time: clockAt(seconds), stoppedAt: now }),
    );
  }

  // With the patient known, finishing is saving. Without one, the recording
  // waits, and the picker opens so the doctor can see why.
  function finish() {
    if (recording?.patient) {
      save();
    } else {
      controls.stop();
      setChoosing(true);
    }
  }

  /** Back to wherever the doctor came from; the recording follows in the corner. */
  function minimise() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  if (stage === "review" && patient && written) {
    return (
      <Consultation
        data={{
          patient,
          reason: written.reason,
          dateLong: demo.today.short,
          manual: true,
          status: "draft-ready",
          note: written.note,
          transcript: [],
          versions: [
            {
              id: 1,
              label: t("Written by hand"),
              author: doctor.name,
              time: clockAt(0),
              kind: "manual",
            },
          ],
        }}
      />
    );
  }

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={
          patient ? t("Consultation · {name}", { name: patient.name }) : t("New consultation")
        }
        title={stage === "write" ? t("Write the consultation") : t("Recording")}
        actions={
          stage !== "record" || saving ? null : recording ? (
            <Button variant="outline" onClick={minimise}>
              <RiCollapseDiagonalLine data-icon="inline-start" />
              {t("Minimise")}
            </Button>
          ) : (
            <Button variant="outline" render={<Link href="/" />}>
              {t("Cancel")}
            </Button>
          )
        }
      />

      {stage === "record" ? (
        <Recorder
          recording={recording}
          patient={patient}
          recovered={resumed ? recovery.seconds : 0}
          saving={saving}
          onStart={() =>
            controls.start({
              patient: chosen.patient,
              added: chosen.added,
              recovered: resumed ? recovery.seconds : 0,
            })
          }
          onPause={controls.pause}
          onResume={controls.resume}
          onFinish={finish}
          onSave={save}
          onDiscard={() => {
            controls.clear();
            router.push("/");
          }}
          onChoosePatient={resumed ? undefined : () => setChoosing(true)}
          onWriteInstead={() => setStage("write")}
        />
      ) : null}

      {stage === "write" ? (
        <WriteUp
          patient={patient}
          onChoosePatient={() => setChoosing(true)}
          onBack={() => setStage("record")}
          onSave={(reason, note) => {
            setWritten({ reason, note });
            setStage("review");
          }}
        />
      ) : null}

      <PatientDialog
        open={choosing}
        onOpenChange={setChoosing}
        description={
          stage === "write"
            ? t("The consultation is saved to this patient's record.")
            : t("A recording cannot be saved without a patient. Choosing one does not stop or pause it.")
        }
        onSelect={(next, fresh) => choose(next, fresh ?? null)}
      />
    </Page>
  );
}

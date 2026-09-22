"use client";

import Link from "next/link";
import { useState } from "react";
import type { NoteSection, Patient } from "@/lib/demo-data";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Page, PageHead } from "@/components/page-layout";
import { Consultation } from "@/components/consultation";
import { useI18n } from "@/components/i18n-provider";
import { PickPatient } from "./pick-patient";
import { Processing } from "./processing";
import { Recorder } from "./recorder";
import { WriteUp } from "./write-up";

type Stage = "pick" | "record" | "write" | "processing" | "review";

/** A consultation the doctor typed instead of recording. */
type Written = { reason: string; note: NoteSection[] };

const now = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * Pick a patient, then either record the consultation or write it up by hand.
 * The only things carried between screens are the patient and what came out of
 * the room — audio length, or the text the doctor typed.
 */
export function Capture({
  patientId,
  resumed = false,
}: {
  patientId?: string;
  resumed?: boolean;
}) {
  const { t, demo } = useI18n();
  const { doctor, getPatient, recovery } = demo;

  // A recovered recording, or a patient already in context, skips the picker.
  const known = getPatient(resumed ? recovery.patientId : patientId);

  const [stage, setStage] = useState<Stage>(known ? "record" : "pick");
  const [patient, setPatient] = useState<Patient | null>(known ?? null);
  const [captured, setCaptured] = useState(0);
  const [written, setWritten] = useState<Written | null>(null);

  if (stage === "review" && patient) {
    return (
      <Consultation
        data={{
          patient,
          reason: written ? written.reason : (demo.getVisit("v1")?.reason ?? ""),
          dateLong: demo.today.long,
          time: now(),
          duration: written ? undefined : formatDuration(captured),
          manual: Boolean(written),
          status: "draft-ready",
          note: written ? written.note : demo.freshNoteFor(patient.name.split(" ")[0]),
          transcript: written ? [] : demo.getTranscript("v1"),
          versions: [
            written
              ? {
                  id: 1,
                  label: t("Written by hand"),
                  author: doctor.name,
                  time: now(),
                  kind: "manual",
                }
              : {
                  id: 1,
                  label: t("AI draft generated"),
                  author: t("Scribe"),
                  time: t("now"),
                  kind: "ai",
                },
          ],
        }}
      />
    );
  }

  const heading = {
    pick: { eyebrow: t("New consultation"), title: t("Who are you seeing?") },
    record: {
      eyebrow: t("Consultation · {name}", { name: patient?.name ?? "" }),
      title: t("Recording"),
    },
    write: {
      eyebrow: t("Consultation · {name}", { name: patient?.name ?? "" }),
      title: t("Write the consultation"),
    },
    processing: {
      eyebrow: t("Visit saved · {name}", { name: patient?.name ?? "" }),
      title: t("Building the note"),
    },
  }[stage as Exclude<Stage, "review">];

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={heading.eyebrow}
        title={heading.title}
        actions={
          stage === "pick" ? (
            <Button variant="outline" render={<Link href="/" />}>
              {t("Cancel")}
            </Button>
          ) : null
        }
      />

      {stage === "pick" ? (
        <PickPatient
          onSelect={(selected) => {
            setPatient(selected);
            setStage("record");
          }}
        />
      ) : null}

      {stage === "record" && patient ? (
        <Recorder
          patient={patient}
          recovered={resumed ? recovery.seconds : 0}
          onChangePatient={resumed ? undefined : () => setStage("pick")}
          onWriteInstead={() => setStage("write")}
          onStop={(seconds) => {
            setCaptured(seconds);
            setStage("processing");
          }}
        />
      ) : null}

      {stage === "write" && patient ? (
        <WriteUp
          patient={patient}
          onBack={() => setStage("record")}
          onSave={(reason, note) => {
            setWritten({ reason, note });
            setStage("review");
          }}
        />
      ) : null}

      {stage === "processing" && patient ? (
        <Processing
          duration={formatDuration(captured)}
          patient={patient}
          onReady={() => setStage("review")}
        />
      ) : null}
    </Page>
  );
}

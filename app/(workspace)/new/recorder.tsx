"use client";

import {
  RiDeleteBinLine,
  RiExpandUpDownLine,
  RiMicLine,
  RiPauseFill,
  RiPlayFill,
  RiSaveLine,
  RiStopFill,
  RiUserSearchLine,
} from "@remixicon/react";
import { useState } from "react";
import type { Patient } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatDuration } from "@/lib/utils";
import { Elapsed, type LiveRecording } from "@/components/active-recording";
import { PatientAvatar } from "@/components/patient-avatar";
import { PatientContext } from "@/components/patient-context";
import { BirthDate } from "@/components/patient-facts";
import { useI18n } from "@/components/i18n-provider";
import { AttachedPatient } from "./pick-patient";

/* Deterministic bar heights — random values would break hydration. */
const bars = Array.from({ length: 56 }, (_, index) => ({
  idle: 0.12 + ((index * 7) % 5) * 0.04,
  live: 0.45 + ((index * 13) % 11) * 0.05,
  delay: `${((index * 37) % 9) * -0.11}s`,
}));

function Meter({ live }: { live: boolean }) {
  const { t } = useI18n();

  return (
    <div
      className="flex h-16 w-full items-center justify-center gap-0.5"
      role="img"
      aria-label={live ? t("Microphone is picking up sound") : t("Microphone idle")}
    >
      {bars.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            live ? "animate-pulse bg-primary" : "bg-border",
          )}
          style={{
            height: `${(live ? bar.live : bar.idle) * 100}%`,
            animationDelay: live ? bar.delay : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Who the recording is for. A patient on file brings their context — the
 * allergies, problems, medications and last visit the doctor would otherwise
 * go and look up — and their name is the control that changes them.
 */
function PatientRail({
  patient,
  onChoose,
  required,
}: {
  patient: Patient | null;
  onChoose?: () => void;
  required: boolean;
}) {
  const { t, demo } = useI18n();

  if (!patient || !demo.getPatient(patient.id)) {
    return <AttachedPatient patient={patient} onChoose={onChoose} required={required} />;
  }

  const identity = (
    <>
      <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
      <span className="grid min-w-0 text-start">
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <span className="truncate">{patient.name}</span>
          {onChoose ? <RiExpandUpDownLine className="size-4 shrink-0 text-muted-foreground" /> : null}
        </span>
        <BirthDate dob={patient.dob} age={patient.age} />
      </span>
    </>
  );

  return (
    <PatientContext
      patientId={patient.id}
      heading={
        onChoose ? (
          <button
            type="button"
            onClick={onChoose}
            aria-label={t("Change patient")}
            title={t("Change patient")}
            className="-m-1.5 flex min-w-0 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-background/60"
          >
            {identity}
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-3">{identity}</span>
        )
      }
    />
  );
}

/**
 * The recording screen, kept to the recording: the clock, the controls, and
 * the patient. Consent comes first; the patient does not have to — a doctor
 * can start talking and attach the patient during the recording or after it.
 * What cannot happen is saving a recording that belongs to nobody.
 *
 * The recording itself is held above this screen, so leaving it minimises the
 * recording to the corner rather than stopping it.
 */
export function Recorder({
  recording,
  patient,
  recovered,
  saving,
  onStart,
  onPause,
  onResume,
  onFinish,
  onSave,
  onDiscard,
  onChoosePatient,
  onWriteInstead,
}: {
  /** Null until it starts. */
  recording: LiveRecording | null;
  patient: Patient | null;
  /** Seconds restored from a lost session, offered back before it starts. */
  recovered: number;
  saving: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onChoosePatient?: () => void;
  /** Not every consultation can be recorded — a phone call, a home visit. */
  onWriteInstead?: () => void;
}) {
  const { t } = useI18n();
  // A recovered recording was consented to when it first started.
  const [consent, setConsent] = useState(recovered > 0);
  // Throwing a consultation away takes two presses, never one.
  const [discarding, setDiscarding] = useState(false);

  const phase = recording?.phase ?? "ready";
  const live = phase === "recording";

  const label = {
    ready: recovered ? t("Recovered") : t("Ready when you are"),
    recording: t("Recording"),
    paused: t("Paused"),
    stopped: saving ? t("Saving") : t("Recording stopped"),
  }[phase];

  // Said only when there is something the doctor needs to know.
  const message =
    phase === "recording"
      ? t("You can leave this page. The recording carries on in the corner.")
      : phase === "stopped" && !patient
        ? t("Attach a patient to save this recording.")
        : phase === "ready" && recovered
          ? t("{duration} was restored from this device.", { duration: formatDuration(recovered) })
          : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <Card
        className={cn(
          "items-center py-12 text-center transition-colors",
          live && "ring-2 ring-primary/30",
          phase === "stopped" && !patient && "ring-2 ring-warning/40",
        )}
      >
        <CardContent className="flex w-full flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {recording ? (
              <span
                aria-hidden="true"
                className={cn(
                  "size-2.5 rounded-full",
                  live ? "animate-pulse bg-destructive" : "bg-muted-foreground",
                )}
              />
            ) : null}
            {label}
          </span>

          <strong
            className={cn(
              "font-heading text-6xl leading-none font-bold tracking-tighter tabular-nums sm:text-7xl",
              phase === "paused" && "text-muted-foreground",
            )}
          >
            {recording ? <Elapsed recording={recording} /> : formatDuration(recovered)}
          </strong>

          <Meter live={live} />

          {message ? (
            <p className="max-w-prose text-balance text-muted-foreground" aria-live="polite">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {phase === "ready" ? (
              <Button
                size="lg"
                onClick={onStart}
                disabled={!consent}
                title={consent ? undefined : t("Confirm patient consent first")}
              >
                <RiMicLine data-icon="inline-start" />
                {recovered ? t("Resume recording") : t("Start recording")}
              </Button>
            ) : null}

            {phase === "recording" || phase === "paused" ? (
              <>
                <Button variant="outline" size="lg" onClick={live ? onPause : onResume}>
                  {live ? (
                    <RiPauseFill data-icon="inline-start" />
                  ) : (
                    <RiPlayFill data-icon="inline-start" />
                  )}
                  {live ? t("Pause") : t("Resume")}
                </Button>
                <Button size="lg" onClick={onFinish}>
                  <RiStopFill data-icon="inline-start" />
                  {t("Finish consultation")}
                </Button>
              </>
            ) : null}

            {phase === "stopped" && !patient ? (
              <>
                <Button
                  variant={discarding ? "destructive" : "ghost"}
                  size="lg"
                  onClick={() => (discarding ? onDiscard() : setDiscarding(true))}
                >
                  <RiDeleteBinLine data-icon="inline-start" />
                  {discarding ? t("Discard this recording?") : t("Discard")}
                </Button>
                <Button size="lg" onClick={onChoosePatient}>
                  <RiUserSearchLine data-icon="inline-start" />
                  {t("Select or add patient")}
                </Button>
              </>
            ) : null}

            {phase === "stopped" && patient ? (
              <Button size="lg" disabled={saving} onClick={onSave}>
                {saving ? <Spinner data-icon="inline-start" /> : <RiSaveLine data-icon="inline-start" />}
                {t("Save visit")}
              </Button>
            ) : null}
          </div>

          {phase === "ready" && !recovered ? (
            <Label className="cursor-pointer gap-2.5 text-sm font-normal text-muted-foreground">
              <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
              {t("The patient has agreed to be recorded")}
            </Label>
          ) : null}

          {phase === "ready" && onWriteInstead ? (
            <p className="text-xs text-muted-foreground">
              {t("Nothing to record — a phone call, a home visit?")}{" "}
              <button
                type="button"
                onClick={onWriteInstead}
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                {t("Write it up by hand")}
              </button>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <aside>
        <PatientRail
          patient={patient}
          onChoose={saving ? undefined : onChoosePatient}
          required={phase === "stopped"}
        />
      </aside>
    </div>
  );
}

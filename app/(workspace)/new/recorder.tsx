"use client";

import {
  RiHistoryLine,
  RiMicLine,
  RiPauseFill,
  RiPlayFill,
  RiShieldCheckLine,
  RiStopFill,
  RiTimeLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import type { Patient } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn, formatDuration } from "@/lib/utils";
import { PatientAvatar } from "@/components/patient-avatar";
import { useI18n } from "@/components/i18n-provider";
import { Assurance, SidePanel } from "./side-panel";

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
 * The recording screen. A recovered visit arrives already consented and
 * running, because the doctor already started it once.
 */
export function Recorder({
  patient,
  recovered = 0,
  onStop,
  onChangePatient,
  onWriteInstead,
}: {
  patient: Patient;
  /** Seconds restored from a previous session, if this is a resumed visit. */
  recovered?: number;
  onStop: (seconds: number) => void;
  onChangePatient?: () => void;
  /** Not every consultation can be recorded — a phone call, a home visit. */
  onWriteInstead?: () => void;
}) {
  const { t } = useI18n();
  const resumed = recovered > 0;
  const [consent, setConsent] = useState(resumed);
  const [recording, setRecording] = useState(resumed);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(recovered);

  const live = recording && !paused;

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [live]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card
        className={cn(
          "items-center py-12 text-center transition-colors",
          live && "ring-2 ring-primary/30",
        )}
      >
        <CardContent className="flex w-full flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {recording ? (
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  paused ? "bg-muted-foreground" : "animate-pulse bg-destructive",
                )}
              />
            ) : null}
            {recording ? (paused ? t("Paused") : t("Recording")) : t("Ready when you are")}
          </span>

          <strong className="font-heading text-6xl leading-none font-bold tracking-tighter tabular-nums sm:text-7xl">
            {formatDuration(seconds)}
          </strong>

          <Meter live={live} />

          <p className="max-w-prose text-sm leading-relaxed text-balance text-muted-foreground">
            {recording
              ? t("Audio is written to this device as you speak. You can leave this page and come back without losing the visit.")
              : t("Confirm consent to enable recording. Once it starts, there is nothing to watch — talk to your patient.")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!recording ? (
              <Button
                size="lg"
                onClick={() => setRecording(true)}
                disabled={!consent}
                title={consent ? undefined : t("Confirm patient consent first")}
              >
                <RiMicLine data-icon="inline-start" />
                {t("Start recording")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={() => setPaused(!paused)}
                  aria-label={paused ? t("Resume recording") : t("Pause recording")}
                >
                  {paused ? <RiPlayFill /> : <RiPauseFill />}
                </Button>
                <Button size="lg" onClick={() => onStop(seconds)}>
                  <RiStopFill data-icon="inline-start" />
                  {t("Finish consultation")}
                </Button>
              </>
            )}
          </div>

          {!recording && onWriteInstead ? (
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

      <aside className="space-y-4">
        <SidePanel title="Patient">
          <div className="flex items-center gap-3">
            <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold">
                {patient.name}
              </strong>
              <span className="text-xs text-muted-foreground">
                {t("DOB {dob}", { dob: patient.dob })}
                {patient.age ? ` · ${t("{age} years", { age: patient.age })}` : ""}
              </span>
            </div>
          </div>
          {onChangePatient && !recording ? (
            <Button
              variant="ghost"
              size="xs"
              className="mt-3 -ms-2"
              onClick={onChangePatient}
            >
              {t("Change patient")}
            </Button>
          ) : null}
        </SidePanel>

        <Label
          className={cn(
            "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
            consent ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
            recording && "cursor-default opacity-80",
          )}
        >
          <Checkbox
            checked={consent}
            disabled={recording}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5"
          />
          <span>
            <strong className="block text-xs font-semibold">
              {t("Patient consent confirmed")}
            </strong>
            <span className="mt-0.5 block text-xs leading-relaxed font-normal text-muted-foreground">
              {t("The patient has agreed to this consultation being recorded for clinical documentation.")}
            </span>
          </span>
        </Label>

        {resumed ? (
          <Card size="sm" className="border-warning/40 bg-warning/5 ring-warning/20">
            <CardContent className="flex gap-3">
              <RiHistoryLine className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <strong className="block text-xs font-semibold">
                  {t("Resumed from recovery")}
                </strong>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("{duration} of audio was restored from this device and the timer continued.", {
                    duration: formatDuration(recovered),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <SidePanel title="While you talk">
          <div className="grid gap-4">
            <Assurance
              icon={RiShieldCheckLine}
              title="Saved as you speak"
              copy="Encrypted chunks, written continuously."
            />
            <Assurance
              icon={RiTimeLine}
              title="Nothing to type now"
              copy="The structured note comes afterwards."
            />
          </div>
        </SidePanel>
      </aside>
    </div>
  );
}

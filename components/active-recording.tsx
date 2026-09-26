"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { Patient } from "@/lib/demo-data";
import { formatDuration } from "@/lib/utils";

/** A patient added on the capture screen: the only two fields the product asks for. */
export type NewPatient = { name: string; dob: string };

/**
 * A consultation being recorded. It lives above the pages, in the workspace
 * layout, so leaving the recording screen does not end it — it carries on in
 * the corner until the doctor comes back to finish it.
 *
 * Time is kept as timestamps, never as a ticking counter in state: nothing
 * here changes while the recording simply runs, so only the readouts that
 * show the time re-render, and nothing else on the page does.
 */
export type LiveRecording = {
  patient: Patient | null;
  /** Set when the patient was added on the capture screen and is not on file yet. */
  added: NewPatient | null;
  phase: "recording" | "paused" | "stopped";
  /** Milliseconds captured before the current run. */
  banked: number;
  /** When the current run began; null while paused or stopped. */
  since: number | null;
  /** Seconds restored from a lost session, if this recording resumed one. */
  recovered: number;
};

/** Whole seconds captured so far. */
export function elapsedSeconds(recording: LiveRecording, now: number) {
  const running = recording.since === null ? 0 : Math.max(0, now - recording.since);
  return Math.floor((recording.banked + running) / 1000);
}

type Controls = {
  recording: LiveRecording | null;
  start: (from: { patient: Patient | null; added: NewPatient | null; recovered?: number }) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  attach: (patient: Patient, added: NewPatient | null) => void;
  /** Ends it: saved, or thrown away. */
  clear: () => void;
};

const RecordingContext = createContext<Controls | null>(null);

export function ActiveRecordingProvider({ children }: { children: ReactNode }) {
  const [recording, setRecording] = useState<LiveRecording | null>(null);

  function halt(phase: "paused" | "stopped") {
    const now = Date.now();
    setRecording((current) =>
      current && current.phase !== "stopped"
        ? {
            ...current,
            phase,
            banked: current.banked + (current.since === null ? 0 : now - current.since),
            since: null,
          }
        : current,
    );
  }

  const controls: Controls = {
    recording,
    start: ({ patient, added, recovered = 0 }) =>
      setRecording({
        patient,
        added,
        phase: "recording",
        banked: recovered * 1000,
        since: Date.now(),
        recovered,
      }),
    pause: () => halt("paused"),
    resume: () => {
      const now = Date.now();
      setRecording((current) =>
        current?.phase === "paused" ? { ...current, phase: "recording", since: now } : current,
      );
    },
    stop: () => halt("stopped"),
    attach: (patient, added) =>
      setRecording((current) => (current ? { ...current, patient, added } : current)),
    clear: () => setRecording(null),
  };

  return <RecordingContext value={controls}>{children}</RecordingContext>;
}

export function useActiveRecording() {
  const controls = use(RecordingContext);
  if (!controls) throw new Error("useActiveRecording needs ActiveRecordingProvider");
  return controls;
}

/**
 * mm:ss for a recording, ticking only while it runs. It is its own component
 * so that the tick re-renders these few characters and nothing around them.
 */
export function Elapsed({ recording, className }: { recording: LiveRecording; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const running = recording.since !== null;

  useEffect(() => {
    if (!running) return;
    // Twice a second, so the display never skips a second when a tick lands late.
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  return <span className={className}>{formatDuration(elapsedSeconds(recording, now))}</span>;
}

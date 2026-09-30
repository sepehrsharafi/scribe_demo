"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { formatDuration } from "@/lib/utils";

/**
 * A visit being recorded. It lives above the pages, in the workspace layout,
 * so leaving the visit does not end it — it carries on in the corner until
 * the doctor comes back to finish it.
 *
 * Time is kept as timestamps, never as a ticking counter in state: nothing
 * here changes while the recording simply runs, so only the readouts that
 * show the time re-render, and nothing else on the page does.
 */
export type LiveRecording = {
  patient: { id: string; name: string };
  phase: "recording" | "paused";
  /** Milliseconds captured before the current run. */
  banked: number;
  /** When the current run began; null while paused. */
  since: number | null;
};

/** Whole seconds captured so far. */
export function elapsedSeconds(recording: LiveRecording, now: number) {
  const running = recording.since === null ? 0 : Math.max(0, now - recording.since);
  return Math.floor((recording.banked + running) / 1000);
}

type Controls = {
  recording: LiveRecording | null;
  /** `recovered` is seconds restored from a session the browser lost. */
  start: (patient: LiveRecording["patient"], recovered?: number) => void;
  pause: () => void;
  resume: () => void;
  /** Ends it: saved, or thrown away. */
  clear: () => void;
};

const RecordingContext = createContext<Controls | null>(null);

/**
 * The microphone, opened for as long as a recording exists. Nothing is kept
 * from it — the demo has no audio pipeline — but a page that is really
 * listening is what lets the browser show the recording indicator on the tab
 * and float the recording in its own window when the doctor switches away.
 * If the microphone is refused or missing, the recording carries on without it.
 */
function useMicrophone(recording: LiveRecording | null) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const exists = recording !== null;
  const listening = recording?.phase === "recording";

  useEffect(() => {
    if (!exists) return;
    let cancelled = false;
    let opened: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((got) => {
        opened = got;
        // Discarded before the browser answered: close it straight away.
        if (cancelled) got.getTracks().forEach((track) => track.stop());
        else setStream(got);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      opened?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [exists]);

  useEffect(() => {
    stream?.getAudioTracks().forEach((track) => (track.enabled = listening));
  }, [stream, listening]);
}

export function ActiveRecordingProvider({ children }: { children: ReactNode }) {
  const [recording, setRecording] = useState<LiveRecording | null>(null);

  useMicrophone(recording);

  const controls: Controls = {
    recording,
    start: (patient, recovered = 0) =>
      setRecording({ patient, phase: "recording", banked: recovered * 1000, since: Date.now() }),
    pause: () => {
      const now = Date.now();
      setRecording((current) =>
        current?.phase === "recording"
          ? {
              ...current,
              phase: "paused",
              banked: current.banked + (current.since === null ? 0 : now - current.since),
              since: null,
            }
          : current,
      );
    },
    resume: () => {
      const now = Date.now();
      setRecording((current) =>
        current?.phase === "paused" ? { ...current, phase: "recording", since: now } : current,
      );
    },
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

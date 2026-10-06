"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { saveRecording } from "@/lib/actions/workspace";
import { formatDuration } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { useVisitExtrasHandover } from "@/components/visit-extras";

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

/** HH:MM, some seconds ago. */
const clockAt = (secondsAgo: number) =>
  new Date(Date.now() - secondsAgo * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

type Controls = {
  recording: LiveRecording | null;
  /** A recording just finished, while it is saved and its visit opens. */
  filed: LiveRecording | null;
  /** The open microphone, for drawing its level; null when refused or missing. */
  microphone: MediaStream | null;
  /** `recovered` is seconds restored from a session the browser lost. */
  start: (patient: LiveRecording["patient"], recovered?: number) => void;
  pause: () => void;
  resume: () => void;
  /** Files it as a visit, with whatever was attached to it, and opens that visit. */
  finish: () => void;
  /** Throws it away, with whatever was attached to it. */
  discard: () => void;
};

const RecordingContext = createContext<Controls | null>(null);

/**
 * The microphone, opened for as long as a recording exists. Nothing is kept
 * from it — the demo has no audio pipeline — but a page that is really
 * listening is what lets the browser show the recording indicator on the tab
 * and float the recording in its own window when the doctor switches away,
 * and its level is what the floating window draws.
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

  return stream;
}

/**
 * The recording, and the only way to change it. Finishing and discarding live
 * here rather than on the visit's page because the floating window does both
 * too, wherever in the app the doctor happens to be.
 */
export function ActiveRecordingProvider({ children }: { children: ReactNode }) {
  const [recording, setRecording] = useState<LiveRecording | null>(null);
  // Finished, and on its way to the server: kept until the app has moved on
  // to the visit, so the screen it was finished on never flashes back to Start.
  const [filed, setFiled] = useState<{ recording: LiveRecording; from: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const handover = useVisitExtrasHandover();
  const { t } = useI18n();
  const microphone = useMicrophone(recording);

  if (filed && filed.from !== pathname) setFiled(null);

  const controls: Controls = {
    recording,
    filed: filed?.recording ?? null,
    microphone,
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
    finish: () => {
      if (!recording) return;
      const now = Date.now();
      const seconds = elapsedSeconds(recording, now);
      const id = `r${now.toString(36)}`;
      setFiled({ recording: { ...recording, phase: "paused", banked: seconds * 1000, since: null }, from: pathname });
      // Cleared at once, so neither the corner card nor the floating window outlives it.
      setRecording(null);
      // Whatever was attached while recording follows the visit to its new address.
      handover.move(`new:${recording.patient.id}`, id);
      // The server answers by redirecting to the visit, and the router goes
      // there by itself; the promise only rejects to say so.
      saveRecording({
        id,
        patientId: recording.patient.id,
        seconds,
        time: clockAt(seconds),
        stoppedAt: now,
      }).catch(() => {});
    },
    discard: () => {
      if (!recording) return;
      setRecording(null);
      handover.clear(`new:${recording.patient.id}`);
      toast(t("Recording discarded"));
      // Thrown away from the visit, there is nothing left on it to look at.
      if (window.location.pathname.startsWith("/new")) router.push("/");
    },
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
  const readout = useRef<HTMLSpanElement>(null);
  const running = recording.since !== null;

  useEffect(() => {
    if (!running) return;
    // The window the readout is drawn in keeps its time. A floating window
    // stays visible while this tab is hidden, and a hidden tab's timers are
    // slowed to as little as once a minute; the floating window's are not.
    const view = readout.current?.ownerDocument.defaultView ?? window;
    // Twice a second, so the display never skips a second when a tick lands late.
    const timer = view.setInterval(() => setNow(Date.now()), 500);
    return () => view.clearInterval(timer);
  }, [running]);

  return (
    <span ref={readout} className={className}>
      {formatDuration(elapsedSeconds(recording, now))}
    </span>
  );
}

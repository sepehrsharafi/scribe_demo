"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiExpandDiagonalLine, RiPauseFill, RiPlayFill } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Elapsed, useActiveRecording } from "@/components/active-recording";
import { useI18n } from "@/components/i18n-provider";

/* Four bars on the sign-in screen's wave, offset so they never move together. */
const bars = ["0s", "-0.4s", "-0.8s", "-0.2s"];

/**
 * The recording, minimised: who it is for, how long it has run, pause, and the
 * way back. It appears whenever a recording is running and the doctor is
 * anywhere but the recording screen.
 *
 * It stays mounted for as long as the recording exists and only its
 * visibility changes, so showing and hiding is one CSS transition of opacity,
 * translate and scale — properties the compositor animates without layout or
 * paint, which keeps it smooth on slow hardware.
 */
export function RecordingDock() {
  const { recording, pause, resume } = useActiveRecording();
  const pathname = usePathname();
  const { t } = useI18n();

  if (!recording) return null;

  const open = !pathname.startsWith("/new");
  const live = recording.phase === "recording";
  const status = {
    recording: t("Recording"),
    paused: t("Paused"),
    stopped: t("Needs a patient"),
  }[recording.phase];

  return (
    <div
      data-recording-dock=""
      data-open={open ? "" : undefined}
      inert={!open}
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 origin-bottom-right transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-auto sm:end-6 sm:bottom-6 sm:w-80 rtl:origin-bottom-left",
        open ? "opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0",
      )}
    >
      <section
        aria-label={t("Recording in progress")}
        className="flex items-center gap-3 rounded-3xl bg-popover p-2.5 ps-3 text-popover-foreground shadow-xl ring-1 ring-foreground/10"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center gap-0.5 rounded-2xl bg-accent"
        >
          {bars.map((delay) => (
            <i
              key={delay}
              className={cn(
                "h-4 w-0.75 origin-center animate-[scribe-wave_1.2s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:animate-none",
                !live && "[animation-play-state:paused] opacity-50",
              )}
              style={{ animationDelay: delay }}
            />
          ))}
        </span>

        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-semibold">
            {recording.patient?.name ?? t("No patient attached yet")}
          </strong>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                live ? "animate-pulse bg-destructive" : recording.phase === "stopped" ? "bg-warning" : "bg-muted-foreground",
              )}
            />
            {status}
            <span aria-hidden="true">·</span>
            <Elapsed recording={recording} className="text-foreground" />
          </span>
        </span>

        {recording.phase !== "stopped" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={live ? pause : resume}
            aria-label={live ? t("Pause") : t("Resume")}
            title={live ? t("Pause") : t("Resume")}
          >
            {live ? <RiPauseFill /> : <RiPlayFill />}
          </Button>
        ) : null}
        <Button
          size="icon"
          render={<Link href="/new" />}
          aria-label={t("Back to the recording")}
          title={t("Back to the recording")}
        >
          <RiExpandDiagonalLine />
        </Button>
      </section>
    </div>
  );
}

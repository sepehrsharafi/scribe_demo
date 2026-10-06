"use client";

import { RiCheckLine, RiErrorWarningLine, RiNotification3Line, RiRefreshLine } from "@remixicon/react";
import { useEffect, useState, type CSSProperties } from "react";
import { processingSteps, type ProcessingStep } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const copy: Record<ProcessingStep, { done: string; live: string; detail: string }> = {
  upload: {
    done: "Audio secured",
    live: "Securing the audio",
    detail: "Sending the recording in encrypted parts. It stays on this device until every part has arrived.",
  },
  transcribe: {
    done: "Conversation transcribed",
    live: "Transcribing the conversation",
    detail: "Separating the voices in the room and timing every turn.",
  },
  note: {
    done: "Note written",
    live: "Writing the note",
    detail: "Structuring what was said. Anything the visit did not cover stays an explicit gap.",
  },
  instructions: {
    done: "Instructions written",
    live: "Writing the patient’s instructions",
    detail: "The same plan, in plain words, for {name} to take home.",
  },
};

/** Seconds after processing starts at which each step ends. */
const ends = processingSteps.reduce<number[]>(
  (list, step) => [...list, (list[list.length - 1] ?? 0) + step.seconds],
  [],
);

/**
 * What happens between Finish and a note, one step at a time: what is done,
 * what is happening now and roughly how far it has got, and what comes next.
 * The page asks the server again when the last step ends, and the note takes
 * this panel's place.
 *
 * The clock starts from the server's `now`, so the first render matches the
 * page it hydrates; after that it moves only at step boundaries, never on a
 * ticking interval. The bar inside the live step is a CSS animation offset by
 * the time already spent, so it fills smoothly without re-rendering.
 */
export function ProcessingSteps({
  since,
  now: serverNow,
  patientName,
  failure,
  onRetry,
  retrying = false,
}: {
  /** When processing began, in epoch ms. Absent for an upload that stopped. */
  since?: number;
  now: number;
  patientName: string;
  failure?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const { t } = useI18n();
  const [now, setNow] = useState(serverNow);

  const elapsed = since ? Math.max(0, (now - since) / 1000) : 0;
  const current = failure ? 0 : ends.findIndex((end) => elapsed < end);
  const finished = !failure && current === -1;
  const live = finished ? processingSteps.length : current;

  useEffect(() => {
    if (!since || failure || finished) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, since + ends[current] * 1000 - Date.now()) + 30,
    );
    return () => window.clearTimeout(timer);
  }, [since, failure, finished, current]);

  const step = processingSteps[Math.min(live, processingSteps.length - 1)];
  const title = failure
    ? t("The upload stopped part-way")
    : finished
      ? t("Opening the note")
      : t(copy[step.id].live);
  const detail = failure
    ? failure
    : finished
      ? t("Everything is written. It will be here in a moment.")
      : t(copy[step.id].detail, { name: patientName });

  return (
    <section aria-live="polite" className="max-w-xl py-2">
      {/* Keyed by the step, so each new heading fades in rather than swapping. */}
      <div key={failure ? "failed" : live} className="animate-in duration-500 fade-in motion-reduce:animate-none">
        <p className={cn("text-xs font-medium text-muted-foreground", failure && "text-destructive")}>
          {failure
            ? t("Needs you")
            : t("Step {step} of {total}", {
                step: Math.min(live + 1, processingSteps.length),
                total: processingSteps.length,
              })}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{title}</h2>
        <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">{detail}</p>
      </div>

      {failure && onRetry ? (
        <Button className="mt-5" onClick={onRetry} disabled={retrying}>
          {retrying ? <Spinner data-icon="inline-start" /> : <RiRefreshLine data-icon="inline-start" />}
          {t("Retry the upload")}
        </Button>
      ) : null}

      <ol className="mt-8">
        {processingSteps.map((item, index) => {
          const state =
            failure && index === 0
              ? "failed"
              : index < live
                ? "done"
                : index === live && !failure
                  ? "live"
                  : "waiting";
          const spent = state === "live" ? Math.max(0, elapsed - (ends[index] - item.seconds)) : 0;

          return (
            <li key={item.id} className="relative flex gap-4 pb-7 last:pb-0">
              {/* The line down to the next step fills once this one is done. */}
              {index < processingSteps.length - 1 ? (
                <span aria-hidden="true" className="absolute start-3 top-8 bottom-1 w-px -translate-x-1/2 bg-border rtl:translate-x-1/2">
                  <span
                    className={cn(
                      "block h-full origin-top bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none",
                      state === "done" ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                </span>
              ) : null}

              <span
                aria-hidden="true"
                className={cn(
                  "relative flex size-6 shrink-0 items-center justify-center rounded-full text-2xs tabular-nums transition-colors duration-500 motion-reduce:transition-none",
                  state === "done" && "bg-primary text-primary-foreground",
                  // Lights once the line down to it has filled.
                  state === "live" && "border-2 border-primary bg-background text-primary delay-500",
                  state === "waiting" && "border bg-background text-muted-foreground",
                  state === "failed" && "bg-destructive text-background",
                )}
              >
                {state === "done" ? (
                  <RiCheckLine className="size-3.5 animate-in duration-300 zoom-in-50 motion-reduce:animate-none" />
                ) : state === "failed" ? (
                  <RiErrorWarningLine className="size-3.5" />
                ) : state === "live" ? (
                  <>
                    <span className="absolute inset-0 animate-[scribe-breathe_2.4s_ease-in-out_0.5s_infinite] rounded-full bg-primary/25 opacity-0 motion-reduce:animate-none" />
                    <span className="size-2 animate-in rounded-full bg-primary delay-500 duration-500 fill-mode-backwards fade-in motion-reduce:animate-none" />
                  </>
                ) : (
                  index + 1
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <span
                  key={state}
                  className={cn(
                    "block animate-in text-sm duration-500 fade-in motion-reduce:animate-none",
                    state === "live" || state === "failed" ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {state === "done" ? t(copy[item.id].done) : t(copy[item.id].live)}
                </span>
                {state === "live" ? (
                  <span className="mt-2.5 block h-1 animate-in overflow-hidden rounded-full bg-primary/10 delay-500 duration-500 fill-mode-backwards fade-in motion-reduce:animate-none">
                    <span
                      key={item.id}
                      className="block h-full animate-[scribe-fill_var(--step)_ease-out_both] rounded-full bg-primary ltr:origin-left rtl:origin-right motion-reduce:animate-none"
                      style={{ "--step": `${item.seconds}s`, animationDelay: `-${spent}s` } as CSSProperties}
                    />
                  </span>
                ) : null}
              </div>

              <span key={state} className="animate-in pt-0.5 text-xs text-muted-foreground duration-500 fade-in motion-reduce:animate-none">
                {state === "done" ? t("Done") : state === "failed" ? t("Stopped") : null}
              </span>
            </li>
          );
        })}
      </ol>

      {failure ? null : (
        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <RiNotification3Line className="size-4 shrink-0" />
          {t("You can leave this visit. Scribe tells you when the note is ready.")}
        </p>
      )}
    </section>
  );
}

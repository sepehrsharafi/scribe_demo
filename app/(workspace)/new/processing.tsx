"use client";

import { RiCheckLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import type { Patient } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/page-layout";
import { useI18n } from "@/components/i18n-provider";

const stages = [
  {
    label: "Recording secured",
    detail: "Audio stored and checksummed on this device.",
    headline: "Securing the recording",
  },
  {
    label: "Uploading audio",
    detail: "Sent in 18 resumable parts.",
    headline: "Uploading the audio",
  },
  {
    label: "Separating speakers",
    detail: "Doctor and patient turns detected.",
    headline: "Separating the speakers",
  },
  {
    label: "Drafting the note",
    detail: "Every statement checked against the transcript.",
    headline: "Drafting the note",
  },
];

/**
 * Honest progress. One figure carries the whole screen, the bar is a hairline
 * under it, and every stage stays visible — done ones quiet, the running one
 * loud. The bar never claims 100% before the draft exists.
 */
export function Processing({
  duration,
  patient,
  onReady,
}: {
  duration: string;
  patient: Patient;
  onReady: () => void;
}) {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);
  const finished = stage >= stages.length;

  useEffect(() => {
    if (finished) {
      onReady();
      return;
    }
    const timer = window.setTimeout(() => setStage(stage + 1), 1500);
    return () => window.clearTimeout(timer);
  }, [stage, finished, onReady]);

  const current = stages[Math.min(stage, stages.length - 1)];
  const progress = Math.round(((stage + 1) / (stages.length + 1)) * 100);

  return (
    <div className="grid gap-8">
      <div className="grid items-end gap-6 border-b pb-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
        <p className="flex items-baseline gap-2">
          <strong className="font-heading text-7xl leading-none font-bold tracking-tighter tabular-nums sm:text-8xl">
            {progress}
          </strong>
          <span className="font-mono text-sm tracking-[0.14em] text-muted-foreground">
            %
          </span>
        </p>

        <div className="min-w-0 pb-2">
          <Eyebrow>
            {t("Stage {current} / {total}", {
              current: String(Math.min(stage + 1, stages.length)).padStart(2, "0"),
              total: String(stages.length).padStart(2, "0"),
            })}
          </Eyebrow>
          <h2 className="mt-2 font-heading text-2xl leading-tight font-bold tracking-tight text-balance">
            {t(current.headline)}
          </h2>
          <p className="mt-2 max-w-prose font-mono text-xs text-muted-foreground tabular-nums">
            {t("{duration} captured · {name}", { duration, name: patient.name })}
          </p>
        </div>
      </div>

      <div
        className="h-0.5 w-full overflow-hidden bg-border"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("Processing progress")}
      >
        <div
          className="h-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="overflow-hidden rounded-2xl border">
        {stages.map((item, index) => {
          const complete = index < stage;
          const running = index === stage;
          return (
            <li
              key={item.label}
              className={cn(
                "flex items-center gap-4 border-b px-5 transition-colors last:border-b-0 sm:px-6",
                running ? "bg-primary/5 py-5" : "py-3",
                complete && "bg-primary/4",
                !complete && !running && "text-muted-foreground/70",
              )}
            >
              <span className="font-mono text-2xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  complete
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : running
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                )}
              >
                {complete ? (
                  <RiCheckLine className="size-3" />
                ) : running ? (
                  <Spinner className="size-3" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <strong
                  className={cn(
                    "block text-sm",
                    running ? "font-semibold" : "font-normal",
                    complete && "text-muted-foreground",
                  )}
                >
                  {t(item.label)}
                </strong>
                {running ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t(item.detail)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
                {complete ? t("Done") : running ? t("Running") : t("Waiting")}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          {t("You can leave this page. The visit keeps going and shows its real state in your worklist the whole time.")}
        </p>
        <Button variant="ghost" size="sm" onClick={onReady}>
          {t("Demo · skip ahead")}
        </Button>
      </div>
    </div>
  );
}

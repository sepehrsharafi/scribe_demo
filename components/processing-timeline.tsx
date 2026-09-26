"use client";

import type { ReactNode } from "react";
import { RiCheckLine, RiErrorWarningLine } from "@remixicon/react";
import type { VisitStatus } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const pipeline = [
  {
    id: "recorded",
    label: "Consultation captured",
    detail: "Audio written in encrypted chunks as it was recorded.",
  },
  {
    id: "uploading",
    label: "Audio uploaded",
    detail: "Sent in resumable parts, retried automatically.",
  },
  {
    id: "transcribing",
    label: "Transcript produced",
    detail: "Doctor and patient turns separated and timed.",
  },
  {
    id: "drafting",
    label: "Note drafted",
    detail: "Structured against the transcript, gaps left explicit.",
  },
  {
    id: "draft-ready",
    label: "Ready for review",
    detail: "Waiting on the doctor to read, correct, and approve.",
  },
  {
    id: "approved",
    label: "Approved and locked",
    detail: "The clinical record. Later changes become addenda.",
  },
];

/** How far down the pipeline a status has got. A failure stops after capture. */
const reached: Record<VisitStatus, number> = {
  uploading: 1,
  transcribing: 2,
  drafting: 3,
  "draft-ready": 4,
  approved: 5,
  failed: 1,
};

type Tone = "done" | "live" | "failed" | "waiting";

function Mark({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-2xs tabular-nums",
        tone === "done" && "border-primary/30 bg-primary/10 text-primary",
        tone === "live" && "border-warning bg-warning text-background",
        tone === "failed" && "border-destructive bg-destructive text-background",
        tone === "waiting" && "border-border bg-background text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Every stage stays on screen. Finished work is quiet and small, the stage that
 * still needs something is loud and carries its action, and what has not
 * started yet is faint. Nothing is hidden behind a disclosure.
 */
export function ProcessingTimeline({
  status,
  failureReason,
  action,
}: {
  status: VisitStatus;
  failureReason?: string;
  action?: ReactNode;
}) {
  const { t, demo } = useI18n();
  const failed = status === "failed";
  const approved = status === "approved";
  const doneCount = failed ? 1 : approved ? pipeline.length : reached[status];
  const liveIndex = approved ? -1 : failed ? 1 : reached[status];

  return (
    <ol className="overflow-hidden rounded-2xl border">
      {pipeline.map((stage, index) => {
        const tone: Tone =
          index < doneCount
            ? "done"
            : index === liveIndex
              ? failed
                ? "failed"
                : "live"
              : "waiting";
        const live = tone === "live" || tone === "failed";

        return (
          <li
            key={stage.id}
            className={cn(
              "flex flex-wrap items-start gap-x-3 gap-y-3 border-b px-4 last:border-b-0 sm:flex-nowrap sm:gap-4 sm:px-5",
              live ? "py-5" : "py-3",
              tone === "done" && "bg-primary/4",
              tone === "live" && "bg-warning/5",
              tone === "failed" && "bg-destructive/5",
              tone === "waiting" && "text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-3 sm:gap-4">
              <span className="font-mono text-2xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Mark tone={tone}>
                {tone === "done" ? (
                  <RiCheckLine className="size-3.5" />
                ) : tone === "failed" ? (
                  <RiErrorWarningLine className="size-3.5" />
                ) : tone === "live" ? (
                  <Spinner className="size-3.5" />
                ) : null}
              </Mark>
            </span>

            <span className="min-w-0 flex-1">
              <strong
                className={cn(
                  "block text-sm",
                  live ? "font-semibold" : "font-normal",
                  tone === "done" && "text-muted-foreground",
                )}
              >
                {failed && tone === "failed" ? t("Processing stopped here") : t(stage.label)}
              </strong>
              {live ? (
                <span className="mt-1 block max-w-prose text-xs leading-relaxed text-muted-foreground">
                  {failed ? failureReason : demo.statusMeta[status].description}
                </span>
              ) : null}
            </span>

            {live && action ? <span className="w-full shrink-0 sm:w-auto">{action}</span> : null}

            {!live ? (
              <span className="shrink-0 self-center font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
                {tone === "done" ? t("Done") : t("Waiting")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

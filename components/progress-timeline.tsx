"use client";

import { useState } from "react";
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiErrorWarningLine,
} from "@remixicon/react";
import { statusMeta, type VisitStatus } from "@/lib/demo-data";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Stage = { id: string; label: string; detail: string };

const pipeline: Stage[] = [
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
    detail: "Waiting on the doctor to read, correct, and sign.",
  },
  {
    id: "signed",
    label: "Signed and locked",
    detail: "The clinical record. Later changes become addenda.",
  },
];

function reachedIndex(status: VisitStatus) {
  switch (status) {
    case "uploading":
      return 1;
    case "transcribing":
      return 2;
    case "drafting":
      return 3;
    case "draft-ready":
      return 4;
    case "signed":
      return 5;
    case "failed":
      return 1;
  }
}

function Mark({
  tone,
  children,
}: {
  tone: "done" | "current" | "failed" | "waiting";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-2xs tabular-nums",
        tone === "done" && "border-primary bg-primary text-primary-foreground",
        tone === "current" && "border-warning bg-warning text-background",
        tone === "failed" && "border-destructive bg-destructive text-background",
        tone === "waiting" && "border-border bg-background text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Finished work is folded away; what is left open is the thing that still needs
 * a decision. A doctor scanning this should see the blocker, not the receipts.
 */
export function ProgressTimeline({
  status,
  failureReason,
  action,
}: {
  status: VisitStatus;
  failureReason?: string;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const failed = status === "failed";
  const signed = status === "signed";
  const reached = reachedIndex(status);
  const meta = statusMeta[status];

  // On a failure, only the capture actually completed.
  const doneCount = failed ? 1 : signed ? pipeline.length : reached;
  const done = pipeline.slice(0, doneCount);
  const currentIndex = failed ? 1 : signed ? -1 : reached;
  const current = currentIndex >= 0 ? pipeline[currentIndex] : undefined;
  const remaining = currentIndex >= 0 ? pipeline.slice(currentIndex + 1) : [];

  return (
    <div className="grid gap-3">
      {done.length ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
              />
            }
          >
            <span className="flex -space-x-1.5">
              {done.map((stage) => (
                <Mark key={stage.id} tone="done">
                  <RiCheckLine className="size-3" />
                </Mark>
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {done.length} of {pipeline.length} stages complete
            </span>
            <span className="hidden font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase sm:inline">
              {open ? "Hide" : "Show"}
            </span>
            <RiArrowDownSLine
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-hidden data-closed:animate-accordion-up data-open:animate-accordion-down">
            <ol className="grid gap-3 px-4 pt-4 pb-1">
              {done.map((stage) => (
                <li key={stage.id} className="flex items-start gap-3">
                  <Mark tone="done">
                    <RiCheckLine className="size-3" />
                  </Mark>
                  <div className="min-w-0">
                    <strong className="text-sm font-medium">{stage.label}</strong>
                    <p className="mt-0.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
                      {stage.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {current ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start",
            failed
              ? "border-destructive/40 bg-destructive/5"
              : "border-warning/40 bg-warning/5",
          )}
        >
          <Mark tone={failed ? "failed" : "current"}>
            {failed ? (
              <RiErrorWarningLine className="size-3" />
            ) : (
              <Spinner className="size-3" />
            )}
          </Mark>
          <div className="min-w-0 flex-1">
            <strong className="text-sm font-semibold">
              {failed ? "Processing stopped here" : current.label}
            </strong>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              {failed ? failureReason : meta.description}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <Mark tone="done">
            <RiCheckLine className="size-3" />
          </Mark>
          <div className="min-w-0">
            <strong className="text-sm font-semibold">Signed and locked</strong>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              {statusMeta.signed.description}
            </p>
          </div>
        </div>
      )}

      {remaining.length ? (
        <ol className="grid gap-2 px-1">
          {remaining.map((stage, index) => (
            <li key={stage.id} className="flex items-center gap-3 text-muted-foreground">
              <Mark tone="waiting">{currentIndex + index + 2}</Mark>
              <span className="text-xs">{stage.label}</span>
              <span className="ml-auto font-mono text-2xs tracking-[0.12em] uppercase">
                Waiting
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export { pipeline as consultationPipeline };

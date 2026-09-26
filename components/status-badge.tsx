"use client";

import type { VisitStatus } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tone: Record<VisitStatus, string> = {
  uploading: "bg-secondary text-secondary-foreground",
  transcribing: "bg-secondary text-secondary-foreground",
  drafting: "bg-secondary text-secondary-foreground",
  "draft-ready": "bg-warning/10 text-warning dark:bg-warning/15",
  approved: "bg-primary/10 text-primary dark:bg-primary/20",
  failed: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

const dot: Record<VisitStatus, string> = {
  uploading: "bg-muted-foreground animate-pulse",
  transcribing: "bg-muted-foreground animate-pulse",
  drafting: "bg-muted-foreground animate-pulse",
  "draft-ready": "bg-warning",
  approved: "bg-primary",
  failed: "bg-destructive",
};

/** A ruled status mark. Colour is a secondary cue; the word carries the meaning. */
export function StatusBadge({
  status,
  className,
}: {
  status: VisitStatus;
  className?: string;
}) {
  const meta = useI18n().demo.statusMeta[status];
  return (
    <Badge
      className={cn("gap-1.5 px-2.5 font-medium whitespace-nowrap", tone[status], className)}
      title={meta.description}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dot[status])}
      />
      {meta.label}
    </Badge>
  );
}

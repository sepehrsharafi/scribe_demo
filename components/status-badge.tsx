"use client";

import type { VisitStatus } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusText } from "@/components/status-text";

const tone: Record<VisitStatus, string> = {
  processing: "bg-secondary text-secondary-foreground",
  ready: "bg-warning/10 text-warning dark:bg-warning/15",
  approved: "bg-primary/10 text-primary dark:bg-primary/20",
  failed: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

const dot: Record<VisitStatus, string> = {
  processing: "bg-muted-foreground animate-pulse",
  ready: "bg-warning",
  approved: "bg-primary",
  failed: "bg-destructive",
};

/** A status mark. Colour is a secondary cue; the word carries the meaning. */
export function StatusBadge({ status, className }: { status: VisitStatus; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge
      className={cn("gap-1.5 px-2.5 font-medium whitespace-nowrap", tone[status], className)}
      title={t(statusText[status].description)}
    >
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dot[status])} />
      {t(statusText[status].label)}
    </Badge>
  );
}

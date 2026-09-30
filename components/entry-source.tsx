"use client";

import Link from "next/link";
import type { SourcedEntry } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

/** Recorded at a visit whose note has not been approved yet. */
export function PendingBadge() {
  const { t } = useI18n();
  return (
    <Badge className="bg-warning/15 px-2 text-warning dark:bg-warning/20" title={t("From a note that is not approved yet")}>
      {t("Pending")}
    </Badge>
  );
}

/** Where a record entry came from: a link to its visit, or the registration record. */
export function EntrySource({ item, className }: { item: SourcedEntry; className?: string }) {
  const { t, f } = useI18n();

  return (
    <span className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      {item.source ? (
        <Link
          href={`/visits/${item.source.id}`}
          className="font-mono tabular-nums underline-offset-4 hover:text-foreground hover:underline"
        >
          {f.date(item.source.day, "short")} · {item.source.reason}
        </Link>
      ) : (
        <span>{t("Registration record")}</span>
      )}
      {item.pending ? <PendingBadge /> : null}
    </span>
  );
}

"use client";

import { RiCake2Line, RiHistoryLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

/**
 * Date of birth in full, then the age in brackets. The date is the
 * identifier — two patients can share a name, rarely a name and a birthday —
 * so it is never shortened; the icon stands in for the word "DOB".
 */
export function BirthDate({ dob, age, className }: { dob: string; age?: number; className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums", className)}
      title={t("Date of birth")}
    >
      <RiCake2Line className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("Date of birth")}</span>
      {dob}
      {age ? <span>({t("{age}y", { age })})</span> : null}
    </span>
  );
}

/** When the patient was last seen, marked by an icon rather than a label. */
export function LastSeen({ when, className }: { when: string; className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums", className)}
      title={t("Last visit")}
    >
      <RiHistoryLine className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("Last visit")}</span>
      {when}
    </span>
  );
}

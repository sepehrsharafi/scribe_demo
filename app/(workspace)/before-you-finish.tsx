"use client";

import Link from "next/link";
import { RiArrowRightLine, RiCloseLine, RiMoonClearLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export type OwedItem = {
  visitId: string;
  patientName: string;
  reason: string;
  when: string;
  /** A draft waiting for approval, or an upload that stopped and needs a retry. */
  action: "approve" | "retry";
};

/**
 * The end-of-day reminder, and the only place Home names work still owed:
 * every note not yet approved and every upload that needs a retry. Dismissing
 * it only hides it for now — the sidebar keeps counting.
 */
export function BeforeYouFinish({ items }: { items: OwedItem[] }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  if (!visible || !items.length) return null;

  const notes = items.filter((item) => item.action === "approve").length;
  const retries = items.length - notes;
  const summary = [
    notes === 1 ? t("1 note to approve") : notes ? t("{count} notes to approve", { count: notes }) : null,
    retries === 1
      ? t("1 upload to retry")
      : retries
        ? t("{count} uploads to retry", { count: retries })
        : null,
  ].filter(Boolean);

  return (
    <section
      aria-labelledby="before-you-finish"
      className="overflow-hidden rounded-2xl border border-warning/40 bg-warning/5 dark:bg-warning/10"
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
        <RiMoonClearLine className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <h2 id="before-you-finish" className="font-heading text-base font-semibold tracking-tight">
            {t("Before you finish today")}
            <span className="font-normal text-warning"> · {summary.join(" · ")}</span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {notes ? t("A note only becomes part of the clinical record once you approve it.") : null}
            {notes && retries ? " " : null}
            {retries
              ? t("A failed upload keeps its audio on this device, so nothing has to be recorded again.")
              : null}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-me-1.5 -mt-1"
          onClick={() => setVisible(false)}
          aria-label={t("Dismiss")}
          title={t("Dismiss")}
        >
          <RiCloseLine />
        </Button>
      </div>

      <ul className="divide-y divide-warning/20 border-t border-warning/20">
        {items.map((item) => {
          const retry = item.action === "retry";
          const label = retry ? t("Retry processing") : t("Review and approve");
          return (
            <li key={item.visitId}>
              {/* Name over reason and time, the action at the end of the row. On
                  a phone the action shrinks to one verb, so the words keep the
                  width. */}
              <Link
                href={`/visits/${item.visitId}`}
                aria-label={`${item.patientName} · ${item.reason} · ${label}`}
                className="group/owed grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-warning/10 sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.patientName}</span>
                  <span className="mt-0.5 flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{item.reason}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0 font-mono tabular-nums">{item.when}</span>
                  </span>
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    retry ? "text-destructive" : "text-warning",
                  )}
                >
                  <span className="sm:hidden">{retry ? t("Retry") : t("Approve")}</span>
                  <span className="hidden sm:inline">{label}</span>
                  <RiArrowRightLine className="size-4 transition-transform group-hover/owed:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/owed:-translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

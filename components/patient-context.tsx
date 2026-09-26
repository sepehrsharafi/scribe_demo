"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RiArrowRightLine } from "@remixicon/react";
import type { SourcedEntry } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/page-layout";
import { ClinicalEmpty, ClinicalGroup, clinicalGrid, sourceCell } from "@/components/clinical-groups";
import { useI18n } from "@/components/i18n-provider";

/** Where an entry came from: a link to its consultation, or the registration record. */
export function EntrySource({ item, className }: { item: SourcedEntry; className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {item.source ? (
        <Link
          href={`/visits/${item.source.id}`}
          className="font-mono tabular-nums underline-offset-4 hover:text-foreground hover:underline"
        >
          {item.source.dateLong} · {item.source.reason}
        </Link>
      ) : (
        <span>{t("Registration record")}</span>
      )}
      {item.pending ? <PendingBadge /> : null}
    </span>
  );
}

/** Recorded at a consultation whose note has not been approved yet. */
export function PendingBadge() {
  const { t } = useI18n();
  return (
    <Badge
      className="bg-warning/15 px-2 text-warning dark:bg-warning/20"
      title={t("From a note that is not approved yet")}
    >
      {t("Pending")}
    </Badge>
  );
}

/** One entry as it stands going into a consultation, with where it came from. */
function ContextEntry({ item, alarm }: { item: SourcedEntry; alarm?: boolean }) {
  return (
    <li className={cn(clinicalGrid(false), "py-3")}>
      <span className={cn("text-sm leading-snug", alarm ? "font-semibold text-destructive" : "font-medium")}>
        {item.entry.text}
      </span>
      <EntrySource item={item} className={sourceCell} />
    </li>
  );
}

/**
 * What the doctor would otherwise open the patient record for, in the same
 * ruled groups as the record itself: allergies (red when there are any),
 * problems, medications, and the last visit in a sentence. Every group keeps a
 * row even when it is empty.
 *
 * It lays out against its own width, so it sits full width above a note and
 * narrow beside a recording. `heading` replaces the "Patient context" label —
 * the recording rail puts the patient there.
 */
export function PatientContext({
  patientId,
  visitId,
  heading,
  className,
}: {
  patientId: string;
  visitId?: string;
  heading?: ReactNode;
  className?: string;
}) {
  const { t, demo } = useI18n();
  const context = demo.getPatientContext(patientId, visitId);
  const groups = [
    { label: "Allergies", items: context.allergies, alarm: context.allergies.length > 0 },
    { label: "Problems", items: context.problems, alarm: false },
    { label: "Medications", items: context.medications, alarm: false },
  ];

  return (
    <section className={cn("@container overflow-hidden rounded-2xl border", className)}>
      <div className="flex items-center justify-between gap-3 border-b bg-accent px-4 py-3 text-accent-foreground">
        {heading ?? <Eyebrow className="text-accent-foreground">{t("Patient context")}</Eyebrow>}
        <Link
          href={`/patients/${patientId}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline hover:underline-offset-4"
        >
          {t("Full record")}
          <RiArrowRightLine className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>

      <div className="divide-y">
        {groups.map((group) => (
          <ClinicalGroup
            key={group.label}
            label={t(group.label)}
            count={group.items.length}
            caption={t("Recorded at")}
            alarm={group.alarm}
          >
            {group.items.length ? (
              group.items.map((item) => (
                <ContextEntry key={item.entry.id} item={item} alarm={group.alarm} />
              ))
            ) : (
              <ClinicalEmpty>{t("None recorded")}</ClinicalEmpty>
            )}
          </ClinicalGroup>
        ))}

        <ClinicalGroup label={t("Last visit")}>
          {context.previous ? (
            <li className={cn(clinicalGrid(false), "py-3")}>
              <Link
                href={`/visits/${context.previous.id}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                {context.previous.reason}
              </Link>
              <span className={cn("mt-1 font-mono text-xs text-muted-foreground tabular-nums", sourceCell)}>
                {context.previous.dateLong}
              </span>
              <p className="col-span-full mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {context.previousSummary ?? demo.statusMeta[context.previous.status].description}
              </p>
            </li>
          ) : (
            <ClinicalEmpty>{t("The first consultation in Scribe.")}</ClinicalEmpty>
          )}
        </ClinicalGroup>
      </div>
    </section>
  );
}

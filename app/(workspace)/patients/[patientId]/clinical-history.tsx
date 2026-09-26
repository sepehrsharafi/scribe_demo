"use client";

import Link from "next/link";
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiMore2Line,
  RiPencilLine,
} from "@remixicon/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClinicalEntry, SourcedEntry, Visit } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SectionHead } from "@/components/page-layout";
import { ClinicalEmpty, ClinicalGroup, clinicalGrid, sourceCell } from "@/components/clinical-groups";
import { EntrySource } from "@/components/patient-context";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";

/** A record entry with where it began and, if it has, where it ended. */
export type HistoryEntry = SourcedEntry & { ended?: Visit };

/** Allergies lead: they are the one thing on the record that can hurt the patient if missed. */
const kinds: { kind: ClinicalEntry["kind"]; label: string }[] = [
  { kind: "allergy", label: "Allergies" },
  { kind: "problem", label: "Problems" },
  { kind: "medication", label: "Medications" },
];

const started: Record<ClinicalEntry["kind"], string> = {
  problem: "Problem",
  medication: "Medication",
  allergy: "Allergy",
};

const stopped: Record<ClinicalEntry["kind"], string> = {
  problem: "Resolved",
  medication: "Stopped",
  allergy: "Removed",
};

/** One entry on the current record, editable in place. */
function EntryRow({
  item,
  alarm,
  onEdit,
  onRemove,
}: {
  item: HistoryEntry;
  alarm: boolean;
  onEdit: (text: string) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);

  if (draft !== null) {
    return (
      <li className="px-4 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) onEdit(draft.trim());
            setDraft(null);
          }}
        >
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={t("Edit entry")}
            className="h-9 rounded-lg"
          />
          <Button type="submit" size="icon-sm" aria-label={t("Save")} title={t("Save")}>
            <RiCheckLine />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className={cn(clinicalGrid(true), "py-3")}>
      <span
        className={cn(
          "pt-1 text-sm leading-snug",
          alarm ? "font-semibold text-destructive" : "font-medium",
        )}
      >
        {item.entry.text}
      </span>
      <EntrySource
        item={item}
        className={cn("col-start-1 row-start-2 @2xl:col-start-2 @2xl:row-start-1", sourceCell)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="col-start-2 row-start-1 @2xl:col-start-3"
              aria-label={t("Options for {entry}", { entry: item.entry.text })}
            />
          }
        >
          <RiMore2Line />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={() => setDraft(item.entry.text)}>
            <RiPencilLine />
            {t("Edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <RiDeleteBinLine />
            {t("Remove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/**
 * The patient's record over time. On top, what stands now — problems,
 * medications, allergies — each traceable to the consultation that recorded
 * it and editable by the doctor. Below, every consultation in order with what
 * it added or ended, so the record reads as a history rather than a list.
 * What a note not yet approved would add is shown dashed, and said once per visit.
 */
export function ClinicalHistory({
  entries: initial,
  visits,
  registered,
}: {
  entries: HistoryEntry[];
  /** Newest first. */
  visits: Visit[];
  registered: string;
}) {
  const { t } = useI18n();
  const [entries, setEntries] = useState(initial);

  function edit(id: string, text: string) {
    setEntries(
      entries.map((item) => (item.entry.id === id ? { ...item, entry: { ...item.entry, text } } : item)),
    );
    toast.success(t("Record updated"));
  }

  function remove(id: string) {
    const before = entries;
    setEntries(entries.filter((item) => item.entry.id !== id));
    toast(t("Removed from the record"), {
      action: { label: t("Undo"), onClick: () => setEntries(before) },
    });
  }

  const current = entries.filter((item) => !item.ended);
  const changesAt = (visitId?: string) => ({
    began: entries.filter((item) => item.source?.id === visitId || (!visitId && !item.source)),
    ended: visitId ? entries.filter((item) => item.ended?.id === visitId) : [],
  });

  return (
    <>
      <section className="space-y-4">
        <SectionHead title={t("Clinical record")} meta={t("Edited here, kept with the patient")} />
        <div className="@container divide-y overflow-hidden rounded-2xl border">
          {kinds.map(({ kind, label }) => {
            const items = current.filter((item) => item.entry.kind === kind);
            const alarm = kind === "allergy" && items.length > 0;
            return (
              <ClinicalGroup
                key={kind}
                label={t(label)}
                count={items.length}
                caption={t("Recorded at")}
                alarm={alarm}
                action
              >
                {items.length ? (
                  items.map((item) => (
                    <EntryRow
                      key={item.entry.id}
                      item={item}
                      alarm={alarm}
                      onEdit={(text) => edit(item.entry.id, text)}
                      onRemove={() => remove(item.entry.id)}
                    />
                  ))
                ) : (
                  <ClinicalEmpty>{t("None recorded")}</ClinicalEmpty>
                )}
              </ClinicalGroup>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHead
          title={t("Consultation history")}
          meta={
            visits.length === 1
              ? t("1 record")
              : t("{count} records", { count: visits.length })
          }
        />

        <ol className="relative ms-2 border-s ps-6">
          {visits.map((visit) => {
            const { began, ended } = changesAt(visit.id);
            const pending = visit.status !== "approved";
            return (
              <li key={visit.id} className="relative pb-8 last:pb-6">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1.5 -start-[calc(1.5rem+0.3125rem)] size-2.5 rounded-full ring-4 ring-background",
                    pending ? "bg-warning" : "bg-primary",
                  )}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <time className="font-mono text-xs text-muted-foreground tabular-nums">
                    {visit.dateLong} · {visit.time}
                  </time>
                  <StatusBadge status={visit.status} />
                </div>
                <Link
                  href={`/visits/${visit.id}`}
                  className="mt-1 inline-block font-medium underline-offset-4 hover:underline"
                >
                  {visit.reason}
                </Link>
                {began.length || ended.length ? (
                  <>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {began.map((item) => (
                        <Change key={item.entry.id} verb={t(started[item.entry.kind])} item={item} pending={pending} />
                      ))}
                      {ended.map((item) => (
                        <Change key={`${item.entry.id}-end`} verb={t(stopped[item.entry.kind])} item={item} pending={pending} quiet />
                      ))}
                    </ul>
                    {/* Said once for the whole visit, not on every change in it. */}
                    {pending ? (
                      <p className="mt-2 text-xs text-warning">
                        {t("Not approved yet — these changes join the record once the note is approved.")}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </li>
            );
          })}

          {changesAt().began.length ? (
            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -start-[calc(1.5rem+0.3125rem)] size-2.5 rounded-full bg-muted-foreground ring-4 ring-background"
              />
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {t("Registered {when}", { when: registered })}
              </span>
              <p className="mt-1 font-medium">{t("Registration record")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {changesAt().began.map((item) => (
                  <Change key={item.entry.id} verb={t(started[item.entry.kind])} item={item} />
                ))}
              </ul>
            </li>
          ) : null}
        </ol>
      </section>
    </>
  );
}

/** One thing a consultation added to or took off the record. A dashed edge means not approved yet. */
function Change({
  verb,
  item,
  pending,
  quiet,
}: {
  verb: string;
  item: HistoryEntry;
  pending?: boolean;
  quiet?: boolean;
}) {
  const allergy = item.entry.kind === "allergy";
  return (
    <li
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-1.5 text-xs",
        allergy && "border-destructive/30 bg-destructive/5 text-destructive",
        pending && "border-dashed",
        quiet && "text-muted-foreground",
      )}
    >
      <span className="font-mono text-2xs tracking-[0.12em] uppercase opacity-80">{verb}</span>
      <span className={cn(quiet ? "line-through decoration-1" : "font-medium")}>{item.entry.text}</span>
    </li>
  );
}

"use client";

import {
  RiAddLine,
  RiArrowGoBackLine,
  RiErrorWarningLine,
  RiLockLine,
  RiSaveLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { useState } from "react";
import {
  noteOrder,
  sectionLabels,
  type NoteSectionId,
} from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MedicationTable } from "@/components/note-medications";
import { openFlags, SectionText } from "@/components/note-text";
import { TriageBlock } from "@/components/note-triage";
import { visibleSections, type Note as NoteState } from "@/components/use-note";
import { useI18n } from "@/components/i18n-provider";

/** What still needs the doctor in one section: phrases to check, rows to confirm. */
function openItems(note: NoteState, id: NoteSectionId) {
  if (note.approved) return 0;
  if (id === "medications") return note.unconfirmed;
  const section = note.note.sections.find((item) => item.id === id);
  return section ? openFlags(section).length : 0;
}

export function jumpTo(id: NoteSectionId) {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** The section jump list that runs down the side of a note. Only the sections it has. */
export function NoteOutline({ note }: { note: NoteState }) {
  const { t } = useI18n();

  return (
    <nav className="grid">
      {visibleSections(note.note).map((id, index) => {
        const open = openItems(note, id);
        const gap = id === "examination" && note.note.sections.find((s) => s.id === id)?.gap;
        return (
          <button
            key={id}
            onClick={() => {
              note.setActive(id);
              jumpTo(id);
            }}
            className={cn(
              "flex items-center gap-2 border-s-2 py-2 ps-3 text-start text-sm transition-colors",
              note.active === id
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-mono text-2xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1">{t(sectionLabels[id])}</span>
            {open ? (
              <span
                title={t("{count} to check", { count: open })}
                aria-label={t("{count} to check", { count: open })}
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-warning/15 px-1.5 font-mono text-2xs font-semibold text-warning tabular-nums"
              >
                {open}
              </span>
            ) : gap ? (
              <span
                title={t("Explicit gap")}
                aria-label={t("Explicit gap")}
                className="size-2 shrink-0 rounded-full bg-warning"
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

/** Editing controls for the note. Approving is the page's action, not this bar's. */
export function NoteToolbar({ note }: { note: NoteState }) {
  const { t } = useI18n();

  if (note.approved) {
    return (
      <Badge className="gap-1.5 bg-primary/10 px-2.5 text-primary dark:bg-primary/20">
        <RiLockLine />
        {t("Approved & locked")}
      </Badge>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full", note.unsaved ? "bg-warning" : "bg-primary")}
        />
        {note.unsaved ? t("Unsaved changes") : t("Saved")}
      </span>

      <span className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={note.undo} disabled={!note.canUndo}>
          <RiArrowGoBackLine data-icon="inline-start" />
          {t("Undo")}
        </Button>
        <Button variant="outline" size="sm" onClick={note.save} disabled={!note.unsaved}>
          <RiSaveLine data-icon="inline-start" />
          {t("Save")}
        </Button>
      </span>
    </div>
  );
}

function Addendum({ onSave }: { onSave: () => void }) {
  const { t } = useI18n();
  const [body, setBody] = useState<string | null>(null);

  if (body === null) {
    return (
      <Button variant="outline" size="sm" onClick={() => setBody("")}>
        <RiAddLine data-icon="inline-start" />
        {t("Add an addendum")}
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="pt-1 font-mono text-2xs text-muted-foreground">+</span>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-semibold tracking-tight">{t("Addendum")}</h3>
        <Textarea
          autoFocus
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-3 max-w-prose"
          placeholder={t("Add a correction or a later observation. The approved note above stays unchanged.")}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {t("Stored separately from the approved record")}
          </span>
          <span className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBody(null)}>
              {t("Cancel")}
            </Button>
            <Button
              size="sm"
              disabled={!body.trim()}
              onClick={() => {
                onSave();
                setBody(null);
              }}
            >
              {t("Save addendum")}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Brings back a section the draft left out because the consultation said nothing for it. */
function AddSection({ note }: { note: NoteState }) {
  const { t } = useI18n();
  const shown = visibleSections(note.note);
  const missing = noteOrder.filter((id) => !shown.includes(id));

  if (!missing.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <RiAddLine data-icon="inline-start" />
        {t("Add a section")}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        {missing.map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => {
              if (id === "medications") note.addMedication();
              else note.addSection(id);
            }}
          >
            {t(sectionLabels[id])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The note itself: one ruled document of numbered sections, editable until it
 * is approved. A section the consultation produced nothing for is not shown —
 * except the examination, which stays as an explicit gap. The transcript it
 * came from is a tab of its own.
 */
export function Note({
  note,
  approvedAt,
  manual,
}: {
  note: NoteState;
  approvedAt?: string;
  manual?: boolean;
}) {
  const { t, demo } = useI18n();
  const locked = note.approved;

  return (
    <div className="min-w-0 space-y-5">
      {locked ? (
        <div className="flex gap-3 rounded-2xl border bg-muted/50 p-4">
          <RiLockLine className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <strong className="text-sm font-semibold">
              {t("Approved by {name}", { name: demo.doctor.name })}
            </strong>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {t("{when} · read-only. Corrections are added as an addendum.", {
                when: approvedAt ?? t("Just now"),
              })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border">
        {visibleSections(note.note).map((id, index) => {
          const label = t(sectionLabels[id]);
          const section = note.note.sections.find((item) => item.id === id);
          return (
            <article
              key={id}
              id={`section-${id}`}
              onClick={() => note.setActive(id)}
              className={cn(
                "grid scroll-mt-32 grid-cols-[1.75rem_minmax(0,1fr)] gap-2 border-b px-4 py-6 transition-colors last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6",
                note.active === id ? "bg-muted/40" : "hover:bg-muted/20",
              )}
            >
              <span className="pt-1 font-mono text-2xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="@container min-w-0">
                <h3 className="font-heading text-base font-semibold tracking-tight">{label}</h3>

                {id === "examination" && note.note.triage ? (
                  <TriageBlock triage={note.note.triage} locked={locked} onChange={note.editTriage} />
                ) : null}

                {id === "medications" ? (
                  <MedicationTable
                    rows={note.note.medications}
                    locked={locked}
                    onEdit={note.editMedication}
                    onConfirm={note.confirmMedication}
                    onRemove={note.removeMedication}
                    onAdd={note.addMedication}
                  />
                ) : section ? (
                  <SectionText
                    section={section}
                    label={label}
                    locked={locked}
                    onChange={(body) => note.editSection(section.id, body)}
                    onCheck={(text) => note.checkPhrase(section.id, text)}
                  />
                ) : null}

                {/* Only an examination can be an explicit gap: it is the one
                    thing a note must never invent. */}
                {id === "examination" && section?.gap ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
                    <RiErrorWarningLine className="size-4" />
                    {manual
                      ? t("Explicit gap — this section was left empty")
                      : t("Explicit gap — nothing was added beyond the transcript")}
                  </span>
                ) : null}

              </div>
            </article>
          );
        })}
      </div>

      {locked ? <Addendum onSave={note.addAddendum} /> : <AddSection note={note} />}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <RiShieldCheckLine className="size-4 shrink-0" />
        {manual
          ? t("Written by hand. There is no recording behind this consultation.")
          : t("Every statement traces back to the consultation transcript, on the tab beside this one.")}
      </p>
    </div>
  );
}

"use client";

import {
  RiAddLine,
  RiArrowGoBackLine,
  RiErrorWarningLine,
  RiLockLine,
  RiSaveLine,
  RiShieldCheckLine,
  RiSparklingLine,
} from "@remixicon/react";
import { useState } from "react";
import type { NoteSectionId } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Revise } from "@/components/note-revise";
import type { Note as NoteState } from "@/components/use-note";
import { useI18n } from "@/components/i18n-provider";

/** The section jump list that runs down the left of a draft. */
export function NoteOutline({ note }: { note: NoteState }) {
  const { t } = useI18n();

  return (
    <nav className="grid">
      {note.note.map((section, index) => (
        <button
          key={section.id}
          onClick={() => note.setActive(section.id)}
          className={cn(
            "flex items-center gap-2 border-s-2 py-2 ps-3 text-start text-sm transition-colors",
            note.active === section.id
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="font-mono text-2xs tabular-nums opacity-60">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 truncate">{section.label}</span>
          {section.gap ? (
            <span
              title={t("Explicit gap")}
              aria-label={t("Explicit gap")}
              className="size-1.5 shrink-0 rounded-full bg-warning"
            />
          ) : null}
        </button>
      ))}
    </nav>
  );
}

/** Editing controls for the note. Signing is the page's action, not this bar's. */
export function NoteToolbar({ note }: { note: NoteState }) {
  const { t } = useI18n();

  if (note.signed) {
    return (
      <Badge className="gap-1.5 bg-primary/10 px-2 text-primary dark:bg-primary/20">
        <RiLockLine className="size-3" />
        {t("Signed & locked")}
      </Badge>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            note.unsaved ? "bg-warning" : "bg-primary",
          )}
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
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="pt-1 font-mono text-2xs text-muted-foreground">+</span>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-semibold tracking-tight">{t("Addendum")}</h3>
        <Textarea
          autoFocus
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-3 max-w-prose"
          placeholder={t("Add a correction or a later observation. The signed note above stays unchanged.")}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {t("Stored separately from the signed record")}
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

/**
 * The note itself: one ruled document of numbered sections, editable until it
 * is signed. The transcript it came from is a tab of its own — it is not
 * repeated beside every section.
 *
 * A note written by hand has no transcript, so there is nothing for the model
 * to stay faithful to and "Ask Scribe" is not offered on it.
 */
export function Note({
  note,
  signedAt,
  manual,
}: {
  note: NoteState;
  signedAt?: string;
  manual?: boolean;
}) {
  const { t, demo } = useI18n();
  const [revising, setRevising] = useState<NoteSectionId | null>(null);

  return (
    <div className="min-w-0 space-y-5">
      {note.signed ? (
        <div className="flex gap-3 rounded-2xl border bg-muted/50 p-4">
          <RiLockLine className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <strong className="text-sm font-semibold">
              {t("Signed by {name}", { name: demo.doctor.name })}
            </strong>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {t("{when} · read-only. Corrections are added as an addendum.", {
                when: signedAt ?? t("Just now"),
              })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border">
        {note.note.map((section, index) => (
          <article
            key={section.id}
            onClick={() => note.setActive(section.id)}
            className={cn(
              "grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 border-b px-4 py-6 transition-colors last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6",
              note.active === section.id ? "bg-muted/40" : "hover:bg-muted/20",
            )}
          >
            <span className="pt-1 font-mono text-2xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {section.label}
                </h3>
                {!note.signed && !manual ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      note.setActive(section.id);
                      setRevising(revising === section.id ? null : section.id);
                    }}
                  >
                    <RiSparklingLine data-icon="inline-start" />
                    {t("Ask Scribe")}
                  </Button>
                ) : null}
              </div>

              {/* The shadcn textarea is field-sizing-content, so the box grows
                  with the note and nothing has to measure heights by hand. */}
              <div className="mt-2 max-w-prose">
                <Textarea
                  aria-label={section.label}
                  value={section.body}
                  readOnly={note.signed}
                  rows={1}
                  onChange={(event) => note.edit(section.id, event.target.value)}
                  className={cn(
                    "min-h-0 bg-transparent px-0 py-0 text-base leading-relaxed focus-visible:ring-0",
                    note.signed && "cursor-default",
                  )}
                />
              </div>

              {section.gap ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-2 py-1 text-2xs text-warning">
                  <RiErrorWarningLine className="size-3" />
                  {manual
                    ? t("Explicit gap — this section was left empty")
                    : t("Explicit gap — nothing was added beyond the transcript")}
                </span>
              ) : null}

              {!note.signed && revising === section.id ? (
                <Revise
                  section={section}
                  onClose={() => setRevising(null)}
                  onAccept={(body) => note.revise(section.id, body)}
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {note.signed ? <Addendum onSave={note.addAddendum} /> : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <RiShieldCheckLine className="size-3.5" />
        {manual
          ? t("Written by hand. There is no recording behind this consultation.")
          : t("Every statement traces back to the consultation transcript, on the tab beside this one.")}
      </p>
    </div>
  );
}

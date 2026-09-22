"use client";

import { RiArrowRightLine, RiInformationLine } from "@remixicon/react";
import { useState } from "react";
import type { NoteSection, NoteSectionId, Patient } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow } from "@/components/page-layout";
import { PatientAvatar } from "@/components/patient-avatar";
import { useI18n } from "@/components/i18n-provider";

/** The same five sections a recorded consultation produces, left empty. */
const blank: { id: NoteSectionId; label: string; placeholder: string }[] = [
  {
    id: "reason",
    label: "Reason for visit",
    placeholder: "Why the patient came, in a sentence.",
  },
  {
    id: "history",
    label: "History",
    placeholder: "What they described: onset, course, relevant negatives.",
  },
  {
    id: "examination",
    label: "Examination findings",
    placeholder: "What you examined and found. Leave empty if nothing was examined.",
  },
  {
    id: "assessment",
    label: "Assessment",
    placeholder: "Your clinical impression.",
  },
  {
    id: "plan",
    label: "Plan",
    placeholder: "Treatment, safety-netting, follow-up.",
  },
];

/**
 * Writing a consultation up by hand — a phone call, a home visit, anything
 * that could not be recorded. Same five sections, no audio, no draft, so
 * nothing on this screen pretends a model was involved.
 */
export function WriteUp({
  patient,
  onSave,
  onBack,
}: {
  patient: Patient;
  onSave: (reason: string, note: NoteSection[]) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [bodies, setBodies] = useState<Record<string, string>>({});

  const written = blank.filter((section) => bodies[section.id]?.trim()).length;
  const ready = Boolean(reason.trim() && written);

  function save() {
    if (!ready) return;
    onSave(
      reason.trim(),
      blank.map((section) => ({
        id: section.id,
        label: t(section.label),
        body: bodies[section.id]?.trim() || t("Not recorded during this consultation."),
        gap: !bodies[section.id]?.trim(),
      })),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0 space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="reason">{t("Reason for the consultation")}</Label>
          <Input
            id="reason"
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("e.g. Telephone review — blood results")}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border">
          {blank.map((section, index) => (
            <div
              key={section.id}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 border-b px-4 py-6 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6"
            >
              <span className="pt-1 font-mono text-2xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {t(section.label)}
                </h3>
                <div className="mt-2 max-w-prose">
                  <Textarea
                    aria-label={t(section.label)}
                    rows={1}
                    value={bodies[section.id] ?? ""}
                    placeholder={t(section.placeholder)}
                    onChange={(event) =>
                      setBodies({ ...bodies, [section.id]: event.target.value })
                    }
                    className="min-h-0 bg-transparent px-0 py-0 text-base leading-relaxed focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("{written} of {total} sections written", { written, total: blank.length })}
          </span>
          <span className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              {t("Back")}
            </Button>
            <Button disabled={!ready} onClick={save}>
              {t("Save consultation")}
              <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
            </Button>
          </span>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border p-4">
          <Eyebrow>{t("Patient")}</Eyebrow>
          <div className="mt-3 flex items-center gap-3">
            <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold">
                {patient.name}
              </strong>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {t("DOB {dob}", { dob: patient.dob })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 rounded-2xl border border-dashed p-4">
          <RiInformationLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("Nothing is recorded or transcribed here, and no draft is generated. A section you leave empty is filed as an explicit gap, exactly as it would be after a recorded visit.")}
          </p>
        </div>
      </aside>
    </div>
  );
}

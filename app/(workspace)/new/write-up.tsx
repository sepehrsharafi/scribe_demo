"use client";

import { RiArrowRightLine, RiInformationLine } from "@remixicon/react";
import { useState } from "react";
import {
  noteOrder,
  sectionLabels,
  type Medication,
  type Note,
  type NoteSection,
  type Patient,
  type TextSectionId,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MedicationTable } from "@/components/note-medications";
import { useI18n } from "@/components/i18n-provider";
import { AttachedPatient } from "./pick-patient";

const placeholders: Record<TextSectionId, string> = {
  reason: "Why the patient came, in a sentence.",
  history: "What they described: onset, course, relevant negatives.",
  examination: "What you examined and found. Leave empty if nothing was examined.",
  assessment: "Your clinical impression.",
  tests: "Investigations requested and referrals made.",
  advice: "Safety-netting and when to come back.",
};

/**
 * Writing a consultation up by hand — a phone call, a home visit, anything
 * that could not be recorded. The same sections a recorded consultation
 * produces, no audio, no draft, so nothing on this screen pretends a model was
 * involved. Like a recording, it cannot be saved until it has a patient.
 */
export function WriteUp({
  patient,
  onChoosePatient,
  onSave,
  onBack,
}: {
  patient: Patient | null;
  onChoosePatient: () => void;
  onSave: (reason: string, note: Note) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [bodies, setBodies] = useState<Partial<Record<TextSectionId, string>>>({});
  const [medications, setMedications] = useState<Medication[]>([]);

  const textSections = noteOrder.filter((id): id is TextSectionId => id !== "medications");
  const listed = medications.filter((row) => row.drug.trim());
  const written =
    textSections.filter((id) => bodies[id]?.trim()).length + (listed.length ? 1 : 0);
  const ready = Boolean(reason.trim() && written && patient);

  function save() {
    if (!ready) return;
    const sections: NoteSection[] = textSections.flatMap((id) => {
      const body = bodies[id]?.trim();
      if (body) return [{ id, body }];
      // An examination nobody did is the one section that stays, as a gap.
      if (id === "examination") {
        return [{ id, body: t("Not recorded during this consultation."), gap: true }];
      }
      return [];
    });
    onSave(reason.trim(), { sections, medications: listed });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
          {noteOrder.map((id, index) => (
            <div
              key={id}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 border-b px-4 py-6 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6"
            >
              <span className="pt-1 font-mono text-2xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="@container min-w-0">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {t(sectionLabels[id])}
                </h3>
                {id === "medications" ? (
                  <MedicationTable
                    rows={medications}
                    locked={false}
                    onEdit={(rowId, fields) =>
                      setMedications(
                        medications.map((row) => (row.id === rowId ? { ...row, ...fields } : row)),
                      )
                    }
                    onConfirm={() => undefined}
                    onRemove={(rowId) =>
                      setMedications(medications.filter((row) => row.id !== rowId))
                    }
                    onAdd={() => {
                      const rowId = `written-${Date.now()}`;
                      setMedications([
                        ...medications,
                        { id: rowId, drug: "", dose: "", frequency: "", duration: "" },
                      ]);
                      return rowId;
                    }}
                  />
                ) : (
                  <div className="mt-2 max-w-prose">
                    <Textarea
                      aria-label={t(sectionLabels[id])}
                      rows={1}
                      value={bodies[id] ?? ""}
                      placeholder={t(placeholders[id])}
                      onChange={(event) => setBodies({ ...bodies, [id]: event.target.value })}
                      className="min-h-0 bg-transparent px-0 py-0 text-base leading-relaxed focus-visible:ring-0 dark:bg-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {t("{written} of {total} sections written", { written, total: noteOrder.length })}
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
        <AttachedPatient patient={patient} onChoose={onChoosePatient} required={!patient && written > 0} />

        <div className="flex gap-3 rounded-2xl border border-dashed p-4">
          <RiInformationLine className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("Nothing is recorded or transcribed here, and no draft is generated. Sections you leave empty are left out of the note — except the examination, which is filed as an explicit gap, exactly as it would be after a recorded visit.")}
          </p>
        </div>
      </aside>
    </div>
  );
}

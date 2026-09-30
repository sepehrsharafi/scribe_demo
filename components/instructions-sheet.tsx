"use client";

import type { WriteUp } from "@/components/use-write-up";
import { NoteMedicationsContext } from "@/components/write-up-extensions";
import { WriteUpDocument } from "@/components/write-up-editor";
import { useI18n } from "@/components/i18n-provider";

/**
 * What the patient takes home: the same plan as the note, as a short letter
 * in plain words and the second person. Every word of it is the doctor's to
 * change. The medicines are not typed twice — they are read from the note's
 * table as it stands, so a correction there is a correction here.
 */
export function InstructionsSheet({
  writeUp,
  patientName,
  date,
}: {
  writeUp: WriteUp;
  patientName: string;
  date: string;
}) {
  const { t } = useI18n();

  return (
    <div className="min-w-0">
      <p className="mb-6 flex flex-wrap items-center gap-x-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
        <span>{t("For {name}", { name: patientName })}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{date}</span>
      </p>
      <NoteMedicationsContext value={writeUp.facts.medications}>
        <WriteUpDocument editor={writeUp.handout} />
      </NoteMedicationsContext>
    </div>
  );
}

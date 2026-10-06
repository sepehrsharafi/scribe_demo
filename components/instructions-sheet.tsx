"use client";

import type { WriteUp } from "@/components/use-write-up";
import { EmailInstructions, type InstructionsEmail } from "@/components/email-instructions";
import { NoteMedicationsContext } from "@/components/write-up-extensions";
import { WriteUpDocument } from "@/components/write-up-editor";
import { useI18n } from "@/components/i18n-provider";

/**
 * What the patient takes home: the same plan as the note, as a short letter
 * in plain words and the second person. Every word of it is the doctor's to
 * change. The medicines are not typed twice — they are read from the note's
 * table as it stands, so a correction there is a correction here.
 *
 * A filed visit can email the letter to the patient once it is approved. A
 * visit written by hand on this device has nowhere to file a send, so it
 * offers none.
 */
export function InstructionsSheet({
  writeUp,
  patientName,
  date,
  email,
}: {
  writeUp: WriteUp;
  patientName: string;
  date: string;
  email?: InstructionsEmail;
}) {
  const { t } = useI18n();
  const heading = (
    <p className="tabular-nums">
      {t("For {name}", { name: patientName })} • {date}
    </p>
  );

  return (
    <div className="min-w-0">
      {email ? (
        <EmailInstructions email={email} writeUp={writeUp} date={date}>
          {heading}
        </EmailInstructions>
      ) : (
        <div className="mb-4 text-xs text-muted-foreground">{heading}</div>
      )}
      <NoteMedicationsContext value={writeUp.facts.medications}>
        <WriteUpDocument editor={writeUp.handout} />
      </NoteMedicationsContext>
    </div>
  );
}

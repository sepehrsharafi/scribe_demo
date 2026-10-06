import { RiAlarmWarningLine } from "@remixicon/react";
import { getI18n } from "@/lib/i18n/server";

/**
 * The patient's allergies, red, as chips that ride beside their name — the
 * one thing on the record that can hurt the patient if nobody sees it. "None
 * recorded" is said out loud, since silence would read as "none".
 */
export async function Allergies({ patientId, visitId }: { patientId: string; visitId?: string }) {
  const { t, demo } = await getI18n();
  const { allergies } = demo.getPatientContext(patientId, visitId);

  return (
    <span className="flex flex-wrap gap-1.5">
      {allergies.length ? (
        allergies.map(({ entry }) => (
          <span
            key={entry.id}
            className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-2xs font-medium text-destructive dark:bg-destructive/20"
          >
            <RiAlarmWarningLine className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">{t("Allergy")}:</span>
            {entry.text}
          </span>
        ))
      ) : (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground">
          {t("No allergies recorded")}
        </span>
      )}
    </span>
  );
}

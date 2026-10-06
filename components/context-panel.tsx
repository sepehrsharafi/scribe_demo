import { getI18n } from "@/lib/i18n/server";
import { PatientContext } from "@/components/patient-context";
import { VisitFiles } from "@/components/visit-files";

/**
 * The Context tab: what is worth knowing before going in, and beside it the
 * files the practice or the doctor attached to the visit. Before a recording
 * starts, this is the tab a visit opens on.
 */
export async function ContextPanel({
  patientId,
  visitId,
  day,
  extrasKey,
}: {
  patientId: string;
  /** Absent while the visit is being started. */
  visitId?: string;
  /** yyyy-mm-dd of the visit. */
  day: string;
  /** Where this visit's added files are kept for the session. */
  extrasKey: string;
}) {
  const { t, demo } = await getI18n();
  const seed = visitId ? demo.getContext(visitId) : {};

  return (
    <PatientContext
      patientId={patientId}
      visitId={visitId}
      planDay={day}
      aside={
        <section aria-labelledby="visit-files" className="grid content-start gap-3">
          <h3 id="visit-files" className="text-base font-semibold">
            {t("Files")}
          </h3>
          <VisitFiles extrasKey={extrasKey} seed={seed.files ?? []} />
        </section>
      }
    />
  );
}

import { getI18n } from "@/lib/i18n/server";
import { Page, PageHead } from "@/components/page-layout";
import { NewVisitButton } from "@/components/new-visit-dialog";
import { PatientList, type PatientRow } from "./patient-list";

export default async function Patients() {
  const { t, f, demo } = await getI18n();

  const rows: PatientRow[] = demo.patients.map((patient) => {
    const history = demo.getVisitsForPatient(patient.id);
    const last = history[0];
    return {
      id: patient.id,
      name: patient.name,
      initials: f.initials(patient.name),
      age: f.age(patient.born),
      visits: history.length,
      last: last ? { day: f.day(last.day), reason: last.reason || t("New visit") } : undefined,
    };
  });

  return (
    <Page className="space-y-8">
      <PageHead
        title={t("Patients")}
        description={t("Only what is needed to group visits: a name and a date of birth.")}
        actions={<NewVisitButton />}
      />
      <PatientList rows={rows} />
    </Page>
  );
}

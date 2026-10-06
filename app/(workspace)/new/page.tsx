import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { patientOptions } from "@/lib/patient-options";
import { ContextPanel } from "@/components/context-panel";
import { Page, PageHead } from "@/components/page-layout";
import { PatientPicker } from "@/components/patient-picker";
import { VisitIdentity } from "@/components/visit-identity";
import { ChangePatientButton } from "@/components/new-visit-dialog";
import { NewVisit } from "./new-visit";

/**
 * A visit being started. With a patient it is the visit page itself, ready
 * to record; without one, the only question is who it is with.
 */
export default async function NewVisitPage({ searchParams }: PageProps<"/new">) {
  const { patient: asked, resume } = await searchParams;
  const { t, f, demo } = await getI18n();
  const patient = demo.getPatient(resume ? demo.recovery.patientId : Array.isArray(asked) ? asked[0] : asked);

  if (!patient) {
    return (
      <Page className="max-w-3xl space-y-8 py-12">
        <PageHead title={t("Who is this visit with?")} description={t("Pick a patient, and the visit opens ready to record.")} />
        <PatientPicker patients={patientOptions(demo, f)} lead />
      </Page>
    );
  }

  // /new → /new with someone else is the same route: the key starts the visit afresh.
  return (
    <NewVisit
      key={`${patient.id}|${resume ? "resume" : ""}`}
      patient={{ id: patient.id, name: patient.name, firstName: patient.name.split(" ")[0] }}
      recovered={resume ? demo.recovery.seconds : 0}
      identity={<VisitIdentity patientId={patient.id} action={resume ? null : <ChangePatientButton />} />}
      context={<ContextPanel patientId={patient.id} day={demoToday} extrasKey={`new:${patient.id}`} />}
    />
  );
}

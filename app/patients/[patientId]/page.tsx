import { AppShell } from "@/components/app-shell";
import { PatientProfile } from "@/components/patient-profile";
import { patients } from "@/lib/demo-data";

export function generateStaticParams() {
  return patients.map((patient) => ({ patientId: patient.id }));
}

export default async function Page({ params }: PageProps<"/patients/[patientId]">) {
  const { patientId } = await params;
  return (
    <AppShell active="Patients">
      <PatientProfile patientId={patientId} />
    </AppShell>
  );
}

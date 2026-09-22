import { AppShell } from "@/components/app-shell";
import {
  ConsultationNotFound,
  ConsultationView,
} from "@/components/consultation-view";
import {
  getNote,
  getPatientForVisit,
  getTranscript,
  getVersions,
  getVisit,
  signedAt,
  visits,
} from "@/lib/demo-data";

export function generateStaticParams() {
  return visits.map((visit) => ({ visitId: visit.id }));
}

export default async function Page({ params }: PageProps<"/visits/[visitId]">) {
  const { visitId } = await params;
  const visit = getVisit(visitId);
  const patient = getPatientForVisit(visitId);

  if (!visit || !patient) {
    return (
      <AppShell active="Visits">
        <ConsultationNotFound />
      </AppShell>
    );
  }

  const note = getNote(visitId);

  return (
    <AppShell active="Visits">
      <ConsultationView
        data={{
          visitId,
          patient,
          reason: visit.reason,
          dateLong: visit.dateLong,
          time: visit.time,
          duration: visit.duration,
          status: visit.status,
          failureReason: visit.failureReason,
          note,
          transcript: getTranscript(visitId),
          versions: note ? getVersions(visitId) : [],
          signedAt: signedAt[visitId],
        }}
      />
    </AppShell>
  );
}

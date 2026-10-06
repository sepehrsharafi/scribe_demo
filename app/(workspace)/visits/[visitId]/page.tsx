import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { formatDuration } from "@/lib/utils";
import { ContextPanel } from "@/components/context-panel";
import { Transcript } from "@/components/transcript";
import { VisitIdentity } from "@/components/visit-identity";
import { VisitWorkspace } from "@/components/visit-workspace";

/**
 * A filed visit. Everything that can be is rendered here, on the server —
 * who it was with, the record going in, the transcript — and handed to the
 * one client part that has to hold state: the note being reviewed.
 */
export default async function VisitPage({ params }: PageProps<"/visits/[visitId]">) {
  const { visitId } = await params;
  const { f, demo, now } = await getI18n();
  const visit = demo.getVisit(visitId);
  const patient = demo.getPatient(visit?.patientId);

  if (!visit || !patient) notFound();

  const note = demo.getNote(visitId);

  return (
    <VisitWorkspace
      visit={{
        id: visit.id,
        status: visit.status,
        since: visit.since,
        failure: visit.failure,
        approvedAt: visit.approvedAt,
        emailed: visit.emailed,
        recorded: visit.seconds > 0,
        patientId: patient.id,
        patientName: patient.name,
        firstName: patient.name.split(" ")[0],
        patientEmail: patient.email,
        date: f.date(visit.day),
        seededFiles: demo.getContext(visitId).files?.length ?? 0,
      }}
      note={note}
      now={now}
      doctor={demo.doctor.name}
      identity={<VisitIdentity patientId={patient.id} visit={visit} />}
      context={
        <ContextPanel
          patientId={patient.id}
          visitId={visit.id}
          day={visit.day}
          extrasKey={visit.id}
        />
      }
      transcript={
        note ? <Transcript lines={demo.getTranscript(visitId)} length={formatDuration(visit.seconds)} /> : null
      }
    />
  );
}

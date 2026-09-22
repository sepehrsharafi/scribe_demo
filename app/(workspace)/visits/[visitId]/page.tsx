import { notFound } from "next/navigation";
import { demo as english } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { Consultation } from "@/components/consultation";

export function generateStaticParams() {
  return english("en").visits.map((visit) => ({ visitId: visit.id }));
}

export default async function Page({ params }: PageProps<"/visits/[visitId]">) {
  const { visitId } = await params;
  const { demo } = await getI18n();
  const { getNote, getPatientForVisit, getTranscript, getVersions, getVisit, signedAt } = demo;
  const visit = getVisit(visitId);
  const patient = getPatientForVisit(visitId);

  if (!visit || !patient) notFound();

  const note = getNote(visitId);

  return (
    <Consultation
      data={{
        patient,
        reason: visit.reason,
        dateLong: visit.dateLong,
        time: visit.time,
        duration: visit.manual ? undefined : visit.duration,
        manual: visit.manual,
        status: visit.status,
        failureReason: visit.failureReason,
        note,
        transcript: getTranscript(visitId),
        versions: note ? getVersions(visitId) : [],
        signedAt: signedAt[visitId],
      }}
    />
  );
}

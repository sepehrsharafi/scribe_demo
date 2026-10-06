import Link from "next/link";
import { RiMicLine, RiQuillPenLine } from "@remixicon/react";
import { Fragment, type ReactNode } from "react";
import { visitTypeLabels, visitTypes, type Visit } from "@/lib/demo-data";
import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatDuration } from "@/lib/utils";
import { Allergies } from "@/components/allergies";
import { BirthDate } from "@/components/patient-facts";
import { VisitTypeMenu } from "@/components/visit-type-menu";

function Fact({ icon: Icon, children }: { icon: typeof RiMicLine; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * Who the visit is with and when it was, said once at the top of every tab,
 * with their allergies beside the name.
 */
export async function VisitIdentity({
  patientId,
  visit,
  action,
}: {
  patientId: string;
  /** Absent while the visit is still being started. */
  visit?: Visit;
  /** A control beside the name, such as changing the patient before recording. */
  action?: ReactNode;
}) {
  const { t, f, demo } = await getI18n();
  const patient = demo.getPatient(patientId);
  if (!patient) return null;

  // Once the note is written the doctor can change the type. Before that only
  // a first visit can be told, so that is all it says.
  const type = visit
    ? demo.getVisitType(visit)
    : demo.getVisitsForPatient(patient.id).length
      ? undefined
      : "first";
  const kind =
    visit && demo.getNote(visit.id) && type ? (
      <VisitTypeMenu
        visitId={visit.id}
        value={type}
        options={visitTypes.map((value) => ({ value, label: t(visitTypeLabels[value]) }))}
      />
    ) : type === "first" ? (
      t(visitTypeLabels.first)
    ) : null;

  const facts = [
    kind && visit?.reason ? (
      <span className="inline-flex items-center gap-1.5">
        {kind}
        <span aria-hidden="true">·</span>
        {visit.reason}
      </span>
    ) : (
      (kind ?? visit?.reason)
    ),
    visit ? `${f.day(visit.day)} ${visit.time}` : f.day(demoToday),
    visit &&
      (visit.seconds ? (
        <Fact icon={RiMicLine}>
          {formatDuration(visit.seconds)}
        </Fact>
      ) : (
        <Fact icon={RiQuillPenLine}>
          {t("Written by hand")}
        </Fact>
      )),
    <BirthDate key="born" dob={f.date(patient.born)} age={f.age(patient.born)} />,
  ].filter(Boolean);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Link
            href={`/patients/${patient.id}`}
            className="underline-offset-4 hover:underline"
            title={t("Open the patient record")}
          >
            {patient.name}
          </Link>
        </h1>
        {action}
        <Allergies patientId={patient.id} visitId={visit?.id} />
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
        {facts.map((fact, index) => (
          <Fragment key={index}>
            {index ? <span aria-hidden="true">•</span> : null}
            {fact}
          </Fragment>
        ))}
      </p>
    </div>
  );
}

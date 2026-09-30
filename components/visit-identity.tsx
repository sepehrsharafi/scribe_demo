import Link from "next/link";
import type { ReactNode } from "react";
import {
  RiCalendarLine,
  RiMicLine,
  RiQuillPenLine,
} from "@remixicon/react";
import type { Visit } from "@/lib/demo-data";
import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatDuration } from "@/lib/utils";
import { Allergies } from "@/components/allergies";
import { BirthDate } from "@/components/patient-facts";

function Fact({ icon: Icon, children }: { icon: typeof RiMicLine; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
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

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">
          <Link
            href={`/patients/${patient.id}`}
            className="underline-offset-[6px] decoration-2 hover:underline"
            title={t("Open the patient record")}
          >
            {patient.name}
          </Link>
        </h1>
        {action}
        <Allergies patientId={patient.id} visitId={visit?.id} />
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {visit?.reason ? <span className="text-sm font-medium">{visit.reason}</span> : null}
        <Fact icon={RiCalendarLine}>
          {visit ? `${f.day(visit.day)} · ${visit.time}` : f.day(demoToday)}
        </Fact>
        {visit ? (
          visit.seconds ? (
            <Fact icon={RiMicLine}>{formatDuration(visit.seconds)}</Fact>
          ) : (
            <Fact icon={RiQuillPenLine}>{t("Written by hand")}</Fact>
          )
        ) : null}
        <BirthDate dob={f.date(patient.born)} age={f.age(patient.born)} />
      </p>
    </div>
  );
}

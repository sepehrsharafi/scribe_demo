"use client";

import { Fragment } from "react";
import type { Visit } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import {
  Cell,
  RecordHead,
  RecordList,
  RecordRow,
  RowChevron,
  RowIndex,
} from "@/components/record-list";
import { PatientAvatar } from "@/components/patient-avatar";
import { StatusBadge } from "@/components/status-badge";

/* Index · avatar · patient · consultation · status · time. One template for
   the head row and every body row, so a fixed track owns the status column
   instead of the longest status word pushing the others around. On a phone a
   row is two lines: patient over consultation, status over time. */
const columns =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[2rem_2rem_minmax(0,1fr)_minmax(0,1.2fr)_9.5rem_4rem_1rem]";

/** Visits gathered by the day they happened, latest first within each day. */
function byDay(visits: Visit[]) {
  const days = new Map<string, Visit[]>();
  for (const visit of visits) {
    days.set(visit.dateLong, [...(days.get(visit.dateLong) ?? []), visit]);
  }
  return [...days.values()].map((day) =>
    [...day].sort((a, b) => b.time.localeCompare(a.time)),
  );
}

/** "Today · 22 Sep 2026", or just the date when it has no nearer name. */
function dayLabel(visit: Visit) {
  return visit.date === visit.dateLong ? visit.dateLong : `${visit.date} · ${visit.dateLong}`;
}

/**
 * The worklist. Home and Visits render the same rows, so a row means the same
 * thing in both places. The status badge is the row's only statement of where
 * the visit has got to.
 */
export function VisitRows({
  visits,
  groupByDay = false,
}: {
  visits: Visit[];
  /** Head each day with its date. The rows then no longer need to say it. */
  groupByDay?: boolean;
}) {
  const { t, demo } = useI18n();
  const days = groupByDay ? byDay(visits) : [visits];
  const order = days.flat();

  return (
    <RecordList>
      <RecordHead className={columns}>
        <span className="hidden sm:block">#</span>
        <span className="sm:col-span-2">{t("Patient")}</span>
        <span className="hidden sm:block">{t("Consultation")}</span>
        <span className="hidden sm:block">{t("Status")}</span>
        <span className="hidden text-end sm:block">{t("Time")}</span>
        <span className="hidden sm:block" />
      </RecordHead>

      {days.map((day) => (
        <Fragment key={day[0].dateLong}>
          {groupByDay ? (
            <div className="border-b bg-muted/40 px-4 py-2 font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase tabular-nums">
              {dayLabel(day[0])}
            </div>
          ) : null}

          {day.map((visit) => {
            const patient = demo.getPatient(visit.patientId);
            return (
              <RecordRow key={visit.id} href={`/visits/${visit.id}`} className={columns}>
                <RowIndex index={order.indexOf(visit)} />
                <span className="hidden sm:block">
                  <PatientAvatar initials={patient?.initials ?? "–"} />
                </span>
                <Cell
                  primary={
                    <>
                      {patient?.name ?? t("Unknown")}
                      {patient ? (
                        <span className="ms-2 hidden font-mono text-xs font-normal text-muted-foreground tabular-nums sm:inline">
                          {t("{age} yrs", { age: patient.age })}
                        </span>
                      ) : null}
                    </>
                  }
                />
                <Cell className="hidden sm:grid" primary={visit.reason} />
                <span className="justify-self-end sm:justify-self-start">
                  <StatusBadge status={visit.status} />
                </span>
                <span className="hidden text-end font-mono font-medium tabular-nums sm:block">
                  {visit.time}
                </span>
                <RowChevron />
                {/* A phone's second line, across the whole row: the age and the
                    consultation, whose columns are hidden there, then the time. */}
                <span className="col-span-2 mt-1 flex min-w-0 items-baseline gap-3 text-xs text-muted-foreground sm:hidden">
                  <span className="min-w-0 flex-1 truncate">
                    {patient ? (
                      <span className="font-mono tabular-nums">
                        {t("{age} yrs", { age: patient.age })} ·{" "}
                      </span>
                    ) : null}
                    {visit.reason}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">{visit.time}</span>
                </span>
              </RecordRow>
            );
          })}
        </Fragment>
      ))}
    </RecordList>
  );
}

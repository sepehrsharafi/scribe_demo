import Link from "next/link";
import type { ReactNode } from "react";
import { RiArrowRightLine, RiMicLine } from "@remixicon/react";
import { minutesSaved, visitOrder, type Visit } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eyebrow, Page, PageHead, SectionHead } from "@/components/page-layout";
import { VisitRows } from "@/components/visit-rows";
import { RecoveredRecordingAlert } from "@/components/recovered-recording-alert";
import { BeforeYouFinish } from "./before-you-finish";

/*
 * Colour on this page is not decoration: emerald is time the product gave
 * back, amber is work still owed. They are the same two colours the status
 * badges use, so nothing new has been invented to brighten the page up.
 */

/**
 * One tick per minute recorded today; the minutes Scribe wrote up are the
 * filled ones. The claim and its arithmetic are the same picture.
 */
function MinuteRuler({ saved, captured }: { saved: number; captured: number }) {
  const marks = Array.from({ length: Math.floor(captured / 10) + 1 }, (_, index) => index * 10);

  return (
    <div aria-hidden="true">
      <div className="flex h-8 items-end justify-between">
        {Array.from({ length: captured }, (_, minute) => (
          <span
            key={minute}
            className={cn(
              "w-0.5 rounded-full",
              minute % 10 === 0 ? "h-8" : minute % 5 === 0 ? "h-6" : "h-4",
              minute < saved ? "bg-primary" : "bg-primary/20",
            )}
          />
        ))}
      </div>
      <div className="relative mt-2 h-3 font-mono text-2xs text-muted-foreground tabular-nums">
        {marks.map((mark) => (
          <span
            key={mark}
            className="absolute top-0 -translate-x-1/2"
            style={{
              insetInlineStart: `${(mark / Math.max(captured - 1, 1)) * 100}%`,
            }}
          >
            {mark}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A tile in the workspace strip: the figure, what it means, and a small picture of it. */
function Figure({
  label,
  value,
  unit,
  note,
  children,
}: {
  label: string;
  value: number;
  unit?: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 bg-background p-5">
      <Eyebrow>{label}</Eyebrow>
      <p className="flex items-baseline gap-1.5">
        <strong className="font-heading text-3xl leading-none font-bold tracking-tight tabular-nums">{value}</strong>
        {unit ? (
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">{unit}</span>
        ) : null}
      </p>
      <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>
      <div className="mt-auto pt-2" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Oldest first. */
const chronological = (a: Visit, b: Visit) => visitOrder(a).localeCompare(visitOrder(b));

/** Visit counts per day, oldest day first, under the label each day is shown by. */
function byDay(visits: Visit[]) {
  const days = new Map<string, number>();
  for (const visit of [...visits].sort(chronological)) {
    days.set(visit.date, (days.get(visit.date) ?? 0) + 1);
  }
  return [...days.entries()].map(([label, count]) => ({ label, count }));
}

export default async function Home() {
  const { t, demo } = await getI18n();
  const { actionableVisits, recovery, today, todaysVisits, visits } = demo;

  const savedToday = minutesSaved(todaysVisits);
  const capturedToday = Math.round(todaysVisits.reduce((total, visit) => total + visit.durationSeconds, 0) / 60);

  const days = byDay(visits);
  const busiest = Math.max(...days.map((day) => day.count));
  const approved = visits.filter((visit) => visit.status === "approved").length;
  const savedAll = minutesSaved(visits);
  const recorded = [...visits]
    .filter((visit) => !visit.manual && visit.durationSeconds > 0)
    .sort(chronological);
  const averageLength = Math.round(
    recorded.reduce((total, visit) => total + visit.durationSeconds, 0) / Math.max(recorded.length, 1) / 60,
  );
  const longest = Math.max(...recorded.map((visit) => visit.durationSeconds));

  const firstDay = [...visits].sort(chronological)[0];

  return (
    <Page className="space-y-10">
      <PageHead
        eyebrow={`${today.weekday} · ${today.long}`}
        title={t("Home")}
        actions={
          <Button render={<Link href="/new" />}>
            <RiMicLine data-icon="inline-start" />
            {t("New consultation")}
          </Button>
        }
      />

      <RecoveredRecordingAlert
        patientName={demo.getPatient(recovery.patientId)?.name ?? ""}
        capturedSeconds={recovery.seconds}
        resumeHref="/new?resume=1"
      />

      {/*
        Work still owed is stated once, here: the notes to approve and the
        uploads to retry, each by name. The sidebar badge keeps counting after
        this is dismissed.
      */}
      <BeforeYouFinish
        items={actionableVisits.map((visit) => ({
          visitId: visit.id,
          patientName: demo.getPatient(visit.patientId)?.name ?? "",
          reason: visit.reason,
          when: `${visit.date} · ${visit.time}`,
          action: visit.status === "failed" ? "retry" : "approve",
        }))}
      />

      <section className="rounded-2xl border bg-primary/5 p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-12">
          <div>
            <Eyebrow>{t("Time saved today")}</Eyebrow>
            <p className="mt-5 flex items-baseline gap-2">
              <strong className="font-heading text-6xl leading-none font-bold tracking-tighter text-primary tabular-nums sm:text-7xl">
                {savedToday}
              </strong>
              <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                {t("min")}
              </span>
            </p>
          </div>
          <div className="min-w-0">
            <MinuteRuler saved={savedToday} captured={capturedToday} />
            <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">
              {t(
                "{saved} of the {captured} minutes you recorded today came back as time — the write-up a note usually costs, about two thirds of each consultation.",
                { saved: savedToday, captured: capturedToday },
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHead title={t("Across the workspace")} meta={t("Since {date}", { date: firstDay.dateLong })} />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label={t("Consultations")}
            value={visits.length}
            note={days.map((day) => `${day.label}: ${day.count}`).join(" · ")}
          >
            <div className="flex h-12 items-end gap-1.5">
              {days.map((day) => (
                <span key={day.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="font-mono text-2xs text-muted-foreground tabular-nums">{day.count}</span>
                  <span
                    className="w-full rounded-sm bg-foreground/80"
                    style={{ height: `${(day.count / busiest) * 28}px` }}
                  />
                </span>
              ))}
            </div>
          </Figure>

          <Figure
            label={t("Notes approved")}
            value={approved}
            note={t("{open} still open.", { open: visits.length - approved })}
          >
            <div className="flex gap-1">
              {[...visits]
                .sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved"))
                .map((visit) => (
                  <span
                    key={visit.id}
                    className={cn(
                      "h-7 flex-1 rounded-sm",
                      visit.status === "approved" ? "bg-primary" : "border border-dashed border-foreground/40",
                    )}
                  />
                ))}
            </div>
          </Figure>

          <Figure
            label={t("Minutes saved")}
            value={savedAll}
            unit={t("min")}
            note={t("Write-up time across every recorded visit.")}
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.round((savedToday / savedAll) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1.5 font-mono text-2xs text-muted-foreground tabular-nums">
              {t("{today} of them today", { today: savedToday })}
            </p>
          </Figure>

          <Figure
            label={t("Average consultation")}
            value={averageLength}
            unit={t("min")}
            note={t("Across {count} recorded visits.", {
              count: recorded.length,
            })}
          >
            <div className="flex h-10 items-end gap-1">
              {recorded.map((visit) => (
                <span
                  key={visit.id}
                  className="flex-1 rounded-sm bg-foreground/80"
                  style={{
                    height: `${(visit.durationSeconds / longest) * 100}%`,
                  }}
                />
              ))}
            </div>
          </Figure>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHead
          title={t("Today’s consultations")}
          action={
            <Button variant="link" size="sm" render={<Link href="/visits" />}>
              {t("All visits")}
              <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
            </Button>
          }
        />
        <VisitRows visits={todaysVisits} />
      </section>
    </Page>
  );
}

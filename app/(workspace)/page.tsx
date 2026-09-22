import Link from "next/link";
import type { ReactNode } from "react";
import { RiArrowRightLine, RiMicLine } from "@remixicon/react";
import { demo as dataset, minutesSaved, type Visit } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eyebrow, Page, PageHead, SectionHead } from "@/components/page-layout";
import { VisitRows } from "@/components/visit-rows";
import { RecoveredRecordingAlert } from "@/components/recovered-recording-alert";

/*
 * Colour on this page is not decoration: emerald is time the product gave
 * back, amber is work still owed. They are the same two colours the status
 * badges use, so nothing new has been invented to brighten the page up.
 */
function Headline({
  tone,
  label,
  value,
  unit,
  children,
}: {
  tone: "gained" | "owed";
  label: string;
  value: number;
  unit: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background">
      <div
        className={cn(
          "flex h-full flex-col p-6 lg:p-8",
          tone === "gained" ? "bg-primary/5" : "bg-warning/5",
        )}
      >
        <Eyebrow>{label}</Eyebrow>
        <p className="mt-5 flex items-baseline gap-2">
          <strong
            className={cn(
              "font-heading text-6xl leading-none font-bold tracking-tighter tabular-nums sm:text-7xl",
              tone === "gained" ? "text-primary" : "text-warning",
            )}
          >
            {value}
          </strong>
          <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {unit}
          </span>
        </p>
        <div className="mt-6 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/**
 * One tick per minute recorded today; the minutes Scribe wrote up are the
 * filled ones. The claim and its arithmetic are the same picture.
 */
function MinuteRuler({ saved, captured }: { saved: number; captured: number }) {
  const marks = Array.from(
    { length: Math.floor(captured / 10) + 1 },
    (_, index) => index * 10,
  );

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
            className="absolute top-0 -translate-x-1/2 rtl:translate-x-1/2"
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

/** Past this many, the owed panel counts the rest instead of listing them. */
const maxOwedRows = 3;

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
        <strong className="font-heading text-3xl leading-none font-bold tracking-tight tabular-nums">
          {value}
        </strong>
        {unit ? (
          <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
      <div className="mt-auto pt-2" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** When a visit happened. The English dates are the stable key; the Farsi ones are Jalali. */
function happenedAt(visit: Visit) {
  const source = dataset("en").getVisit(visit.id);
  return source ? Date.parse(`${source.dateLong} ${source.time}`) : 0;
}

/** Visit counts per day, oldest day first, under the label each day is shown by. */
function byDay(visits: Visit[]) {
  const days = new Map<string, number>();
  for (const visit of [...visits].sort(
    (a, b) => happenedAt(a) - happenedAt(b),
  )) {
    days.set(visit.date, (days.get(visit.date) ?? 0) + 1);
  }
  return [...days.entries()].map(([label, count]) => ({ label, count }));
}

export default async function Home() {
  const { t, demo } = await getI18n();
  const { actionableVisits, recovery, today, todaysVisits, visits } = demo;

  const waiting = actionableVisits.length;
  const savedToday = minutesSaved(todaysVisits);
  const capturedToday = Math.round(
    todaysVisits.reduce((total, visit) => total + visit.durationSeconds, 0) /
      60,
  );

  const days = byDay(visits);
  const busiest = Math.max(...days.map((day) => day.count));
  const signed = visits.filter((visit) => visit.status === "signed").length;
  const savedAll = minutesSaved(visits);
  const recorded = [...visits]
    .filter((visit) => !visit.manual && visit.durationSeconds > 0)
    .sort((a, b) => happenedAt(a) - happenedAt(b));
  const averageLength = Math.round(
    recorded.reduce((total, visit) => total + visit.durationSeconds, 0) /
      Math.max(recorded.length, 1) /
      60,
  );
  const longest = Math.max(...recorded.map((visit) => visit.durationSeconds));

  // The owed panel names a few visits, then counts the rest, so it keeps its size.
  const owedShown = actionableVisits.slice(0, maxOwedRows);
  const owedMore = actionableVisits.length - owedShown.length;
  const anyFailed = owedShown.some((visit) => visit.status === "failed");
  const firstDay = [...visits].sort((a, b) => happenedAt(a) - happenedAt(b))[0];

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
        Two figures, one rule between them: what Scribe gave back, and what is
        still owed. The owed side lists the visits themselves, so there is no
        second "needs attention" list further down.
      */}
      <section className="grid gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-2">
        <Headline
          tone="gained"
          label={t("Time saved today")}
          value={savedToday}
          unit={t("min")}
        >
          <MinuteRuler saved={savedToday} captured={capturedToday} />
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {t(
              "{saved} of the {captured} minutes you recorded today came back as time — the write-up a note usually costs, about two thirds of each consultation.",
              { saved: savedToday, captured: capturedToday },
            )}
          </p>
        </Headline>

        <Headline
          tone="owed"
          label={t("Before the day closes")}
          value={waiting}
          unit={t("visits")}
        >
          {owedShown.length ? (
            <ul className="-mx-2 divide-y divide-warning/15 border-y border-warning/15">
              {owedShown.map((visit) => {
                const patient = demo.getPatient(visit.patientId);
                const failed = visit.status === "failed";
                return (
                  <li key={visit.id}>
                    <Link
                      href={`/visits/${visit.id}`}
                      className="group/owed flex items-center gap-3 px-2 py-3 transition-colors hover:bg-warning/5"
                    >
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {patient?.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {visit.reason} · {visit.date}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-xs font-medium",
                          failed ? "text-destructive" : "text-warning",
                        )}
                      >
                        {failed ? t("Retry processing") : t("Review and sign")}
                        <RiArrowRightLine className="size-3.5 transition-transform group-hover/owed:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/owed:-translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
              {owedMore ? (
                <li>
                  <Link
                    href="/visits"
                    className="group/owed flex items-center justify-between gap-3 px-2 py-3 text-xs font-medium text-warning transition-colors hover:bg-warning/5"
                  >
                    {t("{count} more waiting", { count: owedMore })}
                    <span className="flex items-center gap-1">
                      {t("Open visits")}
                      <RiArrowRightLine className="size-3.5 transition-transform group-hover/owed:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/owed:-translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("Nothing is waiting on you. Every note so far is signed.")}
            </p>
          )}
          {anyFailed ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t(
                "A failed upload keeps its audio on this device, so nothing has to be recorded again.",
              )}
            </p>
          ) : null}
        </Headline>
      </section>

      <section className="space-y-4">
        <SectionHead
          title={t("Across the workspace")}
          meta={t("Since {date}", { date: firstDay.dateLong })}
        />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label={t("Consultations")}
            value={visits.length}
            note={days.map((day) => `${day.label}: ${day.count}`).join(" · ")}
          >
            <div className="flex h-12 items-end gap-1.5">
              {days.map((day) => (
                <span
                  key={day.label}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="font-mono text-2xs text-muted-foreground tabular-nums">
                    {day.count}
                  </span>
                  <span
                    className="w-full rounded-sm bg-foreground/80"
                    style={{ height: `${(day.count / busiest) * 28}px` }}
                  />
                </span>
              ))}
            </div>
          </Figure>

          <Figure
            label={t("Notes signed")}
            value={signed}
            note={t("{open} still open.", { open: visits.length - signed })}
          >
            <div className="flex gap-1">
              {[...visits]
                .sort(
                  (a, b) =>
                    Number(b.status === "signed") -
                    Number(a.status === "signed"),
                )
                .map((visit) => (
                  <span
                    key={visit.id}
                    className={cn(
                      "h-7 flex-1 rounded-sm",
                      visit.status === "signed"
                        ? "bg-primary"
                        : "border border-dashed border-foreground/25",
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
              <RiArrowRightLine
                data-icon="inline-end"
                className="rtl:-scale-x-100"
              />
            </Button>
          }
        />
        <VisitRows visits={todaysVisits} when="duration" />
      </section>
    </Page>
  );
}

import Link from "next/link";
import { RiArrowRightLine, RiCheckDoubleLine } from "@remixicon/react";
import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/page-layout";
import { RecoveredRecordingAlert } from "@/components/recovered-recording-alert";
import { TimeGivenBack } from "./time-given-back";

/**
 * Home is the day so far — a greeting, the time Scribe gave back, the only
 * thing worth a doctor's attention between visits: work that cannot move
 * without them. The next patient is a click, or N, away.
 */
export default async function Home() {
  const { t, f, demo, now } = await getI18n();
  const { doctor, recovery, waiting } = demo;

  const hour = new Date(now).getHours();
  const name = doctor.name;
  const greeting =
    hour < 12
      ? t("Good morning, {name}", { name })
      : hour < 18
        ? t("Good afternoon, {name}", { name })
        : t("Good evening, {name}", { name });

  return (
    <Page className="max-w-3xl space-y-8 py-10 lg:py-12">
      <RecoveredRecordingAlert
        patientName={demo.getPatient(recovery.patientId)?.name ?? ""}
        capturedSeconds={recovery.seconds}
        resumeHref="/new?resume=1"
      />

      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="text-xs text-muted-foreground">{f.longDay(demoToday)}</p>
      </header>

      <TimeGivenBack />

      <Card className="gap-0 py-0">
        <div className="flex items-baseline justify-between gap-4 border-b px-5 py-4">
          <h2 className="text-base font-semibold">{t("Waiting on you")}</h2>
          {waiting.length ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {waiting.length === 1 ? t("1 visit") : t("{count} visits", { count: waiting.length })}
            </p>
          ) : null}
        </div>

        {waiting.length ? (
          <ul className="divide-y">
            {waiting.map((visit) => {
              const failed = visit.status === "failed";
              return (
                <li key={visit.id}>
                  <Link
                    href={`/visits/${visit.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{demo.getPatient(visit.patientId)?.name}</span>
                      <span className="flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{visit.reason || t("New visit")}</span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0 tabular-nums">
                          {f.day(visit.day)} · {visit.time}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        failed ? "text-destructive" : "text-warning",
                      )}
                    >
                      {failed ? t("Retry the upload") : t("Review and approve")}
                      <RiArrowRightLine className="size-4 rtl:-scale-x-100" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
            <RiCheckDoubleLine className="size-4 text-primary" />
            {t("Nothing is waiting. Every note is approved.")}
          </p>
        )}
      </Card>
    </Page>
  );
}

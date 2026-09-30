import Link from "next/link";
import { RiArrowRightLine, RiCheckDoubleLine } from "@remixicon/react";
import { getI18n } from "@/lib/i18n/server";
import { patientOptions } from "@/lib/patient-options";
import { cn } from "@/lib/utils";
import { Eyebrow, Page } from "@/components/page-layout";
import { PatientPicker } from "@/components/patient-picker";
import { RecoveredRecordingAlert } from "@/components/recovered-recording-alert";
import { TimeGivenBack } from "./time-given-back";

/**
 * Home is the day so far — the one figure worth keeping, the time Scribe gave
 * back — then the way to the next patient, and the only other thing worth a
 * doctor's attention between visits: work that cannot move without them.
 */
export default async function Home() {
  const { t, f, demo } = await getI18n();
  const { recovery, waiting } = demo;

  return (
    <Page className="max-w-3xl space-y-12 py-10 lg:py-16">
      <RecoveredRecordingAlert
        patientName={demo.getPatient(recovery.patientId)?.name ?? ""}
        capturedSeconds={recovery.seconds}
        resumeHref="/new?resume=1"
      />

      <h1 className="sr-only">{t("Home")}</h1>
      <TimeGivenBack />

      <PatientPicker patients={patientOptions(demo, f)} lead />

      <section aria-labelledby="waiting" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="waiting" className="font-heading text-lg font-semibold tracking-tight">
            {t("Waiting on you")}
          </h2>
          {waiting.length ? (
            <Eyebrow>{waiting.length === 1 ? t("1 visit") : t("{count} visits", { count: waiting.length })}</Eyebrow>
          ) : null}
        </div>

        {waiting.length ? (
          <ul className="divide-y border-y">
            {waiting.map((visit) => {
              const failed = visit.status === "failed";
              return (
                <li key={visit.id}>
                  <Link
                    href={`/visits/${visit.id}`}
                    className="group/owed -mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{demo.getPatient(visit.patientId)?.name}</span>
                      <span className="mt-0.5 flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{visit.reason || t("New visit")}</span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0 font-mono tabular-nums">
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
                      <RiArrowRightLine className="size-4 transition-transform group-hover/owed:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/owed:-translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 border-y py-4 text-sm text-muted-foreground">
            <RiCheckDoubleLine className="size-4 text-primary" />
            {t("Nothing is waiting. Every note is approved.")}
          </p>
        )}
      </section>
    </Page>
  );
}

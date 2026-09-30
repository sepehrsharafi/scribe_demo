import Link from "next/link";
import type { ClinicalEntry, Patient, Visit } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { SectionHead } from "@/components/page-layout";
import { StatusBadge } from "@/components/status-badge";

const started: Record<ClinicalEntry["kind"], string> = {
  problem: "Problem",
  medication: "Medication",
  allergy: "Allergy",
};

const stopped: Record<ClinicalEntry["kind"], string> = {
  problem: "Resolved",
  medication: "Stopped",
  allergy: "Removed",
};

/** One thing a visit added to or took off the record. A dashed edge means not approved yet. */
function Change({
  verb,
  entry,
  pending,
  quiet,
}: {
  verb: string;
  entry: ClinicalEntry;
  pending?: boolean;
  quiet?: boolean;
}) {
  return (
    <li
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-1.5 text-xs",
        entry.kind === "allergy" && "border-destructive/30 bg-destructive/5 text-destructive",
        pending && "border-dashed",
        quiet && "text-muted-foreground",
      )}
    >
      <span className="font-mono text-2xs tracking-[0.12em] uppercase opacity-80">{verb}</span>
      <span className={cn(quiet ? "line-through decoration-1" : "font-medium")}>{entry.text}</span>
    </li>
  );
}

/**
 * Every visit with the patient in order, newest first, with what each added
 * to the record or ended — so the record reads as a history rather than a
 * list. What a note not yet approved would add is shown dashed, and said
 * once per visit.
 */
export async function VisitHistory({ patient, visits }: { patient: Patient; visits: Visit[] }) {
  const { t, f } = await getI18n();
  const began = (visitId?: string) =>
    patient.record.filter((entry) => entry.visitId === visitId);
  const ended = (visitId: string) => patient.record.filter((entry) => entry.endedVisitId === visitId);
  const registration = began(undefined);

  return (
    <section className="space-y-4">
      <SectionHead
        title={t("Visits")}
        meta={visits.length === 1 ? t("1 record") : t("{count} records", { count: visits.length })}
      />

      <ol className="relative ms-2 border-s ps-6">
        {visits.map((visit) => {
          const added = began(visit.id);
          const taken = ended(visit.id);
          const pending = visit.status !== "approved";
          return (
            <li key={visit.id} className="relative pb-8 last:pb-6">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1.5 -start-[calc(1.5rem+0.3125rem)] size-2.5 rounded-full ring-4 ring-background",
                  pending ? "bg-warning" : "bg-primary",
                )}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <time className="font-mono text-xs text-muted-foreground tabular-nums">
                  {f.date(visit.day, "short")} · {visit.time}
                </time>
                <StatusBadge status={visit.status} />
              </div>
              <Link href={`/visits/${visit.id}`} className="mt-1 inline-block font-medium underline-offset-4 hover:underline">
                {visit.reason || t("New visit")}
              </Link>
              {added.length || taken.length ? (
                <>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {added.map((entry) => (
                      <Change key={entry.id} verb={t(started[entry.kind])} entry={entry} pending={pending} />
                    ))}
                    {taken.map((entry) => (
                      <Change key={`${entry.id}-end`} verb={t(stopped[entry.kind])} entry={entry} pending={pending} quiet />
                    ))}
                  </ul>
                  {/* Said once for the whole visit, not on every change in it. */}
                  {pending ? (
                    <p className="mt-2 text-xs text-warning">
                      {t("Not approved yet — these changes join the record once the note is approved.")}
                    </p>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}

        {registration.length ? (
          <li className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -start-[calc(1.5rem+0.3125rem)] size-2.5 rounded-full bg-muted-foreground ring-4 ring-background"
            />
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {t("Registered {when}", { when: f.month(patient.registered) })}
            </span>
            <p className="mt-1 font-medium">{t("Registration record")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {registration.map((entry) => (
                <Change key={entry.id} verb={t(started[entry.kind])} entry={entry} />
              ))}
            </ul>
          </li>
        ) : null}
      </ol>
    </section>
  );
}

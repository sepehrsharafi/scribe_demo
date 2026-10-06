import Link from "next/link";
import type { ReactNode } from "react";
import { RiArrowDownSFill, RiArrowRightLine, RiTimeLine } from "@remixicon/react";
import { getI18n } from "@/lib/i18n/server";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EntrySource } from "@/components/entry-source";

/** **bold**, or [label](visitId) — an empty label reads as that visit's date. */
const token = /\*\*(.+?)\*\*|\[([^\]]*)\]\((\w+)\)/g;

function Points({ items, render }: { items: string[]; render: (text: string) => ReactNode }) {
  return (
    <ul className="grid list-disc gap-1.5 ps-5 text-sm leading-relaxed marker:text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="ps-1 text-pretty">
          {render(item)}
        </li>
      ))}
    </ul>
  );
}

/**
 * What to know about a patient, gathered from the record and the earlier
 * notes: one line on who they are and why they are here, then — behind one
 * fold — each problem on the record with what the notes say about it, and
 * what the visit is for. Every visit it mentions links to that visit's note.
 * Beside it, what they take, each medicine traced to where it was recorded.
 *
 * On a visit it is the Context tab, as things stood going in; on the patient
 * page, as things stand now, for the next visit.
 */
export async function PatientContext({
  patientId,
  visitId,
  planDay,
  aside,
}: {
  patientId: string;
  /** The filed visit this is the context for; absent for the next one. */
  visitId?: string;
  /** yyyy-mm-dd the plan is for. Absent on the patient page, where the next visit has no date yet. */
  planDay?: string;
  /** Anything else that belongs beside it, such as the visit's files. */
  aside?: ReactNode;
}) {
  const { t, f, demo } = await getI18n();
  const brief = demo.getBrief(patientId, visitId);
  const { previous, medications } = demo.getPatientContext(patientId, visitId);

  const strings = brief ? [brief.summary, ...brief.problems.flatMap((problem) => problem.points), ...brief.plan] : [];
  const cited = new Set(strings.flatMap((text) => [...text.matchAll(token)].flatMap((match) => (match[3] ? [match[3]] : []))));

  function inline(text: string) {
    const parts: ReactNode[] = [];
    let cursor = 0;
    for (const match of text.matchAll(token)) {
      const at = match.index ?? 0;
      if (at > cursor) parts.push(text.slice(cursor, at));
      const [, bold, label, id] = match;
      if (bold) {
        parts.push(
          <strong key={at} className="font-semibold">
            {bold}
          </strong>,
        );
      } else {
        const visit = demo.getVisit(id);
        parts.push(
          visit ? (
            <Link
              key={at}
              href={`/visits/${visit.id}`}
              title={visit.reason || t("New visit")}
              className="whitespace-nowrap tabular-nums text-primary underline-offset-4 hover:underline"
            >
              {label || f.date(visit.day, "short")}
            </Link>
          ) : (
            label
          ),
        );
      }
      cursor = at + match[0].length;
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  }

  // Only a visit has a date for its plan; the patient page already says when they were last seen and is the record.
  const onVisit = Boolean(planDay);
  const sources = cited.size
    ? cited.size === 1
      ? t("From the record and 1 earlier note")
      : t("From the record and {count} earlier notes", { count: cited.size })
    : t("From the record");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
      <div className="grid min-w-0 content-start gap-8">
        <section aria-label={t("Summary")}>
          <p className="max-w-prose text-base leading-7 text-pretty">
            {brief ? inline(brief.summary) : t("New to the practice. Nothing is on record yet.")}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{sources}</span>
            {onVisit && previous ? (
              <span>
                {t("Last visit")}{" "}
                <Link
                  href={`/visits/${previous.id}`}
                  className="text-foreground tabular-nums underline-offset-4 hover:underline"
                >
                  {f.date(previous.day, "short")}
                </Link>
              </span>
            ) : null}
            {onVisit ? (
              <Link
                href={`/patients/${patientId}`}
                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("Full record")}
                <RiArrowRightLine className="size-4 rtl:-scale-x-100" />
              </Link>
            ) : null}
          </p>
        </section>

        <Collapsible defaultOpen className="border-t">
          <CollapsibleTrigger className="group/insights flex w-full items-center justify-between gap-4 py-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid gap-0.5">
              <span className="text-base font-semibold">{t("Patient insights")}</span>
              <span className="text-xs text-muted-foreground">{t("Problem summary and visit plan")}</span>
            </span>
            <RiArrowDownSFill
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground transition-[rotate,color] duration-250 ease-drawer group-hover/insights:text-foreground group-data-panel-open/insights:rotate-180 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent hiddenUntilFound>
            <div className="grid gap-8 pt-1 pb-2">
              <section aria-labelledby="problem-summary" className="grid gap-1">
                <h3 id="problem-summary" className="text-base font-semibold">
                  {t("Problem summary")}
                </h3>
                {brief?.problems.length ? (
                  brief.problems.map((problem) => (
                    <Collapsible key={problem.title} defaultOpen>
                      <CollapsibleTrigger className="group/problem flex w-full items-center gap-2 rounded-sm py-2 text-start text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                        <RiArrowDownSFill
                          aria-hidden="true"
                          className="size-4 shrink-0 -rotate-90 transition-[rotate] duration-250 ease-drawer group-data-panel-open/problem:rotate-0 motion-reduce:transition-none rtl:rotate-90 rtl:group-data-panel-open/problem:rotate-0"
                        />
                        {problem.title}
                      </CollapsibleTrigger>
                      <CollapsibleContent hiddenUntilFound>
                        <div className="ps-6 pb-3">
                          <Points items={problem.points} render={inline} />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">
                    {t("Nothing on the record yet: no long-term problems to carry into this visit.")}
                  </p>
                )}
              </section>

              {brief?.plan.length ? (
                <section aria-labelledby="visit-plan" className="grid gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 id="visit-plan" className="text-base font-semibold">
                      {onVisit ? t("Visit plan") : t("Plan for the next visit")}
                    </h3>
                    {planDay ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                        <RiTimeLine className="size-4" aria-hidden="true" />
                        {f.date(planDay, "short")}
                      </span>
                    ) : null}
                  </div>
                  <Points items={brief.plan} render={inline} />
                </section>
              ) : null}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <aside className="grid min-w-0 content-start gap-10">
        <section aria-labelledby="medications" className="grid content-start gap-3">
          <h3 id="medications" className="flex items-baseline justify-between gap-3 text-base font-semibold">
            {t("Medications")}
            <span className="text-xs font-normal text-muted-foreground tabular-nums">{medications.length}</span>
          </h3>
          {medications.length ? (
            <ul className="grid gap-4">
              {medications.map((item) => (
                <li key={item.entry.id} className="grid">
                  <span className="text-sm leading-snug font-medium">{item.entry.text}</span>
                  <EntrySource item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("None recorded")}</p>
          )}
        </section>
        {aside}
      </aside>
    </div>
  );
}

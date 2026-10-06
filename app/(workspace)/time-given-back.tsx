import { RiTimeLine } from "@remixicon/react";
import type { Note } from "@/lib/demo-data";
import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** A clinician's typing speed when writing up, words a minute. Said out loud under the figure. */
const typingSpeed = 30;

/** The seven days ending today, as yyyy-mm-dd, which sorts like a date. */
const weekStart = new Date(Date.parse(demoToday) - 6 * 86_400_000).toISOString().slice(0, 10);

const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Every word Scribe wrote for a visit: the note, its medication rows and the patient's letter. */
function wordsWritten(note: Note) {
  return (
    note.sections.reduce((total, section) => total + wordsIn(section.body), 0) +
    note.medications.reduce(
      (total, row) => total + wordsIn([row.drug, row.dose, row.frequency, row.duration].join(" ")),
      0,
    ) +
    Object.values(note.instructions).reduce((total, text) => total + wordsIn(text), 0)
  );
}

/**
 * What Scribe has given back, as the one figure worth keeping: the writing-up
 * it did today, in minutes, with the week and the whole time since you
 * started beside it. Under it, today twice on one scale — the time spent with
 * patients, and that time with the writing added, which is what the day would
 * have taken without Scribe. The difference between the two bars is the
 * figure. It is worked out from the words actually written, at a stated
 * typing speed, never estimated from nothing.
 */
export async function TimeGivenBack() {
  const { t, demo } = await getI18n();

  const written = demo.visits.flatMap((visit) => {
    const note = demo.getNote(visit.id);
    return note ? [{ day: visit.day, words: wordsWritten(note) }] : [];
  });
  const wordsOn = (counts: (day: string) => boolean) =>
    written.filter(({ day }) => counts(day)).reduce((total, { words }) => total + words, 0);

  const today = demo.visits.filter((visit) => visit.day === demoToday);
  const words = wordsOn((day) => day === demoToday);
  const writing = Math.round(words / typingSpeed);
  const thisWeek = Math.round(wordsOn((day) => day >= weekStart && day <= demoToday) / typingSpeed);
  const sinceStart = Math.round(wordsOn(() => true) / typingSpeed);
  const withPatients = Math.round(today.reduce((total, visit) => total + visit.seconds, 0) / 60);
  const signed = today.filter((visit) => visit.status === "approved").length;
  const without = withPatients + writing;

  const minutes = (total: number) =>
    total < 60
      ? t("{minutes} min", { minutes: total })
      : t("{hours} h {minutes} min", { hours: Math.floor(total / 60), minutes: total % 60 });
  const share = (part: number) => `${without ? (part / without) * 100 : 0}%`;

  const bars = [
    { label: t("With Scribe"), total: withPatients, writing: 0 },
    { label: t("Without Scribe"), total: without, writing },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <RiTimeLine className="size-4 text-primary" />
          {t("Time given back")}
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {today.length === 1 ? t("1 visit") : t("{count} visits", { count: today.length })}
          {" · "}
          {t("{signed} of {count} signed off", { signed, count: today.length })}
        </p>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <p className="flex items-baseline gap-2 text-primary">
              <span className="text-6xl leading-none font-semibold tracking-tight tabular-nums">{writing}</span>
              <span className="text-2xl leading-none font-semibold tracking-tight">{t("min")}</span>
            </p>
            <p className="mt-3 text-base font-medium">
              {writing ? t("of writing up, done for you today") : t("Nothing written up yet today")}
            </p>
          </div>
          <dl className="flex gap-10">
            {[
              { label: t("This week"), total: thisWeek },
              { label: t("Since you started"), total: sinceStart },
            ].map((figure) => (
              <div key={figure.label}>
                <dt className="text-xs text-muted-foreground">{figure.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{minutes(figure.total)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {without ? (
          <figure className="grid gap-4 border-t pt-6">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3">
              {bars.map((bar) => (
                <div key={bar.label} className="contents">
                  <span className="text-xs font-medium text-muted-foreground">{bar.label}</span>
                  <span aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <span className="h-full bg-foreground" style={{ width: share(withPatients) }} />
                    {bar.writing ? (
                      <span
                        className="h-full border-s-2 border-background bg-primary"
                        style={{ width: share(bar.writing) }}
                      />
                    ) : null}
                  </span>
                  <span className={cn("text-end text-xs tabular-nums", bar.writing ? "text-foreground" : "text-muted-foreground")}>
                    {minutes(bar.total)}
                  </span>
                </div>
              ))}
            </div>
            <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-foreground" />
                {t("{time} with patients", { time: minutes(withPatients) })}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-primary" />
                {t("{time} of writing up", { time: minutes(writing) })}
              </span>
              <span className="basis-full sm:basis-auto sm:ms-auto">
                {t("From {words} words written, at {speed} words a minute", {
                  words: words.toLocaleString("en-GB"),
                  speed: typingSpeed,
                })}
              </span>
            </figcaption>
          </figure>
        ) : (
          <p className="border-t pt-6 text-sm text-muted-foreground">
            {t("Each visit you record today adds the writing Scribe does for you here.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

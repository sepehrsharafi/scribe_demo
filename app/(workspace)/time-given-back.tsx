import type { Note } from "@/lib/demo-data";
import { demoToday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/** A clinician's typing speed when writing up, words a minute. Said out loud under the figure. */
const typingSpeed = 30;

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
 * The day so far, as the one figure worth keeping: the writing-up Scribe did,
 * in minutes. Under it, the same day twice on one scale — the time spent with
 * patients, and that time with the writing added, which is what the day would
 * have taken without Scribe. The difference between the two bars is the
 * figure. It is worked out from the words actually written, at a stated
 * typing speed, never estimated from nothing.
 */
export async function TimeGivenBack() {
  const { t, f, demo } = await getI18n();

  const today = demo.visits.filter((visit) => visit.day === demoToday);
  const words = today.reduce((total, visit) => {
    const note = demo.getNote(visit.id);
    return total + (note ? wordsWritten(note) : 0);
  }, 0);
  const writing = Math.round(words / typingSpeed);
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
    <section aria-labelledby="given-back" className="grid gap-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">{f.longDay(demoToday)}</p>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {today.length === 1 ? t("1 visit") : t("{count} visits", { count: today.length })}
          {" · "}
          {t("{signed} of {count} signed off", { signed, count: today.length })}
        </p>
      </div>

      <div>
        <h2 id="given-back" className="flex items-baseline gap-2 text-primary">
          <span className="font-heading text-6xl leading-none font-bold tracking-tight tabular-nums">{writing}</span>
          <span className="font-heading text-2xl leading-none font-semibold tracking-tight">{t("min")}</span>
        </h2>
        <p className="mt-3 font-heading text-lg leading-snug font-medium tracking-tight">
          {writing ? t("of writing up, done for you today") : t("Nothing written up yet today")}
        </p>
      </div>

      {without ? (
        <figure className="grid gap-4">
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
                <span className={cn("text-end font-mono text-xs tabular-nums", bar.writing ? "text-foreground" : "text-muted-foreground")}>
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
        <p className="text-sm text-muted-foreground">
          {t("Each visit you record today adds the writing Scribe does for you here.")}
        </p>
      )}
    </section>
  );
}

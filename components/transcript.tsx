import type { Speaker, TranscriptLine } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/* The doctor's words carry the most weight; everyone else in the room is set
   a step quieter, and a third voice gets a rule of its own so it is never
   mistaken for the patient. */
const speakerTone: Record<Speaker, string> = {
  Doctor: "text-foreground",
  Patient: "text-muted-foreground",
  Companion: "text-muted-foreground",
};

/**
 * The visit as it was spoken. Turns carry a speaker and a timestamp and
 * nothing else — separating the voices in the room is what the audio actually
 * supports, so the transcript does not pretend to know which part of the note
 * a turn belongs to. Anyone beyond doctor and patient — a partner, a parent,
 * an interpreter — is labelled as themselves.
 */
export async function Transcript({ lines, length }: { lines: TranscriptLine[]; length: string }) {
  const { t } = await getI18n();

  // Speakers in the order they first spoke, with how many turns each took.
  const speakers = [...new Set(lines.map((line) => line.speaker))].map((speaker) => ({
    speaker,
    turns: lines.filter((line) => line.speaker === speaker).length,
  }));

  return (
    <div className="grid min-w-0 gap-6">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {[
          { label: t("Length"), value: length },
          ...speakers.map(({ speaker, turns }) => ({
            label: t(speaker),
            value: turns === 1 ? t("1 turn") : t("{count} turns", { count: turns }),
          })),
        ].map((fact) => (
          <div key={fact.label}>
            <dt className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">{fact.label}</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <ol className="divide-y border-y">
        {lines.map((line) => (
          <li
            key={`${line.time}-${line.speaker}`}
            className={cn(
              "grid gap-1 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4",
              line.speaker === "Companion" && "border-s-2 border-s-primary/40 ps-4 sm:ps-4",
            )}
          >
            <div className="flex items-baseline gap-3 sm:block">
              <span
                className={cn(
                  "font-mono text-2xs font-semibold tracking-[0.12em] uppercase",
                  speakerTone[line.speaker],
                )}
              >
                {t(line.speaker)}
              </span>
              <time className="block font-mono text-2xs text-muted-foreground tabular-nums sm:mt-1">{line.time}</time>
            </div>
            <p className="leading-relaxed">{line.text}</p>
          </li>
        ))}
      </ol>

      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {t("Nothing in the note may go beyond what is said here. Sections the conversation never covered stay marked as explicit gaps.")}
      </p>
    </div>
  );
}

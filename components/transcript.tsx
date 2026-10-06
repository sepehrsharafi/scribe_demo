import type { Speaker, TranscriptLine } from "@/lib/demo-data";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/* The doctor is set in the accent, the patient in plain text, and a third
   voice a step quieter with a rule of its own, so it is never mistaken for
   either. */
const speakerTone: Record<Speaker, string> = {
  Doctor: "text-primary",
  Patient: "text-foreground",
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
    <div className="grid min-w-0 gap-8">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {[
          { label: t("Length"), value: length },
          ...speakers.map(({ speaker, turns }) => ({
            label: t(speaker),
            value: turns === 1 ? t("1 turn") : t("{count} turns", { count: turns }),
          })),
        ].map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <ol className="grid gap-6">
        {lines.map((line) => (
          <li
            key={`${line.time}-${line.speaker}`}
            className={cn(
              "grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4",
              line.speaker === "Companion" && "border-s-2 border-s-primary/40 ps-4",
            )}
          >
            <div className="flex items-baseline gap-3 sm:block">
              <span className={cn("text-xs font-medium", speakerTone[line.speaker])}>{t(line.speaker)}</span>
              <time className="block text-xs text-muted-foreground tabular-nums">{line.time}</time>
            </div>
            <p className="text-sm leading-7">{line.text}</p>
          </li>
        ))}
      </ol>

      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {t("Nothing in the note may go beyond what is said here. Sections the conversation never covered stay marked as explicit gaps.")}
      </p>
    </div>
  );
}

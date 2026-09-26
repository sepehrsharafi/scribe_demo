"use client";

import { RiVoiceprintLine } from "@remixicon/react";
import type { Speaker, TranscriptLine } from "@/lib/demo-data";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/page-layout";
import { useI18n } from "@/components/i18n-provider";

/* The doctor's words carry the most weight; everyone else in the room is set
   a step quieter, and a third voice gets a rule of its own so it is never
   mistaken for the patient. */
const speakerTone: Record<Speaker, string> = {
  Doctor: "text-foreground",
  Patient: "text-muted-foreground",
  Companion: "text-muted-foreground",
};

/**
 * The consultation as it was spoken. Turns carry a speaker and a timestamp and
 * nothing else — separating the voices in the room is what the audio actually
 * supports, so the transcript does not pretend to know which part of the note
 * a turn belongs to. Anyone beyond doctor and patient — a partner, a parent,
 * an interpreter — is labelled as themselves.
 */
export function TranscriptView({
  transcript,
  duration,
}: {
  transcript: TranscriptLine[];
  duration: string;
}) {
  const { t } = useI18n();

  if (!transcript.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiVoiceprintLine />
          </EmptyMedia>
          <EmptyTitle>{t("No transcript yet")}</EmptyTitle>
          <EmptyDescription>
            {t("The transcript appears once the audio has been uploaded and the speakers separated.")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Speakers in the order they first spoke, with how many turns each took.
  const speakers = [...new Set(transcript.map((line) => line.speaker))].map((speaker) => ({
    speaker,
    turns: transcript.filter((line) => line.speaker === speaker).length,
  }));

  const facts = [
    { label: t("Length"), value: duration },
    { label: t("Turns"), value: String(transcript.length) },
    ...speakers.map(({ speaker, turns }) => ({ label: t(speaker), value: String(turns) })),
  ];

  return (
    <div className="grid max-w-4xl gap-6">
      <div className="flex flex-wrap gap-x-10 gap-y-2 border-b pb-4">
        {facts.map((fact) => (
          <span key={fact.label}>
            <Eyebrow>{fact.label}</Eyebrow>
            <span className="mt-1 block font-mono text-sm tabular-nums">{fact.value}</span>
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {transcript.map((line) => (
          <div
            key={`${line.time}-${line.text.slice(0, 8)}`}
            className={cn(
              "grid gap-1 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:px-6",
              line.speaker === "Companion" && "border-s-4 border-s-primary/40 bg-muted/30",
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
              <time className="block font-mono text-2xs text-muted-foreground tabular-nums sm:mt-1">
                {line.time}
              </time>
            </div>
            <p className="leading-relaxed">{line.text}</p>
          </div>
        ))}
      </div>

      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {t("Nothing in the note may go beyond what is said here. Sections the conversation never covered stay marked as explicit gaps.")}
      </p>
    </div>
  );
}

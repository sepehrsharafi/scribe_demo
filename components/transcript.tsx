"use client";

import { RiVoiceprintLine } from "@remixicon/react";
import type { TranscriptLine } from "@/lib/demo-data";
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

/**
 * The consultation as it was spoken. Turns carry a speaker and a timestamp and
 * nothing else — separating doctor from patient is what the audio actually
 * supports, so the transcript does not pretend to know which part of the note
 * a turn belongs to.
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

  const doctorTurns = transcript.filter((line) => line.speaker === "Doctor").length;

  const facts = [
    { label: t("Length"), value: duration },
    { label: t("Turns"), value: String(transcript.length) },
    { label: t("Doctor / patient"), value: `${doctorTurns} / ${transcript.length - doctorTurns}` },
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
            className="grid gap-1 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4 sm:px-6"
          >
            <div className="flex items-baseline gap-3 sm:block">
              <span
                className={cn(
                  "font-mono text-2xs tracking-[0.12em] uppercase",
                  line.speaker === "Doctor" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t(line.speaker)}
              </span>
              <time className="block font-mono text-2xs text-muted-foreground tabular-nums sm:mt-1">
                {line.time}
              </time>
            </div>
            <p className="text-sm leading-relaxed">{line.text}</p>
          </div>
        ))}
      </div>

      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {t("Nothing in the note may go beyond what is said here. Sections the conversation never covered stay marked as explicit gaps.")}
      </p>
    </div>
  );
}

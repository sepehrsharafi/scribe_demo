"use client";

import { useMemo, useState } from "react";
import { RiVoiceprintLine } from "@remixicon/react";
import type { NoteSection, NoteSectionId, TranscriptLine } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/shared";

export function TranscriptTurn({
  line,
  sectionLabel,
  highlighted,
  compact,
}: {
  line: TranscriptLine;
  sectionLabel?: string;
  highlighted?: boolean;
  compact?: boolean;
}) {
  const isDoctor = line.speaker === "Doctor";
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-colors",
        highlighted
          ? "border-primary/40 bg-primary/5"
          : "border-transparent bg-muted/40",
        !compact && "p-4",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <strong
          className={cn(
            "font-mono text-2xs tracking-[0.1em] uppercase",
            isDoctor ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {line.speaker}
        </strong>
        <time className="font-mono text-2xs text-muted-foreground tabular-nums">
          {line.time}
        </time>
      </div>
      <p className={cn("mt-1.5 leading-relaxed", compact ? "text-xs" : "text-sm")}>
        {line.text}
      </p>
      {sectionLabel && !compact ? (
        <Badge variant="outline" className="mt-2.5 text-2xs font-normal">
          Evidence for {sectionLabel}
        </Badge>
      ) : null}
    </div>
  );
}

/** The narrow evidence rail that sits beside the note while it is being read. */
export function TranscriptRail({
  transcript,
  activeSection,
}: {
  transcript: TranscriptLine[];
  activeSection: NoteSectionId;
}) {
  return (
    <div className="grid gap-2">
      {transcript.map((line) => (
        <TranscriptTurn
          key={`${line.time}-${line.text.slice(0, 8)}`}
          line={line}
          highlighted={line.evidence === activeSection}
          compact
        />
      ))}
    </div>
  );
}

/** The full-width read of the consultation, filterable by the section it feeds. */
export function TranscriptView({
  transcript,
  note,
  duration,
}: {
  transcript: TranscriptLine[];
  note?: NoteSection[];
  duration: string;
}) {
  const [filter, setFilter] = useState<NoteSectionId | "all">("all");

  const labels = useMemo(() => {
    const map = new Map<NoteSectionId, string>();
    note?.forEach((section) => map.set(section.id, section.label));
    return map;
  }, [note]);

  const cited = useMemo(
    () =>
      (note ?? []).filter((section) =>
        transcript.some((line) => line.evidence === section.id),
      ),
    [note, transcript],
  );

  const visible =
    filter === "all" ? transcript : transcript.filter((line) => line.evidence === filter);

  const doctorTurns = transcript.filter((line) => line.speaker === "Doctor").length;

  if (!transcript.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiVoiceprintLine />
          </EmptyMedia>
          <EmptyTitle>No transcript yet</EmptyTitle>
          <EmptyDescription>
            The transcript appears once the audio has been uploaded and the speakers
            separated.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <Eyebrow>Length</Eyebrow>
            <span className="mt-1 block font-mono text-sm tabular-nums">{duration}</span>
          </span>
          <span>
            <Eyebrow>Turns</Eyebrow>
            <span className="mt-1 block font-mono text-sm tabular-nums">
              {transcript.length}
            </span>
          </span>
          <span>
            <Eyebrow>Doctor / patient</Eyebrow>
            <span className="mt-1 block font-mono text-sm tabular-nums">
              {doctorTurns} / {transcript.length - doctorTurns}
            </span>
          </span>
        </div>

        {cited.length ? (
          <ToggleGroup
            aria-label="Filter transcript by note section"
            variant="outline"
            spacing={0}
            value={[filter]}
            onValueChange={(next) => {
              if (next[0]) setFilter(next[0] as NoteSectionId | "all");
            }}
          >
            <ToggleGroupItem value="all" className="px-3">
              All
            </ToggleGroupItem>
            {cited.map((section) => (
              <ToggleGroupItem key={section.id} value={section.id} className="px-3">
                {section.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>

      <div className="grid max-w-3xl gap-3">
        {visible.map((line) => (
          <TranscriptTurn
            key={`${line.time}-${line.text.slice(0, 8)}`}
            line={line}
            sectionLabel={line.evidence ? labels.get(line.evidence) : undefined}
            highlighted={filter !== "all"}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Nothing in the note may go beyond what is said here. Sections the conversation
        never covered stay marked as explicit gaps.
      </p>
    </div>
  );
}

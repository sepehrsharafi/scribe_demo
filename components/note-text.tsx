"use client";

import { RiCheckLine, RiQuestionLine } from "@remixicon/react";
import type { ReactNode } from "react";
import type { NoteSection, Uncertain } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

/* The editable text and the highlight layer behind it must break lines in
   exactly the same places, so they share every metric. */
const metrics = "border border-transparent px-0 py-0 text-base leading-relaxed";

/** The flags whose phrase is still in the text. Editing a phrase away settles it. */
export function openFlags(section: NoteSection): Uncertain[] {
  return (section.uncertain ?? []).filter((flag) => section.body.includes(flag.text));
}

/** The body with each uncertain phrase wrapped in a mark, first occurrence only. */
function marked(body: string, flags: Uncertain[]) {
  const spans = flags
    .map((flag) => ({ start: body.indexOf(flag.text), end: body.indexOf(flag.text) + flag.text.length }))
    .filter((span) => span.start >= 0)
    .sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    parts.push(body.slice(cursor, span.start));
    parts.push(
      <mark
        key={span.start}
        className="rounded-sm bg-warning/20 text-transparent underline decoration-warning decoration-2 underline-offset-4 dark:bg-warning/25"
      >
        {body.slice(span.start, span.end)}
      </mark>,
    );
    cursor = span.end;
  }
  parts.push(body.slice(cursor));
  return parts;
}

/**
 * One prose section of the note, edited in place. Phrases Scribe was not sure
 * of are highlighted behind the text as you type, and listed underneath with
 * the reason, until the doctor marks them checked.
 */
export function SectionText({
  section,
  label,
  locked,
  onChange,
  onCheck,
}: {
  section: NoteSection;
  label: string;
  locked: boolean;
  onChange: (body: string) => void;
  onCheck: (text: string) => void;
}) {
  const { t } = useI18n();
  const flags = locked ? [] : openFlags(section);

  return (
    <>
      <div className="relative mt-2 max-w-prose">
        {flags.length ? (
          <div
            aria-hidden="true"
            className={cn(
              metrics,
              "pointer-events-none absolute inset-0 break-words whitespace-pre-wrap text-transparent",
            )}
          >
            {marked(section.body, flags)}
          </div>
        ) : null}
        {/* The shadcn textarea is field-sizing-content, so the box grows with
            the note and nothing has to measure heights by hand. */}
        <Textarea
          aria-label={label}
          value={section.body}
          readOnly={locked}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            metrics,
            "relative min-h-0 bg-transparent focus-visible:ring-0 dark:bg-transparent",
            locked && "cursor-default",
          )}
        />
      </div>

      {flags.length ? (
        <ul className="mt-4 grid max-w-prose gap-2">
          {flags.map((flag) => (
            <li
              key={flag.text}
              className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl bg-warning/10 px-3 py-2.5 dark:bg-warning/15"
            >
              <RiQuestionLine className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="min-w-0 flex-1 text-xs leading-relaxed">
                <span className="font-semibold">{t("Check “{phrase}”", { phrase: flag.text })}</span>
                <span className="block text-muted-foreground">{flag.reason}</span>
              </p>
              <Button variant="outline" size="xs" onClick={() => onCheck(flag.text)}>
                <RiCheckLine data-icon="inline-start" />
                {t("Mark as checked")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

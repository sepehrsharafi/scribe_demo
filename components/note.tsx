"use client";

import { RiArrowDownLine, RiErrorWarningLine, RiShieldCheckLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import type { WriteUp } from "@/components/use-write-up";
import { showNextUncertain, WriteUpDocument } from "@/components/write-up-editor";
import { useI18n } from "@/components/i18n-provider";

export function jumpTo(id: "medications") {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * The note: one document, laid out in sections, that the doctor edits like
 * any text — headings included. What Scribe was unsure of is highlighted in
 * place and explained beside it; an examination nobody did stays an explicit
 * gap. Approving signs it off and leaves it editable.
 */
export function Note({
  writeUp,
  manual,
}: {
  writeUp: WriteUp;
  /** Written by hand: there is no transcript for it to trace back to. */
  manual?: boolean;
}) {
  const { t } = useI18n();
  const { note, facts, approved } = writeUp;
  const toCheck = approved ? 0 : facts.unconfirmed + facts.uncertain;

  function showNext() {
    if (note && facts.uncertain && showNextUncertain(note)) return;
    jumpTo("medications");
  }

  return (
    <div className="min-w-0">
      {toCheck ? (
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-warning">
          <span className="flex items-center gap-2">
            <RiErrorWarningLine className="size-4 shrink-0" />
            {toCheck === 1
              ? t("1 thing to check before you approve — it is highlighted below.")
              : t("{count} things to check before you approve — they are highlighted below.", { count: toCheck })}
          </span>
          <Button variant="outline" size="xs" onClick={showNext}>
            <RiArrowDownLine data-icon="inline-start" />
            {t("Show me")}
          </Button>
        </p>
      ) : null}

      <WriteUpDocument editor={note} checks />

      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <RiShieldCheckLine className="size-4 shrink-0" />
        {manual
          ? t("Written by hand. There is no recording behind this visit.")
          : t("Every statement traces back to the transcript.")}
      </p>
    </div>
  );
}

"use client";

import {
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiShieldCheckLine,
  RiSparklingLine,
} from "@remixicon/react";
import { useState } from "react";
import type { NoteSection } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow } from "@/components/page-layout";
import { useI18n } from "@/components/i18n-provider";

type Proposal = {
  body: string;
  /** The instruction asked for something the transcript does not support. */
  refused: boolean;
};

const sentences = (body: string) =>
  body
    .split(/(?<=[.؟!])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

function propose(section: NoteSection, instruction: string): Proposal {
  const asksToInvent =
    /normal exam|examination was normal|add.*exam|clear lungs|chest is clear|invent|make up|assume|معاینه.*(طبیعی|نرمال)|ریه.*پاک|فرض کن/i.test(
      instruction,
    );

  if (asksToInvent && section.gap) {
    return { body: section.body, refused: true };
  }

  if (/action|bullet|list|structure|اقدام|فهرست|ساختار/i.test(instruction)) {
    return {
      body: sentences(section.body)
        .map((line) => `• ${line}`)
        .join("\n"),
      refused: false,
    };
  }

  if (/shorter|concise|tighten|trim|brief|خلاصه|کوتاه|مختصر/i.test(instruction)) {
    const lines = sentences(section.body);
    return {
      body: lines.slice(0, Math.max(1, Math.ceil(lines.length / 2))).join(" "),
      refused: false,
    };
  }

  // Anything else is treated as a correction and appended as a clean sentence.
  const addition = instruction
    .trim()
    .replace(/^(add|note|mention|say)\s+(that\s+)?/i, "")
    .replace(/^./, (character) => character.toUpperCase());

  return {
    body: `${section.body.replace(/\s+$/, "")} ${addition}${
      /[.!?]$/.test(addition) ? "" : "."
    }`,
    refused: false,
  };
}

const suggestions = [
  "Make this more concise",
  "Turn this into clear actions",
  "Record a normal examination",
];

/**
 * Ask Scribe to rewrite one section. The proposal is always shown before and
 * after, and an instruction the transcript cannot support is refused outright.
 */
export function Revise({
  section,
  label,
  onClose,
  onAccept,
}: {
  section: NoteSection;
  label: string;
  onClose: () => void;
  onAccept: (body: string) => void;
}) {
  const { t } = useI18n();
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  function generate() {
    if (!instruction.trim()) return;
    setGenerating(true);
    window.setTimeout(() => {
      setProposal(propose(section, instruction));
      setGenerating(false);
    }, 850);
  }

  return (
    <Card size="sm" className="mt-4 ring-primary/20">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2 font-mono text-2xs tracking-[0.12em] uppercase">
          <RiSparklingLine className="size-4" />
          {t("Revise · {section}", { section: label })}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label={t("Close assistant")}
        >
          <RiCloseLine />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {!proposal ? (
          <>
            <Textarea
              autoFocus
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder={t("Tell Scribe what to change in {section}…", {
                section: label.toLowerCase(),
              })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) generate();
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="xs"
                    onClick={() => setInstruction(t(suggestion))}
                  >
                    {t(suggestion)}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                disabled={!instruction.trim() || generating}
                onClick={generate}
              >
                {generating ? <Spinner data-icon="inline-start" /> : null}
                {t("Preview change")}
              </Button>
            </div>
            <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <RiShieldCheckLine className="mt-0.5 size-4 shrink-0" />
              {t("Only this section can change, and only using what was said. Anything the transcript does not support stays a visible gap.")}
            </p>
          </>
        ) : proposal.refused ? (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <strong className="text-sm font-semibold text-destructive">
                  {t("Scribe did not make that change")}
                </strong>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("No examination was discussed in this consultation, so there is nothing in the transcript to support it. The gap has been left as it is.")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{t("Section unchanged")}</span>
              <Button size="sm" variant="outline" onClick={onClose}>
                {t("Close")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <Eyebrow>{t("Current")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {section.body}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <Eyebrow className="text-primary">{t("Proposed")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                  {proposal.body}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setProposal(null)}>
                {t("Keep original")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onAccept(proposal.body);
                  onClose();
                }}
              >
                <RiCheckLine data-icon="inline-start" />
                {t("Accept change")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

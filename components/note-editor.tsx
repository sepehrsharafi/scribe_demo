"use client";

import {
  RiAddLine,
  RiArrowGoBackLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiLockLine,
  RiQuillPenLine,
  RiShieldCheckLine,
  RiSparklingLine,
} from "@remixicon/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  doctor,
  type NoteSection,
  type NoteSectionId,
  type NoteVersion,
  type TranscriptLine,
} from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/shared";
import { TranscriptRail } from "@/components/transcript-panel";

/* Replace the demo patient's first name so a freshly captured visit reads correctly. */
export function personalise(note: NoteSection[], firstName: string): NoteSection[] {
  if (firstName === "Maya") return note;
  return note.map((section) => ({
    ...section,
    body: section.body.replace(/\bMaya\b/g, firstName).replace(/\bShe\b/g, "They"),
  }));
}

function nextTime(current: NoteVersion[]) {
  const last = current[current.length - 1]?.time ?? "09:38";
  const [h, m] = last.split(":").map(Number);
  const total = h * 60 + m + 2;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ State */

/**
 * The note, its edit history and its version chain. The consultation page owns
 * this so the header, the Note tab and the Activity tab all read one truth.
 */
export function useNoteState({
  note: initialNote,
  versions: initialVersions,
  signed: initialSigned,
}: {
  note: NoteSection[];
  versions: NoteVersion[];
  signed: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const [history, setHistory] = useState<NoteSection[][]>([]);
  const [versions, setVersions] = useState(initialVersions);
  const [active, setActive] = useState<NoteSectionId>(initialNote[0]?.id ?? "reason");
  const [signed, setSigned] = useState(initialSigned);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const edit = useCallback((id: NoteSectionId, body: string) => {
    setNote((current) =>
      current.map((section) => (section.id === id ? { ...section, body } : section)),
    );
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 600);
  }, []);

  const commitEdit = useCallback(() => {
    setHistory((currentHistory) => {
      const last = currentHistory[currentHistory.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(note)) return currentHistory;
      setVersions((current) => [
        ...current,
        {
          id: current.length + 1,
          label: "Manual edit",
          author: "You",
          time: nextTime(current),
          kind: "manual",
        },
      ]);
      return [...currentHistory, note];
    });
  }, [note]);

  const acceptProposal = useCallback(
    (proposal: Proposal) => {
      setHistory((current) => [...current, note]);
      setNote((current) =>
        current.map((section) =>
          section.id === proposal.sectionId
            ? { ...section, body: proposal.after, gap: false }
            : section,
        ),
      );
      setVersions((current) => [
        ...current,
        {
          id: current.length + 1,
          label: "AI revision accepted",
          author: "Cima",
          time: nextTime(current),
          kind: "ai",
        },
      ]);
      toast.success("Revision accepted — undo is available");
    },
    [note],
  );

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.length) return current;
      setNote(current[current.length - 1]);
      setVersions((list) => list.slice(0, -1));
      toast("Stepped back one version");
      return current.slice(0, -1);
    });
  }, []);

  const sign = useCallback(() => {
    setSigned(true);
    setVersions((current) => [
      ...current,
      {
        id: current.length + 1,
        label: "Signed and locked",
        author: doctor.name,
        time: nextTime(current),
        kind: "signature",
      },
    ]);
    toast.success("Note signed and locked");
  }, []);

  const addAddendum = useCallback(() => {
    setVersions((current) => [
      ...current,
      {
        id: current.length + 1,
        label: "Addendum added",
        author: doctor.name,
        time: nextTime(current),
        kind: "manual",
      },
    ]);
    toast.success("Addendum saved alongside the signed note");
  }, []);

  return {
    note,
    versions,
    active,
    setActive,
    signed,
    saving,
    canUndo: history.length > 0,
    edit,
    commitEdit,
    acceptProposal,
    undo,
    sign,
    addAddendum,
  };
}

export type NoteState = ReturnType<typeof useNoteState>;

/* --------------------------------------------------------------- Revision */

type Proposal = {
  sectionId: NoteSectionId;
  before: string;
  after: string;
  /** The instruction asked for something the transcript does not support. */
  refused: boolean;
};

function buildProposal(section: NoteSection, instruction: string): Proposal {
  const asksToInvent =
    /normal exam|examination was normal|add.*exam|clear lungs|chest is clear|invent|make up|assume/i.test(
      instruction,
    );

  if (asksToInvent && section.gap) {
    return {
      sectionId: section.id,
      before: section.body,
      after: section.body,
      refused: true,
    };
  }

  if (/action|bullet|list|structure/i.test(instruction)) {
    const sentences = section.body
      .split(/(?<=\.)\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      sectionId: section.id,
      before: section.body,
      after: sentences.map((line) => `• ${line}`).join("\n"),
      refused: false,
    };
  }

  if (/shorter|concise|tighten|trim|brief/i.test(instruction)) {
    const sentences = section.body.split(/(?<=\.)\s+/).filter(Boolean);
    return {
      sectionId: section.id,
      before: section.body,
      after: sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" "),
      refused: false,
    };
  }

  // Anything else is treated as a correction and appended as a clean sentence.
  const addition = instruction
    .trim()
    .replace(/^(add|note|mention|say)\s+(that\s+)?/i, "")
    .replace(/^./, (character) => character.toUpperCase());

  return {
    sectionId: section.id,
    before: section.body,
    after: `${section.body.replace(/\s+$/, "")} ${addition}${
      /[.!?]$/.test(addition) ? "" : "."
    }`,
    refused: false,
  };
}

const assistSuggestions = [
  "Make this more concise",
  "Turn this into clear actions",
  "Record a normal examination",
];

function Assist({
  section,
  onClose,
  onAccept,
}: {
  section: NoteSection;
  onClose: () => void;
  onAccept: (proposal: Proposal) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  function generate(text: string) {
    if (!text.trim()) return;
    setGenerating(true);
    window.setTimeout(() => {
      setProposal(buildProposal(section, text));
      setGenerating(false);
    }, 850);
  }

  return (
    <Card size="sm" className="mt-4 ring-primary/20">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2 font-mono text-2xs tracking-[0.12em] uppercase">
          <RiSparklingLine className="size-3.5" />
          Revise · {section.label}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Close assistant"
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
              placeholder={`Tell Cima what to change in ${section.label.toLowerCase()}…`}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  generate(instruction);
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {assistSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="xs"
                    onClick={() => setInstruction(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                disabled={!instruction.trim() || generating}
                onClick={() => generate(instruction)}
              >
                {generating ? <Spinner data-icon="inline-start" /> : null}
                Preview change
              </Button>
            </div>
            <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <RiShieldCheckLine className="mt-0.5 size-3.5 shrink-0" />
              Only this section can change, and only using what was said. Anything the
              transcript does not support stays a visible gap.
            </p>
          </>
        ) : proposal.refused ? (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <strong className="text-sm font-semibold text-destructive">
                  Cima did not make that change
                </strong>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  No examination was discussed in this consultation, so there is nothing in
                  the transcript to support it. The gap has been left as it is.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Section unchanged</span>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <Eyebrow>Current</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {proposal.before}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <Eyebrow className="text-primary">Proposed</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                  {proposal.after}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setProposal(null)}>
                Keep original
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onAccept(proposal);
                  onClose();
                }}
              >
                <RiCheckLine data-icon="inline-start" />
                Accept change
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------- Sections */

function AutoTextarea({
  value,
  onChange,
  onCommit,
  readOnly,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
  readOnly?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    // `field-sizing: content` already grows the box, and keeps growing it when
    // the web font lands or the column reflows. Only measure by hand without it.
    if (!node || CSS.supports("field-sizing", "content")) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      aria-label={label}
      value={value}
      readOnly={readOnly}
      rows={1}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      className={cn(
        "min-h-0 bg-transparent px-0 py-0 text-base leading-relaxed focus-visible:ring-0",
        readOnly && "cursor-default",
      )}
    />
  );
}

export function SectionOutline({ state }: { state: NoteState }) {
  return (
    <nav className="grid">
      {state.note.map((section, index) => (
        <button
          key={section.id}
          onClick={() => state.setActive(section.id)}
          className={cn(
            "flex items-center gap-2 border-l-2 py-2 pl-3 text-left text-sm transition-colors",
            state.active === section.id
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="font-mono text-2xs tabular-nums opacity-60">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 truncate">{section.label}</span>
          {section.gap ? (
            <span
              title="Explicit gap"
              aria-label="Explicit gap"
              className="size-1.5 shrink-0 rounded-full bg-warning"
            />
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function NoteBody({
  state,
  transcript,
  showEvidence,
  signedAt,
}: {
  state: NoteState;
  transcript: TranscriptLine[];
  showEvidence: boolean;
  signedAt?: string;
}) {
  const [assistFor, setAssistFor] = useState<NoteSectionId | null>(null);
  const [addendum, setAddendum] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "grid gap-8",
        showEvidence
          ? "xl:grid-cols-[minmax(0,1fr)_20rem]"
          : "lg:grid-cols-[minmax(0,1fr)]",
      )}
    >
      <div className="min-w-0">
        {state.signed ? (
          <div className="mb-2 flex gap-3 rounded-2xl border bg-muted/50 p-4">
            <RiLockLine className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <strong className="text-sm font-semibold">Signed by {doctor.name}</strong>
              <p className="mt-1 text-xs text-muted-foreground">
                {signedAt ?? "Just now"} · read-only. Corrections are added as an addendum.
              </p>
            </div>
          </div>
        ) : null}

        {state.note.map((section, index) => (
          <article
            key={section.id}
            onClick={() => state.setActive(section.id)}
            className={cn(
              "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b py-6 transition-colors",
              state.active === section.id ? "bg-muted/30" : "hover:bg-muted/20",
            )}
          >
            <span className="pt-1 font-mono text-2xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {section.label}
                </h3>
                {!state.signed ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      state.setActive(section.id);
                      setAssistFor(assistFor === section.id ? null : section.id);
                    }}
                  >
                    <RiSparklingLine data-icon="inline-start" />
                    Ask Cima
                  </Button>
                ) : null}
              </div>

              <div className="mt-2 max-w-prose">
                <AutoTextarea
                  label={section.label}
                  value={section.body}
                  readOnly={state.signed}
                  onChange={(value) => state.edit(section.id, value)}
                  onCommit={state.commitEdit}
                />
              </div>

              {section.gap ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-2 py-1 text-2xs text-warning">
                  <RiErrorWarningLine className="size-3" />
                  Explicit gap — nothing was added beyond the transcript
                </span>
              ) : null}

              {!state.signed && assistFor === section.id ? (
                <Assist
                  section={section}
                  onClose={() => setAssistFor(null)}
                  onAccept={state.acceptProposal}
                />
              ) : null}
            </div>
          </article>
        ))}

        {state.signed ? (
          <div className="py-6">
            {addendum === null ? (
              <Button variant="outline" size="sm" onClick={() => setAddendum("")}>
                <RiAddLine data-icon="inline-start" />
                Add an addendum
              </Button>
            ) : (
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                <span className="pt-1 font-mono text-2xs text-muted-foreground">+</span>
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-semibold tracking-tight">
                    Addendum
                  </h3>
                  <Textarea
                    autoFocus
                    value={addendum}
                    onChange={(event) => setAddendum(event.target.value)}
                    className="mt-3 max-w-prose"
                    placeholder="Add a correction or a later observation. The signed note above stays unchanged."
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Stored separately from the signed record
                    </span>
                    <span className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAddendum(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!addendum.trim()}
                        onClick={() => {
                          state.addAddendum();
                          setAddendum(null);
                        }}
                      >
                        Save addendum
                      </Button>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <p className="flex items-center gap-2 py-5 text-xs text-muted-foreground">
          <RiShieldCheckLine className="size-3.5" />
          Every statement traces back to the consultation transcript.
        </p>
      </div>

      {showEvidence ? (
        <aside className="min-w-0">
          <Card size="sm" className="sticky top-32">
            <CardHeader className="border-b">
              <CardTitle className="font-mono text-2xs tracking-[0.14em] uppercase">
                Evidence · {state.note.find((s) => s.id === state.active)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[55vh] pr-3">
                <TranscriptRail transcript={transcript} activeSection={state.active} />
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Signing */

export function SignDialog({
  open,
  onOpenChange,
  sections,
  versionCount,
  onSign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: number;
  versionCount: number;
  onSign: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <RiLockLine className="size-5" />
          </span>
          <Eyebrow>Final step</Eyebrow>
          <DialogTitle>Sign and lock this note?</DialogTitle>
          <DialogDescription>
            This version becomes the clinical record. It cannot be overwritten — any later
            correction is stored as an addendum, and the version chain behind it is kept.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-0 rounded-2xl border px-4">
          {[
            { label: "Sections reviewed", value: sections },
            { label: "Versions retained", value: versionCount },
            { label: "Signing as", value: doctor.name },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0"
            >
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-xs font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Review again
          </Button>
          <Button
            onClick={() => {
              onSign();
              onOpenChange(false);
            }}
          >
            <RiQuillPenLine data-icon="inline-start" />
            Sign note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- Versions */

export function VersionList({ versions }: { versions: NoteVersion[] }) {
  return (
    <div className="grid gap-3">
      {versions
        .slice()
        .reverse()
        .map((version) => (
          <div key={version.id} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                version.kind === "signature"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {version.kind === "ai" ? (
                <RiSparklingLine className="size-2.5" />
              ) : version.kind === "signature" ? (
                <RiLockLine className="size-2.5" />
              ) : (
                <RiQuillPenLine className="size-2.5" />
              )}
            </span>
            <div className="min-w-0">
              <strong className="block text-xs font-medium">{version.label}</strong>
              <span className="text-2xs text-muted-foreground">
                {version.author} · {version.time}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Toolbar */

export function NoteToolbar({
  state,
  showEvidence,
  onToggleEvidence,
  onSign,
}: {
  state: NoteState;
  showEvidence: boolean;
  onToggleEvidence: () => void;
  onSign: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!state.signed ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              state.saving ? "animate-pulse bg-warning" : "bg-primary",
            )}
          />
          {state.saving ? "Saving" : "Saved"}
        </span>
      ) : (
        <Badge className="gap-1.5 bg-primary/10 px-2 text-primary dark:bg-primary/20">
          <RiLockLine className="size-3" />
          Signed &amp; locked
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleEvidence}
        aria-pressed={showEvidence}
      >
        <RiShieldCheckLine data-icon="inline-start" />
        {showEvidence ? "Hide evidence" : "Show evidence"}
      </Button>

      {!state.signed ? (
        <>
          <Button variant="ghost" size="sm" onClick={state.undo} disabled={!state.canUndo}>
            <RiArrowGoBackLine data-icon="inline-start" />
            Undo
          </Button>
          <Button size="sm" onClick={onSign}>
            <RiQuillPenLine data-icon="inline-start" />
            Sign note
          </Button>
        </>
      ) : null}
    </div>
  );
}

import type { JSONContent } from "@tiptap/core";
import {
  instructionLabels,
  noteOrder,
  sectionLabels,
  type Instructions,
  type Medication,
  type Note as NoteRecord,
  type NoteSectionId,
  type Triage,
  type Uncertain,
} from "@/lib/demo-data";
import type { Translate } from "@/lib/i18n/translate";

/*
 * A visit's write-up as the doctor edits it: two documents, the note and the
 * patient's instructions. The model's draft arrives as structured data —
 * sections, a medication table, triage — and is laid out here once, as
 * headings and paragraphs the doctor can change like any other text. The
 * parts that are data, not prose, stay data inside the document: the
 * medication table and the vitals are blocks whose rows live in the document
 * itself, so undo, redo and deleting them behave like everything else.
 */

/** The sections a draft shows, in reading order. Anything left out had nothing in it. */
export function visibleSections(note: NoteRecord): NoteSectionId[] {
  return noteOrder.filter((id) =>
    id === "medications"
      ? note.medications.length > 0
      : note.sections.some((section) => section.id === id),
  );
}

/** A run of text, with each uncertain phrase in it marked — the first time it appears. */
function inline(text: string, flags: Uncertain[], used: Set<string>): JSONContent[] {
  const spans = flags
    .filter((flag) => !used.has(flag.text))
    .map((flag) => ({ flag, start: text.indexOf(flag.text) }))
    .filter((span) => span.start >= 0)
    .sort((a, b) => a.start - b.start);

  const parts: JSONContent[] = [];
  let cursor = 0;
  for (const { flag, start } of spans) {
    if (start < cursor) continue;
    if (start > cursor) parts.push({ type: "text", text: text.slice(cursor, start) });
    parts.push({ type: "text", text: flag.text, marks: [{ type: "uncertain", attrs: { reason: flag.reason } }] });
    used.add(flag.text);
    cursor = start + flag.text.length;
  }
  if (cursor < text.length) parts.push({ type: "text", text: text.slice(cursor) });
  return parts;
}

const paragraph = (content: JSONContent[] = []): JSONContent =>
  content.length ? { type: "paragraph", content } : { type: "paragraph" };

const heading = (level: 2 | 3, text: string): JSONContent => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

/** Prose as the draft writes it: paragraphs, with "• " lines gathered into a list. */
function blocks(body: string, flags: Uncertain[] = []): JSONContent[] {
  const used = new Set<string>();
  const out: JSONContent[] = [];
  for (const line of body.split("\n").map((item) => item.trim()).filter(Boolean)) {
    const bullet = line.startsWith("•");
    const content = inline(bullet ? line.replace(/^•\s*/, "") : line, flags, used);
    if (!bullet) {
      out.push(paragraph(content));
      continue;
    }
    const item: JSONContent = { type: "listItem", content: [paragraph(content)] };
    const last = out[out.length - 1];
    if (last?.type === "bulletList") last.content!.push(item);
    else out.push({ type: "bulletList", content: [item] });
  }
  return out.length ? out : [paragraph()];
}

/** The note, laid out as a document the doctor edits in place. */
export function noteDocument(note: NoteRecord, t: Translate, manual = false): JSONContent {
  const content: JSONContent[] = [];

  for (const id of visibleSections(note)) {
    content.push(heading(2, t(sectionLabels[id])));
    if (id === "medications") {
      content.push({ type: "medications", attrs: { rows: note.medications } });
      continue;
    }
    if (id === "examination" && note.triage) content.push({ type: "triage", attrs: { ...note.triage } });
    const section = note.sections.find((item) => item.id === id);
    content.push(...blocks(section?.body ?? "", section?.uncertain));
    // Only an examination can be an explicit gap: the one thing a note must never invent.
    if (id === "examination" && section?.gap) content.push({ type: "gap", attrs: { manual } });
  }

  return { type: "doc", content };
}

/** The patient's copy: a short letter, in their words, with their medicines read live from the note. */
export function handoutDocument({
  instructions,
  firstName,
  doctor,
  medicines,
  t,
}: {
  instructions: Instructions;
  firstName: string;
  doctor: string;
  /** Whether the note has a medication table for the letter to read from. */
  medicines: boolean;
  t: Translate;
}): JSONContent {
  const part = (label: string, body: string) => [heading(3, t(label)), ...blocks(body)];

  return {
    type: "doc",
    content: [
      heading(2, t("After your visit")),
      paragraph([
        {
          type: "text",
          text: t("Dear {name}, thank you for coming in today. This is what we found, and what happens next.", {
            name: firstName,
          }),
        },
      ]),
      ...part(instructionLabels.summary, instructions.summary),
      ...part(instructionLabels.steps, instructions.steps),
      ...(medicines ? [heading(3, t("Your medicines")), { type: "medicines" }] : []),
      ...part(instructionLabels.followUp, instructions.followUp),
      ...part(instructionLabels.warning, instructions.warning),
      paragraph([
        { type: "text", text: t("With best wishes,") },
        { type: "hardBreak" },
        { type: "text", text: doctor },
      ]),
    ],
  };
}

/** What the rest of the visit needs to know about a note while it is being edited. */
export type NoteFacts = {
  /** Phrases still marked uncertain. */
  uncertain: number;
  /** Medication rows nobody has confirmed. Approval waits for these. */
  unconfirmed: number;
  /** Every row of every medication table, for the patient's copy. */
  medications: Medication[];
  /** Whether there is a table at all, so the toolbar knows it can offer one. */
  hasMedications: boolean;
  hasTriage: boolean;
  /** Anything written beyond the headings. */
  written: boolean;
};

/** Reads the facts off a note document. Cheap enough to run on every keystroke. */
export function noteFacts(doc: JSONContent): NoteFacts {
  const facts: NoteFacts = {
    uncertain: 0,
    unconfirmed: 0,
    medications: [],
    hasMedications: false,
    hasTriage: false,
    written: false,
  };

  const walk = (node: JSONContent, inHeading: boolean) => {
    if (node.type === "medications") {
      const rows = (node.attrs?.rows ?? []) as Medication[];
      facts.hasMedications = true;
      facts.medications.push(...rows);
      facts.unconfirmed += rows.filter((row) => row.unconfirmed).length;
      if (rows.length) facts.written = true;
    }
    if (node.type === "triage") facts.hasTriage = true;
    if (node.type === "text") {
      if (!inHeading && node.text?.trim()) facts.written = true;
      if (node.marks?.some((mark) => mark.type === "uncertain")) facts.uncertain += 1;
    }
    node.content?.forEach((child) => walk(child, inHeading || node.type === "heading"));
  };
  walk(doc, false);

  return facts;
}

export const sameFacts = (a: NoteFacts, b: NoteFacts) =>
  a.uncertain === b.uncertain &&
  a.unconfirmed === b.unconfirmed &&
  a.hasMedications === b.hasMedications &&
  a.hasTriage === b.hasTriage &&
  a.written === b.written &&
  JSON.stringify(a.medications) === JSON.stringify(b.medications);

/** Nothing but uncertain marks taken off: what approving does to what was left to check. */
export function withoutUncertain(doc: JSONContent): JSONContent {
  return {
    ...doc,
    ...(doc.marks ? { marks: doc.marks.filter((mark) => mark.type !== "uncertain") } : {}),
    ...(doc.content ? { content: doc.content.map(withoutUncertain) } : {}),
  };
}

export const emptyTriage: Triage = { complaint: "", bp: "", hr: "", temp: "", spo2: "", weight: "" };

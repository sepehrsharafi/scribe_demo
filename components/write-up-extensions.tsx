"use client";

import { Mark, mergeAttributes, Node, type Extensions } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { RiCapsuleLine, RiErrorWarningLine } from "@remixicon/react";
import { createContext, use, type ComponentType } from "react";
import type { Medication, Triage } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";
import { MedicationTable } from "@/components/note-medications";
import { TriageBlock } from "@/components/note-triage";
import { useI18n } from "@/components/i18n-provider";

/** What the patient's copy reads from the note while both are open. */
export const NoteMedicationsContext = createContext<Medication[]>([]);

/**
 * A phrase Scribe heard but could not be sure of. It is highlighted until the
 * doctor has looked at it; the reason travels with it.
 */
const UncertainMark = Mark.create({
  name: "uncertain",
  // Typing at its edge writes plain text, so a correction never inherits the doubt.
  inclusive: false,
  addAttributes() {
    return {
      reason: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-reason") ?? "",
        renderHTML: (attributes) => ({ "data-reason": attributes.reason }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark[data-uncertain]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(HTMLAttributes, {
        "data-uncertain": "",
        class:
          "cursor-help rounded-sm bg-warning/20 text-inherit underline decoration-warning decoration-2 underline-offset-4 dark:bg-warning/25",
      }),
      0,
    ];
  },
});

/** A block whose content is data held in its attributes, drawn by a React view. */
function dataBlock(name: string, view: ComponentType<ReactNodeViewProps>, attributes: Record<string, unknown>) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
      return Object.fromEntries(
        Object.entries(attributes).map(([key, fallback]) => [
          key,
          {
            default: fallback,
            parseHTML: (element: HTMLElement) => {
              const raw = element.getAttribute(`data-${key}`);
              return raw === null ? fallback : JSON.parse(raw);
            },
            renderHTML: (values: Record<string, unknown>) => ({ [`data-${key}`]: JSON.stringify(values[key]) }),
          },
        ]),
      );
    },
    parseHTML() {
      return [{ tag: `div[data-block="${name}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-block": name })];
    },
    addNodeView() {
      return ReactNodeViewRenderer(view);
    },
  });
}

/* A selected block is outlined, so the doctor can see what Backspace would take out. */
const selectedRing = "rounded-xl outline-offset-4 data-[selected=true]:outline-2 data-[selected=true]:outline-ring";

function MedicationsView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper
      id="section-medications"
      contentEditable={false}
      data-selected={selected}
      className={`my-3 scroll-mt-40 ${selectedRing}`}
    >
      <MedicationTable rows={node.attrs.rows as Medication[]} onChange={(rows) => updateAttributes({ rows })} />
    </NodeViewWrapper>
  );
}

function TriageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper contentEditable={false} data-selected={selected} className={`my-3 ${selectedRing}`}>
      <TriageBlock
        triage={node.attrs as Triage}
        onChange={(field, value) => updateAttributes({ [field]: value })}
      />
    </NodeViewWrapper>
  );
}

function GapView({ node, selected }: ReactNodeViewProps) {
  const { t } = useI18n();
  return (
    <NodeViewWrapper contentEditable={false} data-selected={selected} className={`my-2 ${selectedRing}`}>
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
        <RiErrorWarningLine className="size-4 shrink-0" />
        {node.attrs.manual
          ? t("Explicit gap — this section was left empty")
          : t("Explicit gap — nothing was added beyond the transcript")}
      </span>
    </NodeViewWrapper>
  );
}

/** The patient's medicines, read straight from the note: a correction there is a correction here. */
function MedicinesView({ selected }: ReactNodeViewProps) {
  const { t } = useI18n();
  const rows = use(NoteMedicationsContext);

  return (
    <NodeViewWrapper contentEditable={false} data-selected={selected} className={`my-3 ${selectedRing}`}>
      {rows.length ? (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-3">
              <RiCapsuleLine className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 leading-relaxed">
                <strong className="font-semibold">{row.drug || t("Unnamed medicine")}</strong>
                {[row.dose, row.frequency, row.duration].some(Boolean) ? (
                  <span className="text-muted-foreground">
                    {" — "}
                    {[row.dose, row.frequency, row.duration].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                {row.unconfirmed ? (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-warning">
                    <RiErrorWarningLine className="size-3.5 shrink-0" />
                    {t("To be confirmed in the note before this goes to the patient.")}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t("No medicines were started or changed at this visit.")}</p>
      )}
      <p className="mt-2 font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
        {t("From the note’s medication table")}
      </p>
    </NodeViewWrapper>
  );
}

const Medications = dataBlock("medications", MedicationsView, { rows: [] });
const TriageNode = dataBlock("triage", TriageView, { complaint: "", bp: "", hr: "", temp: "", spo2: "", weight: "" });
const Gap = dataBlock("gap", GapView, { manual: false });
const Medicines = dataBlock("medicines", MedicinesView, {});

function base(locale: Locale): Extensions {
  const t = translate(locale);
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      code: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      link: false,
    }),
    Placeholder.configure({
      showOnlyCurrent: false,
      placeholder: ({ node }) => (node.type.name === "heading" ? t("Heading") : t("Write here…")),
    }),
  ];
}

/*
 * Extensions must keep their identity from render to render, or the editor
 * reconfigures itself on every keystroke — so they are built once per
 * language, here, and not inside a component.
 */
const built = new Map<string, Extensions>();

function once(key: string, make: () => Extensions) {
  if (!built.has(key)) built.set(key, make());
  return built.get(key)!;
}

export const noteExtensions = (locale: Locale) =>
  once(`note:${locale}`, () => [...base(locale), UncertainMark, Medications, TriageNode, Gap]);

export const handoutExtensions = (locale: Locale) => once(`handout:${locale}`, () => [...base(locale), Medicines]);

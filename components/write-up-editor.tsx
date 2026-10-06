"use client";

import { EditorContent, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  RiAddLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiCheckLine,
  RiH2,
  RiH3,
  RiItalic,
  RiListOrdered2,
  RiListUnordered,
  RiPulseLine,
  RiQuestionLine,
  RiTableLine,
  RiUnderline,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { triageAttrs, type NoteFacts } from "@/components/write-up-document";
import { useI18n } from "@/components/i18n-provider";

/*
 * How a write-up reads: one run of text, one measure of spacing. Set once here
 * and handed to the editor, so whatever the doctor types — a new heading, a
 * list — takes the same form as the draft did.
 */
export const documentClass = [
  "min-h-48 text-sm leading-7 text-foreground outline-none",
  "[&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold",
  "[&_h3]:mt-6 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold",
  "[&>:first-child]:mt-0 [&>ol]:my-3 [&>p]:my-3 [&>ul]:my-3 [&_strong]:font-semibold",
  "[&_ol]:list-describe_demol [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6 [&_li]:my-1 [&_li]:ps-1 [&_li]:marker:text-muted-foreground",
  // An empty line says what it is for.
  "[&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-start [&_.is-empty]:before:h-0 [&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:content-[attr(data-placeholder)]",
].join(" ");

/** Where the doctor looks next among the phrases still to check: after the cursor, or back at the top. */
export function showNextUncertain(editor: Editor) {
  const found: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.marks.some((mark) => mark.type.name === "uncertain")) found.push(pos);
  });
  if (!found.length) return false;
  const next = found.find((pos) => pos > editor.state.selection.from) ?? found[0];
  editor
    .chain()
    .focus()
    .setTextSelection(next + 1)
    .scrollIntoView()
    .run();
  return true;
}

/** The reason Scribe was unsure, beside the phrase, for as long as the cursor is in it. */
function UncertainBubble({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const reason = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current.isActive("uncertain") ? String(current.getAttributes("uncertain").reason ?? "") : "",
  });

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="uncertain"
      shouldShow={({ editor: current }) => current.isEditable && current.isActive("uncertain")}
      options={{ placement: "bottom-start", offset: 10 }}
      className="z-30 grid w-80 max-w-[calc(100vw-2rem)] gap-3 rounded-xl border bg-popover p-3.5 text-popover-foreground shadow-lg"
    >
      <p className="flex gap-2.5 text-xs leading-relaxed">
        <RiQuestionLine className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          <span className="block font-medium">{t("Scribe was not sure of this")}</span>
          <span className="text-muted-foreground">{reason}</span>
        </span>
      </p>
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t("Change the words, or keep them.")}</span>
        <Button
          size="xs"
          variant="outline"
          onClick={() => editor.chain().focus().extendMarkRange("uncertain").unsetMark("uncertain").run()}
        >
          <RiCheckLine data-icon="inline-start" />
          {t("Mark as checked")}
        </Button>
      </span>
    </BubbleMenu>
  );
}

/** A write-up, as an editor. Until the editor exists (a server render), its shape holds the place. */
export function WriteUpDocument({ editor, checks = false }: { editor: Editor | null; checks?: boolean }) {
  return (
    <div className="relative min-w-0">
      {editor ? null : (
        <div aria-busy="true" className="grid gap-3">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-11/12 rounded-md" />
          <Skeleton className="mt-6 h-5 w-40 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      )}
      <EditorContent editor={editor} />
      {editor && checks ? <UncertainBubble editor={editor} /> : null}
    </div>
  );
}

/**
 * The few tools a clinical write-up needs, and nothing a word processor adds
 * for its own sake: undo, emphasis, headings, lists — and, in the note, the
 * two blocks that are data rather than prose. Markdown habits work as well:
 * "## " starts a heading, "- " a list.
 */
export function EditorToolbar({
  editor,
  saving,
  facts,
}: {
  editor: Editor | null;
  saving: boolean;
  /** Given for the note: which data blocks it has, so the rest can be inserted. */
  facts?: NoteFacts;
}) {
  const { t } = useI18n();
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            undo: current.can().undo(),
            redo: current.can().redo(),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bullets: current.isActive("bulletList"),
            numbers: current.isActive("orderedList"),
          }
        : null,
  });

  const run = (command: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    if (editor) command(editor.chain().focus()).run();
  };

  const marks = [
    { key: "bold", label: "Bold", icon: RiBold, toggle: () => run((chain) => chain.toggleBold()) },
    { key: "italic", label: "Italic", icon: RiItalic, toggle: () => run((chain) => chain.toggleItalic()) },
    { key: "underline", label: "Underline", icon: RiUnderline, toggle: () => run((chain) => chain.toggleUnderline()) },
  ] as const;

  const blocks = [
    { key: "h2", label: "Heading", icon: RiH2, toggle: () => run((chain) => chain.toggleHeading({ level: 2 })) },
    { key: "h3", label: "Subheading", icon: RiH3, toggle: () => run((chain) => chain.toggleHeading({ level: 3 })) },
    {
      key: "bullets",
      label: "Bulleted list",
      icon: RiListUnordered,
      toggle: () => run((chain) => chain.toggleBulletList()),
    },
    {
      key: "numbers",
      label: "Numbered list",
      icon: RiListOrdered2,
      toggle: () => run((chain) => chain.toggleOrderedList()),
    },
  ] as const;

  const insertable = facts
    ? [
        ...(facts.hasMedications
          ? []
          : [{ label: "Medication table", icon: RiTableLine, content: { type: "medications", attrs: { rows: [] } } }]),
        ...(facts.hasTriage
          ? []
          : [{ label: "Triage and vitals", icon: RiPulseLine, content: { type: "triage", attrs: triageAttrs(t) } }]),
      ]
    : [];

  return (
    // The buttons scroll sideways where the row is short of room; whether it is saved never scrolls away.
    <div role="toolbar" aria-label={t("Formatting")} className="flex min-w-0 items-center gap-3">
      <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-lg border bg-background p-0.5 shadow-xs [scrollbar-width:none]">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!state?.undo}
          onClick={() => run((chain) => chain.undo())}
          aria-label={t("Undo")}
          title={t("Undo")}
        >
          <RiArrowGoBackLine className="rtl:-scale-x-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!state?.redo}
          onClick={() => run((chain) => chain.redo())}
          aria-label={t("Redo")}
          title={t("Redo")}
        >
          <RiArrowGoForwardLine className="rtl:-scale-x-100" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        {marks.map(({ key, label, icon: Icon, toggle }) => (
          <Toggle
            key={key}
            size="sm"
            className="px-0"
            pressed={Boolean(state?.[key])}
            onPressedChange={toggle}
            disabled={!editor}
            aria-label={t(label)}
            title={t(label)}
          >
            <Icon />
          </Toggle>
        ))}
        <Separator orientation="vertical" className="mx-1 h-5" />
        {blocks.map(({ key, label, icon: Icon, toggle }) => (
          <Toggle
            key={key}
            size="sm"
            className="px-0"
            pressed={Boolean(state?.[key])}
            onPressedChange={toggle}
            disabled={!editor}
            aria-label={t(label)}
            title={t(label)}
          >
            <Icon />
          </Toggle>
        ))}
        {insertable.length ? (
          <>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={!editor} />}>
                <RiAddLine data-icon="inline-start" />
                <span className="max-sm:sr-only">{t("Insert")}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto">
                {insertable.map(({ label, icon: Icon, content }) => (
                  <DropdownMenuItem key={label} onClick={() => run((chain) => chain.insertContent(content))}>
                    <Icon />
                    {t(label)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>
      <span
        className="ms-auto inline-flex min-w-18 shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full transition-colors", saving ? "animate-pulse bg-warning" : "bg-primary")}
        />
        {saving ? t("Saving…") : t("Saved")}
      </span>
    </div>
  );
}

"use client";

import { useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { handoutExtensions, noteExtensions } from "@/components/write-up-extensions";
import { noteFacts, sameFacts, type NoteFacts } from "@/components/write-up-document";
import { useVisitExtras, type WriteUpDocs } from "@/components/visit-extras";
import { useI18n } from "@/components/i18n-provider";
import { documentClass, numberedClass } from "@/components/write-up-editor";

/** Pause after the last keystroke before the edit is written to the visit. */
const settle = 600;

const approving = "approving";

const noSubscription = () => () => {};

export type WriteUp = ReturnType<typeof useWriteUp>;

/**
 * One visit's write-up — the note and the patient's instructions — as two
 * documents the doctor edits like any text. Every edit is kept: it is written
 * to the visit a moment after the doctor stops typing, and stays with the
 * visit for the session, wherever they go in between. Undo and redo are the
 * editor's own.
 *
 * Approving signs the write-up off; it does not lock it. The doctor can go on
 * changing either document, and the visit says that it changed after approval.
 */
export function useWriteUp({
  storeKey,
  draft,
  approved: approvedOnServer,
}: {
  /** Where the visit's edits are kept for the session. */
  storeKey: string;
  /** The model's draft as documents. Only used when nothing has been edited yet. */
  draft: () => WriteUpDocs;
  approved: boolean;
}) {
  const { t, locale } = useI18n();
  const { writeUp: stored, setWriteUp } = useVisitExtras(storeKey);
  const [initial] = useState(() => stored ?? draft());
  const [facts, setFacts] = useState<NoteFacts>(() => noteFacts(initial.note));
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(approvedOnServer);
  const [edited, setEdited] = useState(Boolean(initial.editedAfterApproval));
  // The latest documents and the pending write. A ref, because a keystroke
  // must not re-render the visit: only the facts and the saving mark do.
  const pending = useRef<{ docs: WriteUpDocs; timer?: number; flush?: () => void }>({ docs: initial });
  // Hydrating a server render, the editor cannot exist yet; mounted on the
  // client after that, it is built in the first render so nothing flashes.
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

  function changed(which: "note" | "handout", doc: JSONContent, silent: boolean) {
    const afterApproval = approved && !silent;
    pending.current.docs = {
      ...pending.current.docs,
      [which]: doc,
      editedAfterApproval: pending.current.docs.editedAfterApproval || afterApproval,
    };
    if (which === "note") {
      const next = noteFacts(doc);
      if (!sameFacts(next, facts)) setFacts(next);
    }
    if (afterApproval && !edited) setEdited(true);
    if (!saving) setSaving(true);
    pending.current.flush = () => setWriteUp(pending.current.docs);
    window.clearTimeout(pending.current.timer);
    pending.current.timer = window.setTimeout(() => {
      pending.current.timer = undefined;
      pending.current.flush?.();
      setSaving(false);
    }, settle);
  }

  const note = useEditor({
    extensions: noteExtensions(locale),
    content: initial.note,
    immediatelyRender: hydrated,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { class: `${documentClass} ${numberedClass}`, "aria-label": t("Note") } },
    onUpdate: ({ editor, transaction }) =>
      changed("note", editor.getJSON(), Boolean(transaction.getMeta(approving))),
  });

  const handout = useEditor({
    extensions: handoutExtensions(locale),
    content: initial.handout,
    immediatelyRender: hydrated,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { class: documentClass, "aria-label": t("Instructions") } },
    onUpdate: ({ editor }) => changed("handout", editor.getJSON(), false),
  });

  // Leaving the visit mid-sentence still keeps the sentence.
  useEffect(() => {
    const write = pending.current;
    return () => {
      if (write.timer === undefined) return;
      window.clearTimeout(write.timer);
      write.flush?.();
    };
  }, []);

  /** Signs the write-up off. Whatever was left to check has now been checked. */
  function approve() {
    note?.commands.command(({ tr, state }) => {
      tr.removeMark(0, state.doc.content.size, state.schema.marks.uncertain);
      tr.setMeta(approving, true);
      tr.setMeta("addToHistory", false);
      return true;
    });
    setApproved(true);
    setEdited(false);
    pending.current.docs = { ...pending.current.docs, editedAfterApproval: false };
  }

  /** Takes back an approval made a moment ago. */
  function reopen() {
    setApproved(false);
  }

  return { note, handout, facts, saving, approved, edited, approve, reopen };
}

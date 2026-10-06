"use client";

import { createContext, use, useState, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Attachment } from "@/lib/demo-data";

/**
 * The note and the instructions as the doctor last left them, whether they
 * changed after approval, and whether the patient's letter changed after it
 * was emailed.
 */
export type WriteUpDocs = {
  note: JSONContent;
  handout: JSONContent;
  editedAfterApproval?: boolean;
  editedAfterEmail?: boolean;
};

/** What the doctor did to one visit in this session: files attached, and edits to the write-up. */
type Extras = { files: Attachment[]; writeUp?: WriteUpDocs };

type Store = {
  extras: Record<string, Extras>;
  update: (key: string, change: (current: Extras) => Extras) => void;
  /** A new visit is filed under a new id: what was added to it goes along. */
  move: (from: string, to: string) => void;
  clear: (key: string) => void;
};

const empty: Extras = { files: [] };

const ExtrasContext = createContext<Store | null>(null);

/**
 * Files attached and edits made to a visit, kept for the session
 * in the workspace layout so they survive moving between visits. Nothing is
 * uploaded: files stay on this device as object URLs, which is honest for a
 * demo and enough to preview them.
 */
export function VisitExtrasProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<Record<string, Extras>>({});

  const store: Store = {
    extras,
    update: (key, change) =>
      setExtras((current) => ({ ...current, [key]: change(current[key] ?? empty) })),
    move: (from, to) =>
      setExtras((current) => {
        const { [from]: moving, ...rest } = current;
        return moving ? { ...rest, [to]: moving } : current;
      }),
    clear: (key) => {
      extras[key]?.files.forEach((file) => URL.revokeObjectURL(file.src));
      setExtras((current) => {
        const { [key]: cleared, ...rest } = current;
        return cleared ? rest : current;
      });
    },
  };

  return <ExtrasContext value={store}>{children}</ExtrasContext>;
}

function useStore() {
  const store = use(ExtrasContext);
  if (!store) throw new Error("useVisitExtras needs VisitExtrasProvider");
  return store;
}

/** The images and PDFs a visit accepts, and how big each may be. */
export const acceptedFiles = { types: "image/*,application/pdf", maxBytes: 25 * 1024 * 1024 };

/** One visit's added files and edits, and the ways to change them. */
export function useVisitExtras(key: string) {
  const { extras, update } = useStore();
  const { files, writeUp } = extras[key] ?? empty;

  return {
    files,
    /** Undefined until the note or the instructions have been edited. */
    writeUp,
    setWriteUp: (docs: WriteUpDocs) => update(key, (current) => ({ ...current, writeUp: docs })),
    /** Returns what was attached, so the caller can show those arriving. */
    addFiles: (list: File[]) => {
      const attached: Attachment[] = list.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        kind: file.type === "application/pdf" ? "pdf" : "image",
        size: file.size,
        src: URL.createObjectURL(file),
      }));
      update(key, (current) => ({ ...current, files: [...current.files, ...attached] }));
      return attached;
    },
    removeFile: (id: string) => {
      const file = files.find((item) => item.id === id);
      if (file) URL.revokeObjectURL(file.src);
      update(key, (current) => ({ ...current, files: current.files.filter((item) => item.id !== id) }));
    },
  };
}

/** For the recording screen: hand its extras to the visit it was saved as, or drop them. */
export function useVisitExtrasHandover() {
  const { move, clear } = useStore();
  return { move, clear };
}

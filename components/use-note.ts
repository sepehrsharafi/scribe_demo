"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { NoteSection, NoteSectionId, NoteVersion } from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";

/** Versions are stamped two minutes apart, so the chain reads like a real day. */
function record(
  versions: NoteVersion[],
  label: string,
  author: string,
  kind: NoteVersion["kind"],
): NoteVersion {
  const [hours, minutes] = (versions[versions.length - 1]?.time ?? "09:38")
    .split(":")
    .map(Number);
  const total = hours * 60 + minutes + 2;
  const time = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;

  return { id: versions.length + 1, label, author, time, kind };
}

export type Note = ReturnType<typeof useNote>;

/**
 * One note, its undo stack and its version chain. Edits are held until the
 * doctor saves them — nothing is written behind their back, and `saved` is the
 * last text that actually reached the record.
 */
export function useNote({
  note: draft,
  versions: chain,
  signed: locked,
}: {
  note: NoteSection[];
  versions: NoteVersion[];
  signed: boolean;
}) {
  const { t, demo } = useI18n();
  const doctor = demo.doctor;
  const [note, setNote] = useState(draft);
  const [saved, setSaved] = useState(draft);
  const [past, setPast] = useState<NoteSection[][]>([]);
  const [versions, setVersions] = useState(chain);
  const [active, setActive] = useState<NoteSectionId>(draft[0]?.id ?? "reason");
  const [signed, setSigned] = useState(locked);

  const unsaved = note !== saved;

  function edit(id: NoteSectionId, body: string) {
    setNote(note.map((section) => (section.id === id ? { ...section, body } : section)));
  }

  function save() {
    if (!unsaved) return;
    setPast([...past, saved]);
    setSaved(note);
    setVersions([...versions, record(versions, t("Manual edit"), t("You"), "manual")]);
    toast.success(t("Note saved"));
  }

  function revise(id: NoteSectionId, body: string) {
    const next = note.map((section) =>
      section.id === id ? { ...section, body, gap: false } : section,
    );
    setPast([...past, note]);
    setNote(next);
    setSaved(next);
    setVersions([...versions, record(versions, t("AI revision accepted"), t("Scribe"), "ai")]);
    toast.success(t("Revision accepted — undo is available"));
  }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setNote(previous);
    setSaved(previous);
    setPast(past.slice(0, -1));
    setVersions(versions.slice(0, -1));
    toast(t("Stepped back one version"));
  }

  function sign() {
    // Signing with edits in hand saves them first; the record must match the screen.
    let chainNow = versions;
    if (unsaved) {
      setPast([...past, saved]);
      setSaved(note);
      chainNow = [...versions, record(versions, t("Manual edit"), t("You"), "manual")];
    }
    setSigned(true);
    setVersions([
      ...chainNow,
      record(chainNow, t("Signed and locked"), doctor.name, "signature"),
    ]);
    toast.success(t("Note signed and locked"));
  }

  function addAddendum() {
    setVersions([...versions, record(versions, t("Addendum added"), doctor.name, "manual")]);
    toast.success(t("Addendum saved alongside the signed note"));
  }

  return {
    note,
    versions,
    active,
    setActive,
    signed,
    unsaved,
    canUndo: past.length > 0,
    edit,
    save,
    revise,
    undo,
    sign,
    addAddendum,
  };
}

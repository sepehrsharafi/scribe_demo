"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  noteOrder,
  type Medication,
  type Note as NoteRecord,
  type NoteSectionId,
  type NoteVersion,
  type TextSectionId,
  type Triage,
} from "@/lib/demo-data";
import { useI18n } from "@/components/i18n-provider";
import { openFlags } from "@/components/note-text";

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

const emptyTriage: Triage = { complaint: "", bp: "", hr: "", temp: "", spo2: "", weight: "" };

/** The sections this note shows, in reading order. Anything left out had nothing in it. */
export function visibleSections(note: NoteRecord): NoteSectionId[] {
  return noteOrder.filter((id) =>
    id === "medications"
      ? note.medications.length > 0
      : note.sections.some((section) => section.id === id),
  );
}

export type Note = ReturnType<typeof useNote>;

/**
 * One note, its undo stack and its version chain. Edits are held until the
 * doctor saves them — nothing is written behind their back, and `saved` is the
 * last text that actually reached the record. Confirming a medication or
 * clearing an uncertain phrase is an edit like any other.
 */
export function useNote({
  note: draft,
  versions: chain,
  approved: locked,
}: {
  note: NoteRecord;
  versions: NoteVersion[];
  approved: boolean;
}) {
  const { t, demo } = useI18n();
  const doctor = demo.doctor;
  const [note, setNote] = useState(draft);
  const [saved, setSaved] = useState(draft);
  const [past, setPast] = useState<NoteRecord[]>([]);
  const [versions, setVersions] = useState(chain);
  const [active, setActive] = useState<NoteSectionId>(draft.sections[0]?.id ?? "reason");
  const [approved, setApproved] = useState(locked);

  const unsaved = note !== saved;
  const unconfirmed = note.medications.filter((row) => row.unconfirmed).length;
  const uncertain = note.sections.reduce((total, section) => total + openFlags(section).length, 0);

  function editSection(id: TextSectionId, body: string) {
    setNote({
      ...note,
      sections: note.sections.map((section) => (section.id === id ? { ...section, body } : section)),
    });
  }

  /** The doctor has read an uncertain phrase and is happy with it. */
  function checkPhrase(id: TextSectionId, text: string) {
    setNote({
      ...note,
      sections: note.sections.map((section) =>
        section.id === id
          ? { ...section, uncertain: section.uncertain?.filter((flag) => flag.text !== text) }
          : section,
      ),
    });
  }

  function editTriage(field: keyof Triage, value: string) {
    setNote({ ...note, triage: { ...(note.triage ?? emptyTriage), [field]: value } });
  }

  /** Correcting an unconfirmed row and confirming it is one step, so it is one edit. */
  function editMedication(
    id: string,
    row: Omit<Medication, "id" | "unconfirmed">,
    confirm = false,
  ) {
    setNote({
      ...note,
      medications: note.medications.map((item) =>
        item.id === id
          ? { ...item, ...row, unconfirmed: confirm ? undefined : item.unconfirmed }
          : item,
      ),
    });
  }

  function confirmMedication(id: string) {
    setNote({
      ...note,
      medications: note.medications.map((item) =>
        item.id === id ? { ...item, unconfirmed: undefined } : item,
      ),
    });
  }

  function removeMedication(id: string) {
    setNote({ ...note, medications: note.medications.filter((item) => item.id !== id) });
  }

  /** Adds a blank row and returns its id, so the table can open it for editing. */
  function addMedication() {
    const id = `added-${Date.now()}`;
    setNote({
      ...note,
      medications: [...note.medications, { id, drug: "", dose: "", frequency: "", duration: "" }],
    });
    setActive("medications");
    return id;
  }

  /** Brings back a section the draft left out because it had nothing in it. */
  function addSection(id: TextSectionId) {
    if (note.sections.some((section) => section.id === id)) return;
    const sections = [...note.sections, { id, body: "" }].sort(
      (a, b) => noteOrder.indexOf(a.id) - noteOrder.indexOf(b.id),
    );
    setNote({ ...note, sections });
    setActive(id);
  }

  function save() {
    if (!unsaved) return;
    setPast([...past, saved]);
    setSaved(note);
    setVersions([...versions, record(versions, t("Manual edit"), t("You"), "manual")]);
    toast.success(t("Note saved"));
  }

  function revise(id: TextSectionId, body: string) {
    const next = {
      ...note,
      sections: note.sections.map((section) =>
        section.id === id ? { ...section, body, gap: false, uncertain: undefined } : section,
      ),
    };
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

  function approve() {
    // Approving with edits in hand saves them first; the record must match the screen.
    let chainNow = versions;
    if (unsaved) {
      setPast([...past, saved]);
      setSaved(note);
      chainNow = [...versions, record(versions, t("Manual edit"), t("You"), "manual")];
    }
    setApproved(true);
    setVersions([
      ...chainNow,
      record(chainNow, t("Approved and locked"), doctor.name, "approval"),
    ]);
  }

  /** Takes back an approval made a moment ago. Run from the toast, so it reads current state. */
  function reopen() {
    setApproved(false);
    setVersions((current) =>
      current[current.length - 1]?.kind === "approval" ? current.slice(0, -1) : current,
    );
  }

  function addAddendum() {
    setVersions([...versions, record(versions, t("Addendum added"), doctor.name, "manual")]);
    toast.success(t("Addendum saved alongside the approved note"));
  }

  return {
    note,
    versions,
    active,
    setActive,
    approved,
    unsaved,
    unconfirmed,
    uncertain,
    canUndo: past.length > 0,
    editSection,
    checkPhrase,
    editTriage,
    editMedication,
    confirmMedication,
    removeMedication,
    addMedication,
    addSection,
    save,
    revise,
    undo,
    approve,
    reopen,
    addAddendum,
  };
}

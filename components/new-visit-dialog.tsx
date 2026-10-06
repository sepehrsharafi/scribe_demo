"use client";

import Link from "next/link";
import { RiAddLine } from "@remixicon/react";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { PatientOption } from "@/lib/patient-options";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import { cn, typing } from "@/lib/utils";
import { Elapsed, useActiveRecording } from "@/components/active-recording";
import { PatientPicker } from "@/components/patient-picker";
import { useI18n } from "@/components/i18n-provider";

const OpenContext = createContext<(open: boolean) => void>(() => {});

/**
 * One "who is this visit with?" dialog for the whole workspace. The sidebar,
 * the phone's top bar and the N key all open the same one; picking a patient
 * closes it and opens their visit.
 */
export function NewVisitProvider({
  patients,
  children,
}: {
  patients: PatientOption[];
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { recording } = useActiveRecording();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (typing(event.target) || recording) return;
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording]);

  return (
    <OpenContext value={setOpen}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[min(20%,8rem)] translate-y-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("New visit")}</DialogTitle>
            <DialogDescription>{t("Pick a patient, and the visit opens ready to record.")}</DialogDescription>
          </DialogHeader>
          <PatientPicker patients={patients} onPick={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </OpenContext>
  );
}

/** Beside the name on a visit not yet started: the wrong patient is one click from the right one. */
export function ChangePatientButton() {
  const { t } = useI18n();
  const setOpen = use(OpenContext);
  const { recording } = useActiveRecording();

  // Once recording, it fades but keeps its place, so the allergies beside it stay put.
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground transition-[opacity,visibility] duration-200", recording && "invisible opacity-0")}
      onClick={() => setOpen(true)}
    >
      {t("Change")}
    </Button>
  );
}

/**
 * Starts a visit — or, while one is being recorded, goes back to it: there is
 * only ever one recording, and it is never more than a click away. On a phone
 * the sidebar slides away first, so the dialog is the only layer on screen.
 * Compact, in the top bar, it drops the shortcut hint but keeps its words.
 */
export function NewVisitButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useI18n();
  const setOpen = use(OpenContext);
  const { recording } = useActiveRecording();
  const { isMobile, setOpenMobile } = useSidebar();

  if (recording) {
    const live = recording.phase === "recording";
    return (
      <Button
        variant="outline"
        className={cn("justify-start gap-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10", className)}
        render={<Link href={`/new?patient=${recording.patient.id}`} />}
        title={t("Back to the recording")}
      >
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full bg-destructive", live && "animate-pulse")}
        />
        <span className={cn("truncate", compact && "sr-only")}>{recording.patient.name}</span>
        <Elapsed recording={recording} className="ms-auto text-xs tabular-nums" />
      </Button>
    );
  }

  return (
    <Button
      className={cn("justify-start gap-2", className)}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
        setOpen(true);
      }}
    >
      <RiAddLine data-icon="inline-start" />
      {t("New visit")}
      {compact ? null : <Kbd className="ms-auto bg-primary-foreground/15 text-primary-foreground">N</Kbd>}
    </Button>
  );
}

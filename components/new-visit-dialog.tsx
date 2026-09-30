"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { Elapsed, useActiveRecording } from "@/components/active-recording";
import { PatientPicker } from "@/components/patient-picker";
import { useI18n } from "@/components/i18n-provider";

const OpenContext = createContext<(() => void) | null>(null);

/** Keys typed into a field are the field's, not a shortcut. */
function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/**
 * One "who is this visit with?" dialog for the whole workspace. The sidebar,
 * the phone's top bar and the N key all open the same one. It belongs to the
 * page it was opened on, so the navigation to a new visit is what closes it.
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
  const location = `${usePathname()}?${useSearchParams()}`;
  // Open only on the page it was opened on: navigating away is what closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === location;

  const show = () => setOpenOn(location);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (typing(event.target) || recording) return;
      event.preventDefault();
      setOpenOn(`${window.location.pathname}?${new URLSearchParams(window.location.search)}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording]);

  return (
    <OpenContext value={show}>
      {children}
      <Dialog open={open} onOpenChange={(next) => setOpenOn(next ? location : null)}>
        <DialogContent className="top-[min(20%,8rem)] max-w-[calc(100%-1.5rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle>{t("New visit")}</DialogTitle>
            <DialogDescription>{t("Who is it with? Pick a patient, and the visit opens ready to record.")}</DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            {/* The visit opening is what closes the dialog — see openOn above. */}
            <PatientPicker patients={patients} onSamePage={() => setOpenOn(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </OpenContext>
  );
}

/** Beside the name on a visit not yet started: the wrong patient is one click from the right one. */
export function ChangePatientButton() {
  const { t } = useI18n();
  const open = use(OpenContext);
  const { recording } = useActiveRecording();

  // Once recording, it fades but keeps its place, so the allergies beside it stay put.
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground transition-[opacity,visibility] duration-200", recording && "invisible opacity-0")}
      onClick={() => open?.()}
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
  const open = use(OpenContext);
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
        <Elapsed recording={recording} className="ms-auto font-mono text-xs tabular-nums" />
      </Button>
    );
  }

  return (
    <Button
      className={cn("justify-start gap-2", className)}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
        open?.();
      }}
    >
      <RiAddLine data-icon="inline-start" />
      {t("New visit")}
      {compact ? null : (
        <Kbd className="ms-auto bg-primary-foreground/15 text-primary-foreground">N</Kbd>
      )}
    </Button>
  );
}

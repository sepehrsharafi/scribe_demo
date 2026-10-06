"use client";

import { usePathname, useRouter } from "next/navigation";
import { RiArrowRightLine, RiCheckboxCircleFill, RiCloseLine } from "@remixicon/react";
import { useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export type Processing = {
  visitId: string;
  patientName: string;
  /** When its note will be ready, in epoch ms. */
  readyAt: number;
};

/** How long the slip stays up. Long enough to finish a sentence with a patient. */
const lingers = 12_000;

/** The toast that says a note has arrived: when, for whom, and the one thing to do about it. */
function NoteReady({ id, visit }: { id: string | number; visit: Processing }) {
  const { t } = useI18n();
  const router = useRouter();
  const at = new Date(visit.readyAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 font-normal">
      <RiCheckboxCircleFill className="size-5 shrink-0 text-primary" />
      <div className="grid min-w-0 flex-1 gap-3">
        <div className="grid gap-0.5">
          <p className="flex items-baseline gap-2 text-sm font-medium">
            {t("Note ready")}
            <time className="text-xs font-normal text-muted-foreground tabular-nums">{at}</time>
          </p>
          <p className="text-sm">{visit.patientName}</p>
          <p className="text-xs text-muted-foreground">
            {t("The note and the instructions are written. Read them through, then approve.")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => {
              toast.dismiss(id);
              router.push(`/visits/${visit.visitId}`);
            }}
          >
            {t("Review the note")}
            <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.dismiss(id)}>
            {t("Later")}
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute end-2 top-2"
        onClick={() => toast.dismiss(id)}
        aria-label={t("Dismiss")}
      >
        <RiCloseLine />
      </Button>
    </div>
  );
}

/**
 * A visit being processed finishes on a mock timer, and the server decides
 * when that is. This asks the server again the moment the next one is due,
 * wherever the doctor happens to be, and says so unless they are already
 * looking at it.
 */
export function ProcessingWatcher({ processing }: { processing: Processing[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const next = processing.toSorted((a, b) => a.readyAt - b.readyAt)[0];
  const watching = next ? pathname === `/visits/${next.visitId}` : false;

  useEffect(() => {
    if (!next) return;
    const timer = window.setTimeout(
      () => {
        router.refresh();
        if (watching) return;
        toast.custom((id) => <NoteReady id={id} visit={next} />, {
          duration: lingers,
          style: { "--toast-duration": `${lingers}ms` } as CSSProperties,
        });
      },
      // A little after the moment, so the server is sure to be past it too.
      Math.max(0, next.readyAt - Date.now()) + 250,
    );
    // A refresh hands down a new object for the same moment; the delay is
    // measured from the clock, so starting the timer again loses nothing.
    return () => window.clearTimeout(timer);
  }, [next, watching, router]);

  return null;
}

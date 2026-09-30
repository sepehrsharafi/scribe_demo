"use client";

import { usePathname, useRouter } from "next/navigation";
import { RiArrowRightLine, RiCloseLine } from "@remixicon/react";
import { useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";

export type Processing = {
  visitId: string;
  patientName: string;
  /** When its note will be ready, in epoch ms. */
  readyAt: number;
};

/** How long the slip stays up. Long enough to finish a sentence with a patient. */
const lingers = 12_000;

/**
 * The slip that says a note has arrived: when, for whom, and the one thing to
 * do about it. Laid out like the app's own labels rather than a notification —
 * the time in mono beside a signal square, the patient's name set as a name.
 */
function NoteReady({ id, visit }: { id: string | number; visit: Processing }) {
  const { t } = useI18n();
  const router = useRouter();
  const at = new Date(visit.readyAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid gap-3 font-normal">
      <p className="flex items-center gap-2 font-mono text-2xs tracking-[0.14em] text-inverse-muted uppercase">
        <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-inverse-signal" />
        {t("Note ready")}
        <span aria-hidden="true">·</span>
        <time className="tabular-nums">{at}</time>
      </p>
      <div>
        <p className="font-heading text-lg leading-tight font-semibold tracking-tight">{visit.patientName}</p>
        <p className="mt-1 text-xs leading-relaxed text-inverse-muted">
          {t("The note and the instructions are written. Read them through, then approve.")}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            toast.dismiss(id);
            router.push(`/visits/${visit.visitId}`);
          }}
          className="group/open inline-flex h-8 items-center gap-1.5 rounded-lg bg-inverse-foreground px-3 text-xs font-semibold text-inverse outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-inverse-signal"
        >
          {t("Review the note")}
          <RiArrowRightLine className="size-4 transition-transform group-hover/open:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/open:-translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          className="h-8 rounded-lg px-2.5 font-mono text-2xs font-semibold tracking-[0.14em] text-inverse-muted uppercase outline-none transition-colors hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:ring-2 focus-visible:ring-inverse-signal"
        >
          {t("Later")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label={t("Dismiss")}
        className="absolute end-2.5 top-3 flex size-7 items-center justify-center rounded-lg text-inverse-muted outline-none transition-colors hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:ring-2 focus-visible:ring-inverse-signal"
      >
        <RiCloseLine className="size-4" />
      </button>
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

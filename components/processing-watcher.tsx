"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";

export type Processing = {
  visitId: string;
  patientName: string;
  /** When the visit next changes status, in epoch ms. */
  changesAt: number;
  /** Whether that change is the draft becoming ready. */
  ready: boolean;
};

/**
 * A freshly recorded visit moves through its stages on a mock timer, and the
 * server works out which stage it is on. This asks the server again at the
 * moment the next stage starts, wherever the doctor happens to be, and says so
 * when a draft is ready.
 */
export function ProcessingWatcher({ processing }: { processing: Processing[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const next = processing.toSorted((a, b) => a.changesAt - b.changesAt)[0];

  useEffect(() => {
    if (!next) return;
    const timer = window.setTimeout(
      () => {
        router.refresh();
        if (!next.ready) return;
        toast.success(t("Note ready to review"), {
          description: next.patientName,
          action: {
            label: t("Open"),
            onClick: () => router.push(`/visits/${next.visitId}`),
          },
        });
      },
      // A little after the boundary, so the server is sure to be past it too.
      Math.max(0, next.changesAt - Date.now()) + 250,
    );
    // A refresh hands down a new object for the same boundary; the delay is
    // measured from the clock, so starting the timer again loses nothing.
    return () => window.clearTimeout(timer);
  }, [next, router, t]);

  return null;
}

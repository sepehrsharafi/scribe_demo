"use client";

import Link from "next/link";
import { RiArrowRightLine, RiHistoryLine } from "@remixicon/react";
import { useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { formatDuration } from "@/lib/utils";

/**
 * Offers back a recording the browser lost mid-visit. Dismissing it only hides
 * it; the audio stays on the device.
 *
 * The actions are a grid column rather than floated over the text: beside the
 * message from `sm` up, underneath it on a phone, at the end of the row.
 */
export function RecoveredRecordingAlert({
  patientName,
  capturedSeconds,
  resumeHref,
}: {
  patientName: string;
  capturedSeconds: number;
  resumeHref: string;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Alert className="has-data-[slot=alert-action]:pe-4 sm:has-[>svg]:grid-cols-[auto_minmax(0,1fr)_auto]">
      <RiHistoryLine />
      <AlertTitle>{t("A recording was recovered")}</AlertTitle>
      <AlertDescription className="col-start-2 text-pretty">
        {t("{name} · {duration} captured before the browser closed.", {
          name: patientName,
          duration: formatDuration(capturedSeconds),
        })}
      </AlertDescription>
      <AlertAction className="static col-start-2 mt-3 flex items-center justify-end gap-2 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:self-center">
        <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
          {t("Dismiss")}
        </Button>
        <Button size="sm" render={<Link href={resumeHref} />}>
          {t("Resume visit")}
          <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
        </Button>
      </AlertAction>
    </Alert>
  );
}

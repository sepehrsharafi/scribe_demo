"use client";

import { RiLockLine, RiQuillPenLine } from "@remixicon/react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/page-layout";

export function SignDialog({
  open,
  onOpenChange,
  sections,
  versions,
  unsaved,
  onSign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: number;
  versions: number;
  /** Edits still in hand. Signing saves them first, and says so. */
  unsaved: boolean;
  onSign: () => void;
}) {
  const { t, demo } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <RiLockLine className="size-5" />
          </span>
          <Eyebrow>{t("Final step")}</Eyebrow>
          <DialogTitle>{t("Sign and lock this note?")}</DialogTitle>
          <DialogDescription>
            {t("This version becomes the clinical record. It cannot be overwritten — any later correction is stored as an addendum, and the version chain behind it is kept.")}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-0 rounded-2xl border px-4">
          {[
            { label: t("Sections reviewed"), value: sections },
            { label: t("Versions retained"), value: versions },
            ...(unsaved
              ? [{ label: t("Unsaved edits"), value: t("Saved on signing") }]
              : []),
            { label: t("Signing as"), value: demo.doctor.name },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0"
            >
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-xs font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Review again")}
          </Button>
          <Button
            onClick={() => {
              onSign();
              onOpenChange(false);
            }}
          >
            <RiQuillPenLine data-icon="inline-start" />
            {t("Sign note")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

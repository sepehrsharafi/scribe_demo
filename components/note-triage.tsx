"use client";

import { RiAddLine, RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TriageAttrs, Vital } from "@/components/write-up-document";
import { useI18n } from "@/components/i18n-provider";

/* Fields that read as text until they are hovered or focused. */
const quiet =
  "-mx-2 w-[calc(100%+1rem)] border-transparent bg-transparent px-2 text-sm font-medium tabular-nums shadow-none hover:bg-muted focus-visible:bg-background dark:bg-transparent";
const small = "h-7 text-xs font-normal text-muted-foreground md:text-xs";

/**
 * What triage recorded before the doctor came in. It sits at the top of the
 * examination because that is where a doctor looks for it, and it is edited
 * in place like the rest of the note — including what is measured: each
 * reading can be renamed or taken out, and others added.
 */
export function TriageBlock({
  triage,
  onChange,
}: {
  triage: TriageAttrs;
  onChange: (change: Partial<TriageAttrs>) => void;
}) {
  const { t } = useI18n();
  const { vitals } = triage;

  const edit = (index: number, change: Partial<Vital>) =>
    onChange({ vitals: vitals.map((vital, at) => (at === index ? { ...vital, ...change } : vital)) });

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{t("Triage · chief complaint")}</span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onChange({ vitals: [...vitals, { label: "", value: "", unit: "" }] })}
          >
            <RiAddLine data-icon="inline-start" />
            {t("Add vital")}
          </Button>
        </div>
        <Input
          value={triage.complaint}
          onChange={(event) => onChange({ complaint: event.target.value })}
          aria-label={t("Chief complaint")}
          className={quiet}
        />
      </div>
      <dl className="flex flex-wrap gap-px bg-border">
        {vitals.map((vital, index) => (
          <div key={index} className="group/vital relative grow basis-40 bg-background px-4 py-3">
            <dt>
              <Input
                value={vital.label}
                onChange={(event) => edit(index, { label: event.target.value })}
                aria-label={t("Vital")}
                placeholder={t("Vital")}
                className={cn(quiet, small)}
              />
            </dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1">
                <Input
                  value={vital.value}
                  onChange={(event) => edit(index, { value: event.target.value })}
                  aria-label={vital.label || t("Vital")}
                  className={quiet}
                />
              </span>
              <span className="w-14 shrink-0">
                <Input
                  value={vital.unit}
                  onChange={(event) => edit(index, { unit: event.target.value })}
                  aria-label={t("Unit")}
                  placeholder={t("Unit")}
                  className={cn(quiet, small)}
                />
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute end-1.5 top-1.5 opacity-0 group-focus-within/vital:opacity-100 group-hover/vital:opacity-100"
                onClick={() => onChange({ vitals: vitals.filter((_, at) => at !== index) })}
                aria-label={t("Remove {name}", { name: vital.label || t("Vital") })}
                title={t("Remove")}
              >
                <RiCloseLine />
              </Button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

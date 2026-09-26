"use client";

import type { Triage } from "@/lib/demo-data";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const vitals: { field: Exclude<keyof Triage, "complaint">; label: string; unit: string }[] = [
  { field: "bp", label: "BP", unit: "mmHg" },
  { field: "hr", label: "HR", unit: "bpm" },
  { field: "temp", label: "Temp", unit: "°C" },
  { field: "spo2", label: "SpO₂", unit: "%" },
  { field: "weight", label: "Weight", unit: "kg" },
];

const label = "font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase";

/**
 * What triage recorded before the doctor came in. It sits at the top of the
 * examination because that is where a doctor looks for it, and it is edited
 * in place like the rest of the note.
 */
export function TriageBlock({
  triage,
  locked,
  onChange,
}: {
  triage: Triage;
  locked: boolean;
  onChange: (field: keyof Triage, value: string) => void;
}) {
  const { t } = useI18n();

  const field = (name: keyof Triage, text: string, className?: string) =>
    locked ? (
      <span className={cn("block min-h-9 py-1.5 font-mono text-sm font-medium tabular-nums", className)}>
        {text || "—"}
      </span>
    ) : (
      <Input
        value={text}
        onChange={(event) => onChange(name, event.target.value)}
        aria-label={t(name === "complaint" ? "Chief complaint" : vitals.find((v) => v.field === name)!.label)}
        className={cn(
          "-mx-2 h-9 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 text-sm font-medium tabular-nums hover:bg-muted focus-visible:bg-background dark:bg-transparent",
          className,
        )}
      />
    );

  return (
    <div className="mt-3 overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/40 px-4 py-3">
        <span className={label}>{t("Triage · chief complaint")}</span>
        {field("complaint", triage.complaint)}
      </div>
      <dl className="grid grid-cols-2 gap-px bg-border @lg:grid-cols-3 @2xl:grid-cols-5">
        {vitals.map((vital) => (
          <div key={vital.field} className="bg-background px-4 py-3">
            <dt className={label}>{t(vital.label)}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1">{field(vital.field, triage[vital.field], "font-mono")}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{t(vital.unit)}</span>
            </dd>
          </div>
        ))}
        {/* Five readings leave a hole in a two- or three-column grid; this fills it. */}
        <div aria-hidden="true" className="bg-background @2xl:hidden" />
      </dl>
    </div>
  );
}

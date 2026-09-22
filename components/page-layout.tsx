import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The measure every page is set to. */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6 py-8 lg:px-10", className)}>
      {children}
    </div>
  );
}

/** Mono, letterspaced, uppercase. The recurring editorial label. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-2 font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function SectionHead({
  title,
  meta,
  action,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      {action ?? (meta ? <Eyebrow>{meta}</Eyebrow> : null)}
    </div>
  );
}

/**
 * The four-up ruled fact strip used at the top of a record. Values are set in
 * the mono face: dates, times and durations are data, and the body face reads
 * badly for them.
 */
export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
      {items.map((fact) => (
        <div key={fact.label} className="bg-background p-4">
          <dt className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {fact.label}
          </dt>
          <dd className="mt-2 font-mono text-sm font-medium tabular-nums">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

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
  return <div className={cn("mx-auto w-full max-w-7xl px-6 py-8 lg:px-10", className)}>{children}</div>;
}

export function PageHead({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
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
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {action ?? (meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null)}
    </div>
  );
}

/** The fact strip at the top of a record, three or four up. */
export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  const odd = items.length % 2 === 1;
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border",
        items.length === 3 ? "sm:grid-cols-3" : "md:grid-cols-4",
      )}
    >
      {items.map((fact, index) => (
        <div
          key={fact.label}
          // An odd count would leave a hole on a phone; the first fact takes the full row.
          className={cn("bg-background p-4", odd && index === 0 && "col-span-2 sm:col-span-1")}
        >
          <dt className="text-xs text-muted-foreground">{fact.label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

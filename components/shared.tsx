import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { statusMeta, type VisitStatus } from "@/lib/demo-data";

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

/* ---------------------------------------------------------------- Records */

/*
 * Every record list is one ruled table. The caller passes the same grid
 * template to `RecordHead` and every `RecordRow`, which is what keeps the
 * columns in a straight line no matter how long a status word happens to be.
 */

/**
 * The worklist row: index · avatar · patient · consultation · status · when.
 * Shared by Today and Visits so a row means the same thing in both places, and
 * so the status column has a fixed track instead of being pushed around by how
 * long the status word happens to be.
 */
export const visitRowCols =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[2rem_2rem_minmax(0,1fr)_minmax(0,1.2fr)_9.5rem_5.5rem_1rem]";

export function RecordList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border", className)}>{children}</div>
  );
}

export function RecordHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b bg-muted/40 px-4 py-2.5 font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RecordRow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/row border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** A two-line table cell. The second line is optional and always quieter. */
export function Cell({
  primary,
  secondary,
  className,
  align = "start",
  mono,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
  align?: "start" | "end";
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid min-w-0 gap-0.5",
        align === "end" ? "justify-items-end text-right" : "justify-items-start",
        className,
      )}
    >
      <span
        className={cn(
          "w-full truncate text-sm font-medium",
          align === "end" && "text-right",
          mono && "font-mono tabular-nums",
        )}
      >
        {primary}
      </span>
      {secondary ? (
        <span
          className={cn(
            "w-full truncate text-xs text-muted-foreground",
            align === "end" && "text-right",
            mono && "font-mono tabular-nums",
          )}
        >
          {secondary}
        </span>
      ) : null}
    </span>
  );
}

export function RowIndex({ index }: { index: number }) {
  return (
    <span className="hidden font-mono text-2xs text-muted-foreground tabular-nums sm:block">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

export function RowChevron() {
  return (
    <span className="hidden justify-self-end text-muted-foreground transition-transform group-hover/row:translate-x-0.5 sm:block">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          d="m9 6 6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ----------------------------------------------------------------- Status */

const statusClasses: Record<VisitStatus, string> = {
  uploading: "bg-secondary text-secondary-foreground",
  transcribing: "bg-secondary text-secondary-foreground",
  drafting: "bg-secondary text-secondary-foreground",
  "draft-ready": "bg-warning/10 text-warning dark:bg-warning/15",
  signed: "bg-primary/10 text-primary dark:bg-primary/20",
  failed: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

const statusDot: Record<VisitStatus, string> = {
  uploading: "bg-muted-foreground",
  transcribing: "bg-muted-foreground animate-pulse",
  drafting: "bg-muted-foreground animate-pulse",
  "draft-ready": "bg-warning",
  signed: "bg-primary",
  failed: "bg-destructive",
};

/** A ruled status mark. Colour is a secondary cue; the word carries the meaning. */
export function StatusBadge({
  status,
  className,
}: {
  status: VisitStatus;
  className?: string;
}) {
  const meta = statusMeta[status];
  return (
    <Badge
      className={cn(
        "gap-1.5 px-2 font-medium whitespace-nowrap",
        statusClasses[status],
        className,
      )}
      title={meta.description}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", statusDot[status])}
      />
      {meta.label}
    </Badge>
  );
}

export function PatientAvatar({
  initials,
  size = "default",
  tone = "muted",
  className,
}: {
  initials: string;
  size?: "sm" | "default" | "lg";
  tone?: "muted" | "primary";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback
        className={cn(
          "font-medium tracking-tight",
          size === "lg" ? "text-sm" : "text-xs",
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** The four-up ruled fact strip used at the top of a record. */
export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
      {items.map((fact) => (
        <div key={fact.label} className="bg-background p-4">
          <dt className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {fact.label}
          </dt>
          <dd className="mt-2 text-sm font-semibold tracking-tight">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

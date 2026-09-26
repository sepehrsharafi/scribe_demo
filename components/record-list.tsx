import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Every record list is one ruled table. The caller passes the same grid template
 * to `RecordHead` and every `RecordRow`, which is what keeps the columns in a
 * straight line no matter how long a status word happens to be.
 */

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
  secondaryClassName,
  className,
  align = "start",
  mono,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  /** For a second line that only belongs on a phone, e.g. `sm:hidden`. */
  secondaryClassName?: string;
  className?: string;
  align?: "start" | "end";
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid min-w-0 gap-0.5",
        align === "end" ? "justify-items-end text-end" : "justify-items-start",
        className,
      )}
    >
      <span
        className={cn(
          "w-full truncate text-sm font-medium",
          align === "end" && "text-end",
          mono && "font-mono tabular-nums",
        )}
      >
        {primary}
      </span>
      {secondary ? (
        <span
          className={cn(
            "w-full truncate text-xs text-muted-foreground",
            align === "end" && "text-end",
            mono && "font-mono tabular-nums",
            secondaryClassName,
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
    <span className="hidden justify-self-end text-muted-foreground transition-transform group-hover/row:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/row:-translate-x-0.5 sm:block">
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
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

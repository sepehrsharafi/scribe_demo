import Link from "next/link";
import type { ReactNode } from "react";
import { RiArrowRightSLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

/*
 * Every record list is one bordered table. The caller passes the same grid
 * template to `RecordHead` and every `RecordRow`, which is what keeps the
 * columns in a straight line no matter how long a status word happens to be.
 */

export function RecordList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>{children}</div>
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
    <div className={cn("border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground", className)}>
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
      className={cn("border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted", className)}
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
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  /** For a second line that only belongs on a phone, e.g. `sm:hidden`. */
  secondaryClassName?: string;
  className?: string;
  align?: "start" | "end";
}) {
  return (
    <span
      className={cn(
        "grid min-w-0 gap-0.5",
        align === "end" ? "justify-items-end text-end" : "justify-items-start",
        className,
      )}
    >
      <span className={cn("w-full truncate text-sm font-medium", align === "end" && "text-end")}>
        {primary}
      </span>
      {secondary ? (
        <span
          className={cn(
            "w-full truncate text-xs text-muted-foreground",
            align === "end" && "text-end",
            secondaryClassName,
          )}
        >
          {secondary}
        </span>
      ) : null}
    </span>
  );
}

export function RowChevron() {
  return <RiArrowRightSLine className="hidden size-5 justify-self-end text-muted-foreground rtl:-scale-x-100 sm:block" />;
}

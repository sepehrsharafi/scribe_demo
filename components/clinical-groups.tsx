import type { ReactNode } from "react";
import { RiAlarmWarningLine, RiIndeterminateCircleLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

/*
 * The clinical record reads as ruled groups — allergies, problems, medications,
 * and in context the last visit. Every group has the same shape: a head with a
 * count, then at least one row. A group with nothing in it keeps its row and
 * says so, hatched, rather than collapsing into its head.
 *
 * Rows lay out against their container, not the viewport, so the same group
 * works full width on the patient page and in the narrow rail beside a
 * recording. Head and rows share one template, which keeps the "recorded at"
 * column straight.
 */

/** Entry | recorded at | row action. Stacked, action beside the entry, when narrow. */
const withAction =
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-4 @2xl:grid-cols-[minmax(0,1fr)_18rem_2rem]";
/** Entry | recorded at. Stacked when narrow. */
const readOnly = "grid grid-cols-1 items-start gap-x-4 px-4 @2xl:grid-cols-[minmax(0,1fr)_18rem]";

export const clinicalGrid = (action: boolean) => (action ? withAction : readOnly);

/** Where the entry's source sits: under it when narrow, in its own column when wide. */
export const sourceCell = "@2xl:mt-0 @2xl:pt-0.5";

export function ClinicalGroup({
  label,
  count,
  caption,
  alarm = false,
  action = false,
  children,
}: {
  label: string;
  /** Left out for a group that is not a list of entries, like the last visit. */
  count?: number;
  /** Names the second column, from the width where it is a column. */
  caption?: string;
  /** Allergies on file: the group turns red. */
  alarm?: boolean;
  /** Rows carry an action in a third column. */
  action?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(alarm && "bg-destructive/5 dark:bg-destructive/10")}>
      <div
        className={cn(
          clinicalGrid(action),
          "items-center border-b py-2.5",
          alarm ? "border-destructive/20 bg-destructive/10 dark:bg-destructive/15" : "bg-muted/40",
        )}
      >
        <h3
          className={cn(
            "flex items-center gap-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase",
            alarm && "font-semibold text-destructive",
          )}
        >
          {alarm ? <RiAlarmWarningLine className="size-4" /> : null}
          {label}
          {count !== undefined ? (
            <span className="rounded-full border border-current/25 px-1.5 tabular-nums">{count}</span>
          ) : null}
        </h3>
        {caption ? (
          <span className="hidden font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase @2xl:block">
            {caption}
          </span>
        ) : null}
      </div>
      <ul className={cn("divide-y", alarm && "divide-destructive/15")}>{children}</ul>
    </section>
  );
}

/** The row an empty group keeps. Hatched, so absence reads as a fact, not a gap in the layout. */
export function ClinicalEmpty({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 bg-[repeating-linear-gradient(135deg,var(--color-muted)_0_6px,transparent_6px_12px)] px-4 py-3 text-sm text-muted-foreground">
      <RiIndeterminateCircleLine className="size-4 shrink-0" />
      {children}
    </li>
  );
}

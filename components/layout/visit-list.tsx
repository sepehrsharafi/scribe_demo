"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useEffect, useState, type ReactNode } from "react";
import type { VisitStatus } from "@/lib/demo-data";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { statusText } from "@/components/status-text";
import { useI18n } from "@/components/i18n-provider";

/** One visit as the sidebar lists it. Worked out on the server. */
export type VisitRow = {
  id: string;
  patient: string;
  reason: string;
  /** Today, Yesterday, or the date: the heading it is listed under. */
  day: string;
  time: string;
  status: VisitStatus;
};

const searchId = "visit-search";

/** Keys typed into a field are the field's, not a shortcut. */
function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/**
 * Where a visit stands, said only when it needs saying: a note waiting for
 * review is a small amber mark, like an unread message; a note being written
 * says so, and so does a failed upload. An approved visit says nothing.
 */
function Standing({ status }: { status: VisitStatus }) {
  const { t } = useI18n();
  const label = t(statusText[status].label);

  if (status === "approved") return <span className="sr-only">{label}</span>;
  if (status === "ready") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center">
        <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 text-2xs font-medium",
        status === "failed" ? "text-destructive" : "text-primary",
      )}
    >
      {status === "processing" ? <Spinner className="size-3" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

/** Marks the row the doctor just clicked while its visit is still on its way. */
function Pending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" data-pending={pending ? "" : undefined} className="hidden" />;
}

/** The part of a name or reason that matched, picked out. */
function Matched({ text, query }: { text: string; query: string }): ReactNode {
  const at = query ? text.toLocaleLowerCase().indexOf(query) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-xs bg-primary/15 text-inherit">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

/** Latest first, gathered under the day they happened. */
function byDay(rows: VisitRow[]) {
  const days = new Map<string, VisitRow[]>();
  for (const row of rows) days.set(row.day, [...(days.get(row.day) ?? []), row]);
  return [...days.entries()];
}

/**
 * The visits, latest first, each day ruled off with its count and how many
 * are waiting for review. A row is who the visit was with, then what it was
 * about and when, quieter. A search line sits on top — press / from anywhere
 * to use it.
 */
export function VisitList({ rows }: { rows: VisitRow[] }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const search = query.trim().toLocaleLowerCase();
  const shown = search
    ? rows.filter((row) => `${row.patient} ${row.reason}`.toLocaleLowerCase().includes(search))
    : rows;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
      const field = document.getElementById(searchId);
      if (!field) return;
      event.preventDefault();
      field.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarGroup className="min-h-0 flex-1 gap-2 pt-3">
      <div className="group/search relative flex items-center">
        <RiSearchLine
          aria-hidden="true"
          className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground transition-colors group-focus-within/search:text-primary"
        />
        <Input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            setQuery("");
            event.currentTarget.blur();
          }}
          placeholder={t("Search visits")}
          aria-label={t("Search visits")}
          autoComplete="off"
          className="h-9 rounded-none border-0 border-b border-sidebar-border bg-transparent ps-8 pe-14 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="absolute end-1.5 flex items-center gap-1">
          {query ? (
            <>
              <span className="font-mono text-2xs text-muted-foreground tabular-nums" aria-live="polite">
                {shown.length}
              </span>
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("Clear the search")}
                title={t("Clear the search")}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <RiCloseLine className="size-4" />
              </button>
            </>
          ) : (
            <Kbd className="bg-transparent font-mono text-2xs group-focus-within/search:hidden">/</Kbd>
          )}
        </span>
      </div>

      <nav aria-label={t("Visits")} className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
        {shown.length ? (
          byDay(shown).map(([day, visits]) => (
            <section key={day} className="pt-3 first:pt-1">
              <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-sidebar py-1.5 ps-1 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
                <span>{day}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-sidebar-border" />
                {visits.some((row) => row.status === "ready") ? (
                  <span className="text-warning tabular-nums">
                    {t("{count} to review", { count: visits.filter((row) => row.status === "ready").length })}
                  </span>
                ) : null}
                <span className="tabular-nums">{visits.length}</span>
              </h3>
              <ul>
                {visits.map((row) => {
                  const active = pathname === `/visits/${row.id}`;
                  return (
                    <li key={row.id}>
                      <Link
                        href={`/visits/${row.id}`}
                        aria-current={active ? "page" : undefined}
                        title={row.status === "approved" ? undefined : t(statusText[row.status].description)}
                        className={cn(
                          "grid gap-0.5 rounded-lg px-2 py-2 outline-none transition-colors",
                          "hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring has-data-pending:bg-sidebar-accent/60",
                          active && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <span className="flex min-w-0 items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            <Matched text={row.patient} query={search} />
                          </span>
                          <Standing status={row.status} />
                        </span>
                        <span className="flex min-w-0 items-baseline justify-between gap-3 text-xs text-muted-foreground">
                          <span className="truncate">
                            <Matched text={row.reason || t("New visit")} query={search} />
                          </span>
                          <time className="shrink-0 font-mono text-2xs tabular-nums">{row.time}</time>
                        </span>
                        <Pending />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        ) : (
          <p className="px-1 py-3 text-xs text-muted-foreground">
            {search ? t("No visit matches “{query}”.", { query: query.trim() }) : t("No visits yet.")}
          </p>
        )}
      </nav>
    </SidebarGroup>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand";
import { NewVisitButton } from "@/components/new-visit-dialog";
import { useI18n } from "@/components/i18n-provider";

/**
 * The top bar exists only when the sidebar is out of sight — on a phone, or
 * collapsed on a desktop — so there is always a way back to it and to a new
 * visit. With the sidebar open, pages start at the top edge.
 *
 * It stays mounted and folds its row to nothing rather than appearing and
 * disappearing, so collapsing the sidebar moves the page down in the same
 * motion instead of with a jump. On a phone, going anywhere from the sidebar
 * slides it away.
 */
export function WorkspaceBar() {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const { t } = useI18n();
  const pathname = usePathname();
  const shown = isMobile || state === "collapsed";

  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  return (
    <div
      data-workspace-bar={shown ? "shown" : "hidden"}
      inert={!shown}
      className={cn(
        "sticky top-0 z-30 grid transition-[grid-template-rows,opacity] duration-300 ease-drawer motion-reduce:transition-none",
        shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-sm md:rounded-t-2xl">
          <SidebarTrigger className="rtl:-scale-x-100" />
          <Link href="/" className="flex items-center gap-2" aria-label={t("Scribe home")}>
            <BrandMark />
            <span className="font-heading text-base font-semibold tracking-tight">{t("Scribe")}</span>
          </Link>
          <NewVisitButton compact className="ms-auto" />
        </div>
      </div>
    </div>
  );
}

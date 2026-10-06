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
 * The top bar of the page card, there whenever the sidebar is out of sight —
 * on a phone, or collapsed on a desktop — so there is always a way back to it
 * and to a new visit. With the sidebar open on a desktop, pages start at the
 * card's edge. On a phone, going anywhere from the sidebar slides it away.
 */
export function WorkspaceBar() {
  const { state, setOpenMobile } = useSidebar();
  const { t } = useI18n();
  const pathname = usePathname();

  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3",
        state === "expanded" && "md:hidden",
      )}
    >
      <SidebarTrigger className="rtl:-scale-x-100" />
      <Link href="/" className="flex items-center gap-2" aria-label={t("Scribe home")}>
        <BrandMark />
        <span className="text-base font-semibold tracking-tight">{t("Scribe")}</span>
      </Link>
      <NewVisitButton compact className="ms-auto" />
    </header>
  );
}

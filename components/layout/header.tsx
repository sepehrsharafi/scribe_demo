"use client";

import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { useSection } from "@/components/layout/nav";

/**
 * Names the section, and is the way back to it from any page inside it — so
 * no page needs a breadcrumb of its own.
 */
export function Header() {
  const section = useSection();
  const { t } = useI18n();
  const label = "font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:rounded-t-2xl">
      <SidebarTrigger className="rtl:-scale-x-100" />
      <Separator orientation="vertical" className="me-1 h-4" />
      {section.within ? (
        <Link
          href={section.href}
          className={cn(label, "inline-flex items-center gap-1.5 transition-colors hover:text-foreground")}
        >
          <RiArrowLeftLine className="size-3.5 rtl:-scale-x-100" />
          {t(section.label)}
        </Link>
      ) : (
        <span className={label}>{t(section.label)}</span>
      )}
      <div className="ms-auto">
        <LanguageSwitch />
      </div>
    </header>
  );
}

import Link from "next/link";
import { RiLogoutBoxRLine } from "@remixicon/react";
import { signOut } from "@/lib/actions/auth";
import { getI18n } from "@/lib/i18n/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/layout/brand";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Nav } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { VisitList, type VisitRow } from "@/components/layout/visit-list";
import { NewVisitButton } from "@/components/new-visit-dialog";

/**
 * The sidebar is the doctor's list of visits, with the way to start the next
 * one above it. It is rendered once, by the workspace layout; the list and the
 * nav are the only parts that react to navigation.
 */
export async function AppSidebar() {
  const { t, f, dir, demo } = await getI18n();
  const { doctor } = demo;

  const rows: VisitRow[] = demo.visits.map((visit) => ({
    id: visit.id,
    patient: demo.getPatient(visit.patientId)?.name ?? "",
    reason: visit.reason,
    day: f.day(visit.day),
    time: visit.time,
    status: visit.status,
  }));

  return (
    // In Farsi the sidebar sits on the reading side, which is the right.
    <Sidebar variant="inset" collapsible="offcanvas" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-2 ps-1.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label={t("Scribe home")}>
            <BrandMark />
            <span className="grid gap-0.5">
              <span className="font-heading text-base leading-none font-semibold tracking-tight">
                {t("Scribe")}
              </span>
              <span className="font-mono text-2xs leading-none tracking-[0.14em] text-muted-foreground uppercase">
                {t("Demo workspace")}
              </span>
            </span>
          </Link>
          <SidebarTrigger className="ms-auto text-muted-foreground rtl:-scale-x-100" />
        </div>
        <NewVisitButton className="h-10 w-full" />
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-hidden">
        <Nav group="main" />
        <SidebarSeparator className="mt-1" />
        <VisitList rows={rows} />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-1">
        <Nav group="support" />
        <div className="flex items-center gap-2 px-1.5 pt-1">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-2xs font-medium text-primary-foreground">
              {/* The title is not part of the name. */}
              {f.initials(doctor.name.replace(/^(Dr\.?|دکتر)\s+/, ""))}
            </AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-xs font-medium">{doctor.name}</span>
            <span className="truncate text-2xs text-muted-foreground">{doctor.specialty}</span>
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label={t("Sign out")} title={t("Sign out")}>
              <RiLogoutBoxRLine className="rtl:-scale-x-100" />
            </Button>
          </form>
        </div>
        <div className="flex items-center justify-between gap-2 px-1.5 pb-0.5">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

import Link from "next/link";
import { RiLogoutBoxRLine } from "@remixicon/react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Nav } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 grid-cols-2 grid-rows-2 gap-0.5"
    >
      <i className="bg-foreground" />
      <i className="bg-primary" />
      <i className="bg-border" />
      <i className="bg-foreground" />
    </span>
  );
}

/**
 * Rendered once by the root layout. Everything here is static markup except
 * `Nav`, which is the only piece that has to know the current route.
 */
export async function AppSidebar() {
  const { t, dir, demo } = await getI18n();
  const { doctor } = demo;
  const waiting = demo.actionableVisits.length;

  return (
    // In Farsi the sidebar sits on the reading side, which is the right.
    <Sidebar variant="inset" collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={t("Scribe")}
              render={<Link href="/" aria-label={t("Scribe home")} />}
            >
              <BrandMark />
              <span className="grid gap-0.5">
                <span className="font-heading text-base leading-none font-semibold tracking-tight">
                  {t("Scribe")}
                </span>
                <span className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
                  {t("Clinical notes")}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Nav waiting={waiting} />

        <div className="mx-2 mb-2 rounded-xl border border-dashed p-3 group-data-[collapsible=icon]:hidden">
          <p className="font-mono text-2xs tracking-[0.12em] uppercase">{t("Demo workspace")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("Synthetic patients only. Nothing here is a real clinical record.")}
          </p>
        </div>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-2 px-1 py-0.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-2xs font-medium text-primary-foreground">
              {doctor.initials}
            </AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium">{doctor.name}</span>
            <span className="truncate text-2xs text-muted-foreground">
              {doctor.specialty}
            </span>
          </span>
          <span className="flex items-center group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Sign out")}
                title={t("Sign out")}
              >
                <RiLogoutBoxRLine className="rtl:-scale-x-100" />
              </Button>
            </form>
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

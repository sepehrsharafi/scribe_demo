import Link from "next/link";
import type { ReactNode } from "react";
import {
  RiCalendar2Line,
  RiDashboardLine,
  RiGroupLine,
  RiQuestionLine,
  RiSettings3Line,
} from "@remixicon/react";
import { doctor, visits } from "@/lib/demo-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * Three destinations, because there are only three things in the product: the
 * day, the consultations, and the people they belong to. A note is not a fourth
 * place — it lives on its consultation.
 */
const primary = [
  { label: "Today", href: "/", icon: RiDashboardLine },
  { label: "Visits", href: "/visits", icon: RiCalendar2Line },
  { label: "Patients", href: "/patients", icon: RiGroupLine },
] as const;

const secondary = [
  { label: "Help", href: "/help", icon: RiQuestionLine },
  { label: "Settings", href: "/settings", icon: RiSettings3Line },
] as const;

export type ShellSection = "Today" | "Visits" | "Patients" | "Help" | "Settings";

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

export function AppShell({
  children,
  active = "Today",
}: {
  children: ReactNode;
  active?: ShellSection;
}) {
  const needsYou = visits.filter(
    (visit) => visit.status === "draft-ready" || visit.status === "failed",
  ).length;

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Cima"
                render={<Link href="/" aria-label="Cima home" />}
              >
                <BrandMark />
                <span className="grid gap-0.5">
                  <span className="font-heading text-base leading-none font-semibold tracking-tight">
                    Cima
                  </span>
                  <span className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
                    Clinical scribe
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-2xs tracking-[0.14em] uppercase">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primary.map(({ label, href, icon: Icon }, index) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      isActive={active === label}
                      tooltip={label}
                      render={
                        <Link
                          href={href}
                          aria-current={active === label ? "page" : undefined}
                        />
                      }
                    >
                      <Icon />
                      <span className="flex-1">{label}</span>
                      {label === "Visits" && needsYou ? (
                        <Badge
                          className="h-4 min-w-4 px-1 tabular-nums group-data-[collapsible=icon]:hidden"
                          aria-label={`${needsYou} consultations need you`}
                        >
                          {needsYou}
                        </Badge>
                      ) : (
                        <span className="font-mono text-2xs text-muted-foreground tabular-nums group-data-[collapsible=icon]:hidden">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {secondary.map(({ label, href, icon: Icon }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      isActive={active === label}
                      tooltip={label}
                      render={
                        <Link
                          href={href}
                          aria-current={active === label ? "page" : undefined}
                        />
                      }
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mx-2 mb-2 rounded-xl border border-dashed p-3 group-data-[collapsible=icon]:hidden">
            <p className="font-mono text-2xs tracking-[0.12em] uppercase">
              Demo workspace
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Synthetic patients only. Nothing here is a real clinical record.
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
            <span className="group-data-[collapsible=icon]:hidden">
              <ThemeToggle />
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset id="top">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:rounded-t-2xl">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {active}
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

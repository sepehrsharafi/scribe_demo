"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiCalendar2Line,
  RiDashboardLine,
  RiGroupLine,
  RiQuestionLine,
  RiSettings3Line,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/components/i18n-provider";

/*
 * Three destinations, because there are only three things in the product: the
 * day, the consultations, and the people they belong to. A note is not a fourth
 * place — it lives on its consultation.
 */
const destinations = [
  { label: "Home", href: "/", icon: RiDashboardLine },
  { label: "Visits", href: "/visits", icon: RiCalendar2Line },
  { label: "Patients", href: "/patients", icon: RiGroupLine },
];

const support = [
  { label: "Help", href: "/help", icon: RiQuestionLine },
  { label: "Settings", href: "/settings", icon: RiSettings3Line },
];

/**
 * Which destination the current URL belongs to. This is the only thing in the
 * chrome that reacts to navigation, so it is the only thing that re-renders.
 */
export function useSection() {
  const pathname = usePathname();
  // Capture always belongs to the consultations it produces.
  const path = pathname.startsWith("/new") ? "/visits/new" : pathname;
  const match = [...destinations, ...support].find(
    (item) => item.href !== "/" && path.startsWith(item.href),
  );
  const { label, href } = match ?? destinations[0];
  /** True on a page inside the section, where the section is the way back. */
  const within = pathname !== href;
  return { label, href, within };
}

function NavItem({
  label,
  href,
  icon: Icon,
  active,
  children,
}: {
  label: string;
  href: string;
  icon: typeof RiDashboardLine;
  active: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={t(label)}
        className="h-10 gap-2.5 px-3"
        render={<Link href={href} aria-current={active ? "page" : undefined} />}
      >
        <Icon />
        <span className="flex-1">{t(label)}</span>
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function Nav({ waiting }: { waiting: number }) {
  const section = useSection();
  const { t } = useI18n();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="font-mono text-2xs tracking-[0.14em] uppercase">
          {t("Workspace")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {destinations.map((item) => (
              <NavItem key={item.label} {...item} active={section.label === item.label}>
                {/* The only number in the sidebar is work waiting on the doctor,
                    so it wears the amber that means "still owed" everywhere else. */}
                {item.label === "Visits" && waiting ? (
                  <Badge
                    className="h-5 min-w-5 rounded-full bg-warning/15 px-1.5 font-mono text-xs font-semibold text-warning tabular-nums group-data-[collapsible=icon]:hidden dark:bg-warning/20"
                    aria-label={t("{count} consultations need you", { count: waiting })}
                  >
                    {waiting}
                  </Badge>
                ) : null}
              </NavItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {support.map((item) => (
              <NavItem key={item.label} {...item} active={section.label === item.label} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

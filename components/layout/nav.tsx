"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiGroupLine,
  RiHome5Line,
  RiQuestionLine,
  RiSettings3Line,
} from "@remixicon/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/components/i18n-provider";

/*
 * Visits are not in here: they are the list below, which is the sidebar's
 * reason for being. What is left is the day's start page, the people, and the
 * two support pages at the foot.
 */
const places = {
  main: [
    { label: "Home", href: "/", icon: RiHome5Line },
    { label: "Patients", href: "/patients", icon: RiGroupLine },
  ],
  support: [
    { label: "Help", href: "/help", icon: RiQuestionLine },
    { label: "Settings", href: "/settings", icon: RiSettings3Line },
  ],
};

/** The only part of the sidebar's navigation that has to know the current route. */
export function Nav({ group }: { group: keyof typeof places }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupContent>
        <SidebarMenu>
          {places[group].map(({ label, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={active}
                  className="h-9 gap-2.5 px-2.5"
                  render={<Link href={href} aria-current={active ? "page" : undefined} />}
                >
                  <Icon />
                  <span>{t(label)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiGroupLine, RiHome5Line } from "@remixicon/react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/components/i18n-provider";

const places = [
  { label: "Home", href: "/", icon: RiHome5Line },
  { label: "Patients", href: "/patients", icon: RiGroupLine },
];

/** The only part of the sidebar's navigation that has to know the current route. */
export function Nav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <SidebarMenu>
      {places.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              isActive={active}
              render={<Link href={href} aria-current={active ? "page" : undefined} />}
            >
              <Icon />
              <span>{t(label)}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

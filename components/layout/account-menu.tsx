"use client";

import Link from "next/link";
import { RiExpandUpDownLine, RiLogoutBoxRLine, RiQuestionLine, RiSettings3Line } from "@remixicon/react";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chooseLanguage, languages } from "@/components/layout/language-switch";
import { useI18n } from "@/components/i18n-provider";

/**
 * The doctor, at the foot of the sidebar, and everything that belongs to them
 * rather than to the day's work: settings, help, language, theme, sign out.
 */
export function AccountMenu({ name, specialty, initials }: { name: string; specialty: string; initials: string }) {
  const { t, locale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-sidebar-accent">
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-2xs font-medium text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-xs font-medium">{name}</span>
          <span className="truncate text-2xs text-muted-foreground">{specialty}</span>
        </span>
        <RiExpandUpDownLine className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        <DropdownMenuItem render={<Link href="/settings" />}>
          <RiSettings3Line />
          {t("Settings")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/help" />}>
          <RiQuestionLine />
          {t("Help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={chooseLanguage}>
          {languages.map((language) => (
            <DropdownMenuRadioItem
              key={language.locale}
              value={language.locale}
              lang={language.locale}
              inset
              className={language.className}
            >
              {language.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={resolvedTheme === "dark"}
          onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
          inset
        >
          {t("Dark mode")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <RiLogoutBoxRLine className="rtl:-scale-x-100" />
          {t("Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

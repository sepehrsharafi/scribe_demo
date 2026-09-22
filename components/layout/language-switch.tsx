"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/components/i18n-provider";
import { localeCookie, type Locale } from "@/lib/i18n/locales";

const options: { locale: Locale; label: string; name: string }[] = [
  { locale: "en", label: "EN", name: "English" },
  { locale: "fa", label: "فا", name: "فارسی" },
];

/**
 * Demo-only. The choice goes in a cookie so the server renders the next page in
 * it, and the page reloads so nothing already on screen keeps the old language.
 */
export function LanguageSwitch() {
  const { locale } = useI18n();

  return (
    <ToggleGroup
      aria-label="Language"
      variant="outline"
      size="sm"
      spacing={0}
      value={[locale]}
      onValueChange={(next) => {
        const chosen = next[0];
        if (!chosen || chosen === locale) return;
        document.cookie = `${localeCookie}=${chosen}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.locale}
          value={option.locale}
          aria-label={option.name}
          lang={option.locale}
          // The Farsi label is drawn in the Farsi face even while English is showing.
          className={cn(
            "px-2.5 text-xs",
            option.locale === "fa" ? "font-(family-name:--font-farsi)" : "font-mono",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/components/i18n-provider";
import { localeCookie, type Locale } from "@/lib/i18n/locales";

export const languages: { locale: Locale; label: string; name: string; className?: string }[] = [
  { locale: "en", label: "EN", name: "English" },
  // Each name is drawn in its own face even while English is showing.
  { locale: "fa", label: "فا", name: "فارسی", className: "font-(family-name:--font-farsi)" },
  { locale: "ar", label: "ع", name: "العربية", className: "font-(family-name:--font-arabic)" },
];

/**
 * Demo-only. The choice goes in a cookie so the server renders the next page in
 * it, and the page reloads so nothing already on screen keeps the old language.
 */
export function chooseLanguage(locale: Locale) {
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

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
        const chosen = languages.find((language) => language.locale === next[0]);
        if (chosen && chosen.locale !== locale) chooseLanguage(chosen.locale);
      }}
    >
      {languages.map((language) => (
        <ToggleGroupItem
          key={language.locale}
          value={language.locale}
          aria-label={language.name}
          lang={language.locale}
          className={cn("px-2.5 text-xs", language.className)}
        >
          {language.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

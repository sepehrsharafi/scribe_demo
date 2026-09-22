// Demo-only: the Farsi interface exists for demonstrations, not for the
// product that ships. Everything language-related lives under lib/i18n.

export const locales = ["en", "fa"] as const;

export type Locale = (typeof locales)[number];

/** The cookie the language choice is kept in, so the server renders it too. */
export const localeCookie = "scribe-locale";

export function toLocale(value: string | undefined): Locale {
  return value === "fa" ? "fa" : "en";
}

export function direction(locale: Locale) {
  return locale === "fa" ? "rtl" : "ltr";
}

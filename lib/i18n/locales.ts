// Demo-only: the Farsi and Arabic interfaces exist for demonstrations, not for
// the product that ships. Everything language-related lives under lib/i18n.

export const locales = ["en", "fa", "ar"] as const;

export type Locale = (typeof locales)[number];

/** The cookie the language choice is kept in, so the server renders it too. */
export const localeCookie = "scribe-locale";

export function toLocale(value: string | undefined): Locale {
  return locales.find((locale) => locale === value) ?? "en";
}

export function direction(locale: Locale) {
  return locale === "en" ? "ltr" : "rtl";
}

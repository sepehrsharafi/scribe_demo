import type { Locale } from "@/lib/i18n/locales";
import { farsiStrings } from "@/lib/i18n/farsi-strings";

/**
 * Interface copy is written in English in the markup, and the English text is
 * its own key: `t("Approve note")`. `{name}` placeholders are filled from `values`.
 */
export type Translate = (text: string, values?: Record<string, string | number>) => string;

const warned = new Set<string>();

function lookup(locale: Locale, text: string) {
  if (locale === "en") return text;
  const found = farsiStrings[text];
  if (found !== undefined) return found;
  if (process.env.NODE_ENV !== "production" && !warned.has(text)) {
    warned.add(text);
    console.warn(`[i18n] No Farsi for: ${JSON.stringify(text)}`);
  }
  return text;
}

function translator(locale: Locale): Translate {
  return (text, values) => {
    const template = lookup(locale, text);
    return values
      ? template.replace(/\{(\w+)\}/g, (match, key: string) =>
          key in values ? String(values[key]) : match,
        )
      : template;
  };
}

const translators = { en: translator("en"), fa: translator("fa") };

export function translate(locale: Locale): Translate {
  return translators[locale];
}

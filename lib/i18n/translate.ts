import type { Locale } from "@/lib/i18n/locales";
import { arabicStrings } from "@/lib/i18n/arabic-strings";
import { farsiStrings } from "@/lib/i18n/farsi-strings";

/**
 * Interface copy is written in English in the markup, and the English text is
 * its own key: `t("Approve note")`. `{name}` placeholders are filled from `values`.
 */
export type Translate = (text: string, values?: Record<string, string | number>) => string;

/** The interface copy of each language other than English, and what to call it when a string is missing. */
const dictionaries = {
  fa: { name: "Farsi", strings: farsiStrings },
  ar: { name: "Arabic", strings: arabicStrings },
};

const warned = new Set<string>();

function lookup(locale: Locale, text: string) {
  if (locale === "en") return text;
  const { name, strings } = dictionaries[locale];
  const found = strings[text];
  if (found !== undefined) return found;
  if (process.env.NODE_ENV !== "production" && !warned.has(`${locale}:${text}`)) {
    warned.add(`${locale}:${text}`);
    console.warn(`[i18n] No ${name} for: ${JSON.stringify(text)}`);
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

const translators = { en: translator("en"), fa: translator("fa"), ar: translator("ar") };

export function translate(locale: Locale): Translate {
  return translators[locale];
}

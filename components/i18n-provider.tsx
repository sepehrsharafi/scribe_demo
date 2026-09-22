"use client";

import { createContext, use, type ReactNode } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { demo } from "@/lib/demo-data";
import { direction, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

const LocaleContext = createContext<Locale>("en");

/** Hands the request's language to client components, and its direction to Base UI. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleContext value={locale}>
      <DirectionProvider direction={direction(locale)}>{children}</DirectionProvider>
    </LocaleContext>
  );
}

/** The client-side twin of `getI18n()` in lib/i18n/server.ts. */
export function useI18n() {
  const locale = use(LocaleContext);
  return { locale, dir: direction(locale), t: translate(locale), demo: demo(locale) };
}

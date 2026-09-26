"use client";

import { createContext, use, type ReactNode } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { demo, type Demo } from "@/lib/demo-data";
import { direction, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";
import type { WorkspaceChanges } from "@/lib/workspace";

const LocaleContext = createContext<{ locale: Locale; demo: Demo }>({
  locale: "en",
  demo: demo("en"),
});

/**
 * Hands the request's language to client components, and its direction to
 * Base UI — along with the demo as the server rendered it, this browser's
 * changes and clock included, so a client list never disagrees with the page.
 */
export function I18nProvider({
  locale,
  changes,
  now,
  children,
}: {
  locale: Locale;
  changes: WorkspaceChanges;
  now: number;
  children: ReactNode;
}) {
  return (
    <LocaleContext value={{ locale, demo: demo(locale, changes, now) }}>
      <DirectionProvider direction={direction(locale)}>{children}</DirectionProvider>
    </LocaleContext>
  );
}

/** The client-side twin of `getI18n()` in lib/i18n/server.ts. */
export function useI18n() {
  const { locale, demo } = use(LocaleContext);
  return { locale, dir: direction(locale), t: translate(locale), demo };
}

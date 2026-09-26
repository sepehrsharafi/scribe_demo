import { cache } from "react";
import { cookies } from "next/headers";
import { demo } from "@/lib/demo-data";
import { direction, localeCookie, toLocale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";
import { parseChanges, workspaceCookie } from "@/lib/workspace";

/**
 * The language this request renders in, and the demo as this browser has left
 * it, for server components. Cached per request so that every component —
 * layout, sidebar, page — reads the same clock and agrees on every status.
 */
export const getI18n = cache(async () => {
  const store = await cookies();
  const locale = toLocale(store.get(localeCookie)?.value);
  const changes = parseChanges(store.get(workspaceCookie)?.value);
  const now = Date.now();
  return {
    locale,
    dir: direction(locale),
    t: translate(locale),
    demo: demo(locale, changes, now),
    changes,
    now,
  };
});

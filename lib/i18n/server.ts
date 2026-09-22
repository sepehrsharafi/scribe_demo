import { cookies } from "next/headers";
import { demo } from "@/lib/demo-data";
import { direction, localeCookie, toLocale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

/** The language this request renders in, for server components. */
export async function getI18n() {
  const locale = toLocale((await cookies()).get(localeCookie)?.value);
  return { locale, dir: direction(locale), t: translate(locale), demo: demo(locale) };
}

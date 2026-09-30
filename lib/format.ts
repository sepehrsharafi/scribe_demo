import type { Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

/**
 * The day the demo is set on. The data stores dates as yyyy-mm-dd and nothing
 * else; every date, relative day and age on screen is worked out from them
 * here, so a second language needs no dates of its own.
 */
export const demoToday = "2026-09-22";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** yyyy-mm-dd (or yyyy-mm) as midnight UTC, so no timezone can move the day. */
const utc = (iso: string) => {
  const [year, month, day = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/* English is spelled out by hand so the server and every browser print the
   same characters — ICU versions disagree on "Sep" and "Sept". Farsi uses the
   Persian calendar, which only Intl knows; digits stay ASCII because the Farsi
   font draws them as Persian numerals. */
const persian = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fa-IR-u-nu-latn", { ...options, timeZone: "UTC" });

const fa = {
  date: persian({ day: "numeric", month: "long", year: "numeric" }),
  month: persian({ month: "long", year: "numeric" }),
  weekday: persian({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
};

const daysBetween = (from: string, to: string) =>
  Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);

export type Format = ReturnType<typeof formatter>;

/** Date readouts in one language. */
export function formatter(locale: Locale) {
  const t = translate(locale);

  /** 14 May 1988, or 22 Sep 2026 with a short month. */
  function date(iso: string, month: "long" | "short" = "long") {
    if (locale === "fa") return fa.date.format(utc(iso));
    const at = utc(iso);
    const name = months[at.getUTCMonth()];
    return `${at.getUTCDate()} ${month === "short" ? name.slice(0, 3) : name} ${at.getUTCFullYear()}`;
  }

  return {
    date,

    /** Today, Yesterday, or the date itself. */
    day(iso: string) {
      const ago = daysBetween(iso, demoToday);
      if (ago === 0) return t("Today");
      if (ago === 1) return t("Yesterday");
      return date(iso, "short");
    },

    /** Tuesday · 22 September 2026 */
    longDay(iso: string) {
      if (locale === "fa") return fa.weekday.format(utc(iso));
      return `${weekdays[utc(iso).getUTCDay()]} · ${date(iso)}`;
    },

    /** March 2021 */
    month(iso: string) {
      if (locale === "fa") return fa.month.format(utc(iso));
      const at = utc(iso);
      return `${months[at.getUTCMonth()]} ${at.getUTCFullYear()}`;
    },

    /** Whole years between a date of birth and the demo's today. */
    age(born: string) {
      const birth = utc(born);
      const now = utc(demoToday);
      const had = now.getUTCMonth() > birth.getUTCMonth() ||
        (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() >= birth.getUTCDate());
      return now.getUTCFullYear() - birth.getUTCFullYear() - (had ? 0 : 1);
    },

    /** Two letters for an avatar. */
    initials(name: string) {
      return name
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .slice(0, 2)
        // Persian letters would join into a word; a zero-width non-joiner keeps them apart.
        .join(locale === "fa" ? "‌" : "")
        .toUpperCase();
    },
  };
}

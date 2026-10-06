import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { safeReturnPath } from "@/lib/session";
import { BrandMark } from "@/components/layout/brand";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RibbonArtwork } from "./ribbon-artwork";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Scribe" };

/**
 * The sign-in screen. On a desktop: the form on one half, the artwork on the
 * other, its rounded inner corners turned towards the form (in either reading
 * direction). On a phone the artwork shrinks to a banner above the form.
 */
export default async function SignIn({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const { t } = await getI18n();

  return (
    <main className="grid min-h-svh grid-rows-[auto_1fr] bg-background lg:grid-rows-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex min-w-0 flex-col px-4 pt-4 pb-6 sm:px-8 lg:px-12 lg:pt-8">
        <header className="flex items-center justify-end gap-3 lg:justify-between">
          <div className="hidden items-center gap-2.5 lg:flex">
            <BrandMark className="size-5" />
            <span className="text-base font-semibold tracking-tight">{t("Scribe")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-8 pb-10 lg:justify-center lg:pt-10">
          <SignInForm returnTo={safeReturnPath(Array.isArray(next) ? next[0] : next)} />
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-start">
          {t("Demo workspace · synthetic patients only")}
        </p>
      </div>

      <div className="relative isolate order-first h-44 overflow-hidden rounded-es-[2rem] rounded-ee-[2rem] lg:sticky lg:top-0 lg:order-none lg:h-svh lg:rounded-ss-[2.5rem] lg:rounded-es-[2.5rem] lg:rounded-ee-none">
        <RibbonArtwork />
        {/* Scoped to the dark theme, so the mark and the words come out light
            on the artwork whichever theme the rest of the page is in. */}
        <div className="dark relative flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-foreground text-shadow-lg text-shadow-[oklch(0.2_0.09_284/0.5)] lg:gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <BrandMark className="size-8 gap-1 lg:size-12" />
            <p className="text-4xl font-semibold tracking-tight lg:text-6xl">{t("Scribe")}</p>
          </div>
          <p className="max-w-xs text-sm lg:text-lg">{t("Your notes, written while you listen.")}</p>
        </div>
      </div>
    </main>
  );
}

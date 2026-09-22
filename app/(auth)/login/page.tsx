import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { safeReturnPath } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Scribe" };

/* Deterministic bar heights — random values would break hydration. */
const wave = Array.from({ length: 48 }, (_, index) => ({
  height: 18 + ((index * 37) % 11) * 7 + ((index * 13) % 5) * 4,
  delay: `${((index * 29) % 12) * -0.1}s`,
}));

function BrandMark() {
  return (
    <span aria-hidden="true" className="grid size-7 shrink-0 grid-cols-2 grid-rows-2 gap-0.5">
      <i className="bg-current" />
      <i className="bg-primary" />
      <i className="bg-current opacity-25" />
      <i className="bg-current" />
    </span>
  );
}

/**
 * The sign-in screen. One side is the product stated as a poster — three verbs,
 * a live signal, the promise in three ruled columns — and the other is the form,
 * and nothing else.
 */
export default async function SignIn({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const { t } = await getI18n();

  const steps = [
    { verb: t("Listen."), copy: t("The consultation is captured in encrypted chunks as you talk.") },
    { verb: t("Draft."), copy: t("A structured note, drawn only from what was said.") },
    { verb: t("Sign."), copy: t("You read it, correct it, and put your name to it.") },
  ];

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex xl:p-16 dark:bg-card dark:text-foreground">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="grid gap-1">
            <span className="font-heading text-lg leading-none font-semibold tracking-tight">
              {t("Scribe")}
            </span>
            <span className="font-mono text-2xs tracking-[0.14em] uppercase opacity-60">
              {t("Clinical notes")}
            </span>
          </span>
        </div>

        <div>
          <h2 className="font-heading text-7xl leading-[0.95] font-bold tracking-tighter xl:text-8xl">
            {steps.map((step, index) => (
              <span
                key={step.verb}
                className={index === steps.length - 1 ? "block text-primary" : "block"}
              >
                {step.verb}
              </span>
            ))}
          </h2>

          {/* A live signal: the one moving thing on the screen. */}
          <div aria-hidden="true" className="mt-12 flex h-16 items-center gap-1">
            {wave.map((bar, index) => (
              <span
                key={index}
                className="w-1 origin-center animate-[scribe-wave_1.6s_ease-in-out_infinite] rounded-full bg-primary/80 motion-reduce:animate-none"
                style={{ height: `${bar.height}%`, animationDelay: bar.delay }}
              />
            ))}
          </div>

          <ol className="mt-12 grid grid-cols-3 border-t border-current/15">
            {steps.map((step, index) => (
              <li key={step.verb} className="border-e border-current/15 pe-6 pt-5 last:border-e-0 [&:not(:first-child)]:ps-6">
                <span className="font-mono text-2xs tabular-nums opacity-50">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="font-mono text-2xs tracking-[0.14em] uppercase opacity-50">
          {t("Demo workspace · synthetic patients only")}
        </p>
      </section>

      <SignInForm
        returnTo={safeReturnPath(Array.isArray(next) ? next[0] : next)}
        poster={
          // The poster, folded down to a band for screens too narrow for two columns.
          <div className="-mx-6 mt-6 bg-foreground px-6 py-8 text-background sm:-mx-10 sm:px-10 dark:bg-card dark:text-foreground">
            <p className="font-heading text-5xl leading-[0.95] font-bold tracking-tighter">
              {steps.map((step, index) => (
                <span
                  key={step.verb}
                  className={index === steps.length - 1 ? "block text-primary" : "block"}
                >
                  {step.verb}
                </span>
              ))}
            </p>
            <div aria-hidden="true" className="mt-6 flex h-10 items-center gap-1">
              {wave.slice(0, 32).map((bar, index) => (
                <span
                  key={index}
                  className="w-1 origin-center animate-[scribe-wave_1.6s_ease-in-out_infinite] rounded-full bg-primary/80 motion-reduce:animate-none"
                  style={{ height: `${bar.height}%`, animationDelay: bar.delay }}
                />
              ))}
            </div>
          </div>
        }
      />
    </main>
  );
}

"use client";

import {
  RiArrowRightLine,
  RiInformationLine,
  RiMailLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eyebrow } from "@/components/page-layout";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signIn } from "@/lib/actions/auth";
import { isValidEmail } from "@/lib/session";

const codeLength = 6;
const resendAfter = 30;

/** How a step enters and leaves: a short rise, never a slide across the page. */
const step = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

/**
 * Email, then a one-time code. In the demo any six digits are accepted; the
 * screen still behaves like the real thing — a resend timer, a way back to
 * change the address, and the code submits itself once it is complete.
 */
export function SignInForm({
  returnTo,
  poster,
}: {
  returnTo: string;
  /** The product in brief, shown above the form where there is no room beside it. */
  poster: ReactNode;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!wait) return;
    const timer = window.setTimeout(() => setWait(wait - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (!isValidEmail(email)) {
      setError(t("Enter a valid email address."));
      return;
    }
    setError(null);
    setCode("");
    setSent(true);
    setWait(resendAfter);
    toast.success(t("Code sent to {email}", { email: email.trim() }));
  }

  function verify(value = code) {
    if (value.length !== codeLength || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, value, returnTo);
      if (result?.error) setError(t("That code is incomplete. Enter all six digits."));
    });
  }

  return (
    <section className="flex min-h-svh flex-col px-6 py-6 sm:px-10">
      <div className="flex items-center justify-between gap-3">
        <span aria-hidden="true" className="grid size-6 grid-cols-2 grid-rows-2 gap-0.5 lg:invisible">
          <i className="bg-foreground" />
          <i className="bg-primary" />
          <i className="bg-border" />
          <i className="bg-foreground" />
        </span>
        <span className="flex items-center gap-2">
          <LanguageSwitch />
          <ThemeToggle />
        </span>
      </div>

      <div className="lg:hidden">{poster}</div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <AnimatePresence mode="wait" initial={false}>
          {!sent ? (
            <motion.form key="email" {...step} onSubmit={sendCode} noValidate>
              <Eyebrow>{t("Step {current} of {total}", { current: 1, total: 2 })}</Eyebrow>
              <h1 className="mt-3 font-heading text-3xl leading-tight font-bold tracking-tight">
                {t("Sign in to Scribe")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("No password. We email you a one-time code each time you sign in.")}
              </p>

              <div className="mt-8 grid gap-2">
                <Label htmlFor="email">{t("Work email")}</Label>
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <RiMailLine />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    dir="ltr"
                    value={email}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@practice.com"
                  />
                </InputGroup>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>

              <Button type="submit" size="lg" className="mt-6 h-11 w-full">
                {t("Send code")}
                <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
              </Button>
            </motion.form>
          ) : (
            <motion.div key="code" {...step}>
              <Eyebrow>{t("Step {current} of {total}", { current: 2, total: 2 })}</Eyebrow>
              <h1 className="mt-3 font-heading text-3xl leading-tight font-bold tracking-tight">
                {t("Check your inbox")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("We sent a six-digit code to")}{" "}
                <span dir="ltr" className="font-medium text-foreground">
                  {email.trim()}
                </span>
                .{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                  }}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  {t("Change")}
                </button>
              </p>

              {/* A code reads left to right in every language. */}
              <div dir="ltr" className="mt-8 flex justify-center">
                <InputOTP
                  maxLength={codeLength}
                  value={code}
                  autoFocus
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  onChange={setCode}
                  onComplete={verify}
                  disabled={pending}
                  aria-label={t("One-time code")}
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: codeLength }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-12 rounded-2xl border font-mono text-lg first:rounded-2xl last:rounded-2xl sm:size-13"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error ? <p className="mt-3 text-center text-xs text-destructive">{error}</p> : null}

              <Button
                size="lg"
                className="mt-8 h-11 w-full"
                disabled={code.length !== codeLength || pending}
                onClick={() => verify()}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {t("Verify and sign in")}
              </Button>

              <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
                {wait ? (
                  <span className="font-mono tabular-nums">
                    {t("Resend code in {seconds}s", { seconds: wait })}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendCode()}
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    {t("Resend code")}
                  </button>
                )}
              </div>

              <p className="mt-8 flex items-start gap-2 rounded-2xl border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
                <RiInformationLine className="mt-0.5 size-3.5 shrink-0" />
                {t("Demo workspace: no email is sent. Any six digits will sign you in.")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="flex items-center justify-center gap-2 font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
        <RiShieldCheckLine className="size-3.5" />
        {t("One-time codes · no passwords stored")}
      </p>
    </section>
  );
}

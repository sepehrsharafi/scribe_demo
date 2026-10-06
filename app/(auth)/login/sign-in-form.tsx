"use client";

import { RiArrowRightLine, RiInformationLine } from "@remixicon/react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/components/i18n-provider";
import { signIn } from "@/lib/actions/auth";
import { isValidEmail } from "@/lib/session";

const codeLength = 6;
const resendAfter = 30;

/**
 * Email, then a one-time code. In the demo any six digits are accepted; the
 * screen still behaves like the real thing — a resend timer, a way back to
 * change the address, and the code submits itself once it is complete.
 */
export function SignInForm({ returnTo }: { returnTo: string }) {
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
    <div key={sent ? "code" : "email"} className="animate-in duration-300 fade-in slide-in-from-bottom-2">
      {!sent ? (
        <form onSubmit={sendCode} noValidate>
          <h1 className="text-3xl font-semibold tracking-tight">{t("Welcome back")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Sign in with your work email. We'll send you a one-time code.")}
          </p>

          <div className="mt-10 grid gap-1">
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              {t("Work email")}
            </Label>
            {/* An underline rather than a box; focus thickens it to the primary. */}
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              dir="ltr"
              value={email}
              aria-invalid={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@practice.com"
              className="h-11 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:shadow-[inset_0_-1px_0_var(--color-primary)] focus-visible:ring-0 aria-invalid:shadow-[inset_0_-1px_0_var(--color-destructive)] aria-invalid:ring-0 dark:bg-transparent"
            />
            {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>

          <Button type="submit" size="lg" className="mt-8 h-11 w-full">
            {t("Send code")}
            <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
          </Button>
        </form>
      ) : (
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("Check your inbox")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
          <div dir="ltr" className="mt-10">
            <InputOTP
              containerClassName="w-full"
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
              <InputOTPGroup className="w-full justify-between gap-2">
                {Array.from({ length: codeLength }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-11 rounded-lg border text-xl tabular-nums first:rounded-lg last:rounded-lg sm:size-12"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

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
              <span className="tabular-nums">{t("Resend code in {seconds}s", { seconds: wait })}</span>
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

          <p className="mt-8 flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
            <RiInformationLine className="mt-0.5 size-3.5 shrink-0" />
            {t("Demo workspace: no email is sent. Any six digits will sign you in.")}
          </p>
        </div>
      )}
    </div>
  );
}

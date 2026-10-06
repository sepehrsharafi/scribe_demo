"use client";

import { RiFileTextLine, RiInformationLine, RiMailCheckLine, RiMailLine, RiMailSendLine } from "@remixicon/react";
import type { Editor } from "@tiptap/react";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { EmailedInstructions } from "@/lib/demo-data";
import { emailInstructions } from "@/lib/actions/workspace";
import { clockTime } from "@/lib/format";
import { isValidEmail } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { WriteUp } from "@/components/use-write-up";
import { useI18n } from "@/components/i18n-provider";

/** Who the letter goes to, and whether it already went. Worked out on the server. */
export type InstructionsEmail = {
  visitId: string;
  patientId: string;
  firstName: string;
  /** The patient's address on file, if they have given one. */
  address?: string;
  /** The last time the letter was emailed. */
  sent?: EmailedInstructions;
  doctor: string;
};

/** An address inside a sentence keeps its own left-to-right order in Farsi and Arabic. */
const isolated = (address: string) => `⁨${address}⁩`;

/** Long enough to read "Sending", short enough not to be waited on. */
const sendingFor = 700;

/**
 * The letter's first line and the prose after it, for the preview in the email.
 * Later headings are left out: run together with the text they head, they read
 * as one garbled sentence.
 */
function letterPreview(editor: Editor | null) {
  const blocks: string[] = [];
  editor?.state.doc.forEach((node) => {
    const text = node.textBetween(0, node.content.size, " ").trim();
    if (text && (!blocks.length || node.type.name !== "heading")) blocks.push(text);
  });
  return { title: blocks[0] ?? "", body: blocks.slice(1).join(" ") };
}

/**
 * Sends the patient their letter, once the doctor has approved it — and says
 * where it went and when, and whether it has changed since. Nothing is ever
 * unsent: sending again sends the letter as it reads now.
 */
export function EmailInstructions({
  email,
  writeUp,
  date,
  children,
}: {
  email: InstructionsEmail;
  writeUp: WriteUp;
  /** The visit's date, as the letter is dated. */
  date: string;
  /** The letter's own heading line, which the status sits beneath. */
  children: ReactNode;
}) {
  const { t, f } = useI18n();
  const [open, setOpen] = useState(false);
  // Each opening starts afresh from the address on file.
  const [opened, setOpened] = useState(0);
  const { sent } = email;
  const blocked = !writeUp.approved
    ? t("Approve the visit to email these instructions.")
    : writeUp.edited
      ? t("Approve the changes to email these instructions.")
      : null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
        {children}
        {sent ? (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <RiMailCheckLine className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {t("Emailed to")}{" "}
              <span dir="ltr" className="font-medium text-foreground">
                {sent.to}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {f.day(sent.day)} {sent.time}
            </span>
            {writeUp.editedSinceEmail ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-warning">{t("Changed since it was emailed")}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {blocked ? <span className="text-xs text-muted-foreground">{blocked}</span> : null}
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(blocked)}
          onClick={() => {
            setOpened(opened + 1);
            setOpen(true);
          }}
        >
          <RiMailSendLine data-icon="inline-start" />
          {sent ? t("Send again") : t("Email to patient")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <SendForm key={opened} email={email} writeUp={writeUp} date={date} onSent={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SendForm({
  email,
  writeUp,
  date,
  onSent,
}: {
  email: InstructionsEmail;
  writeUp: WriteUp;
  date: string;
  onSent: () => void;
}) {
  const { t } = useI18n();
  const [to, setTo] = useState(email.address ?? email.sent?.to ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const letter = letterPreview(writeUp.handout);
  const typed = to.trim();
  const fresh = typed !== (email.address ?? "");

  function send(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(typed)) {
      setError(t("Enter a valid email address."));
      return;
    }
    setError(null);
    startSending(async () => {
      try {
        await Promise.all([
          emailInstructions({
            visitId: email.visitId,
            to: typed,
            time: clockTime(),
            rememberFor: fresh ? email.patientId : undefined,
          }),
          new Promise((resolve) => window.setTimeout(resolve, sendingFor)),
        ]);
      } catch {
        setError(t("That did not go through. Try again."));
        return;
      }
      writeUp.emailSent();
      onSent();
      toast.success(t("Instructions emailed to {email}", { email: isolated(typed) }));
    });
  }

  return (
    <form onSubmit={send} noValidate className="grid gap-6">
      <DialogHeader>
        <DialogTitle>{t("Email instructions to {name}", { name: email.firstName })}</DialogTitle>
        <DialogDescription>{t("The letter goes as it reads now. Emails cannot be unsent.")}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="instructions-to">{t("To")}</Label>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <RiMailLine />
          </InputGroupAddon>
          <InputGroupInput
            id="instructions-to"
            type="email"
            dir="ltr"
            autoComplete="off"
            autoFocus={!email.address}
            value={to}
            aria-invalid={Boolean(error)}
            onChange={(event) => setTo(event.target.value)}
            placeholder="patient@example.com"
          />
        </InputGroup>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !email.address ? (
          <p className="text-xs text-muted-foreground">
            {t("{name} has no email address on file. The one you enter is kept for next time.", {
              name: email.firstName,
            })}
          </p>
        ) : fresh && typed ? (
          <p className="text-xs text-muted-foreground">
            {t("Replaces {email} on file, for next time.", { email: isolated(email.address) })}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid gap-1 border-b bg-muted/50 px-4 py-3">
          <span className="text-xs text-muted-foreground">{t("Subject")}</span>
          <span className="text-sm font-medium">
            {t("Your visit on {date} — instructions from {doctor}", { date, doctor: email.doctor })}
          </span>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <RiFileTextLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="grid min-w-0 gap-1">
            <span className="text-sm font-medium">{letter.title || t("Instructions")}</span>
            {letter.body ? <p className="line-clamp-3 text-xs text-muted-foreground">{letter.body}</p> : null}
          </div>
        </div>
      </div>

      <DialogFooter className="sm:items-center">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:me-auto">
          <RiInformationLine className="size-4 shrink-0" aria-hidden="true" />
          {t("Demo workspace: no email is actually sent.")}
        </p>
        <DialogClose render={<Button type="button" variant="outline" disabled={sending} />}>{t("Cancel")}</DialogClose>
        <Button type="submit" disabled={sending}>
          {sending ? <Spinner data-icon="inline-start" /> : <RiMailSendLine data-icon="inline-start" />}
          {sending ? t("Sending…") : t("Send")}
        </Button>
      </DialogFooter>
    </form>
  );
}

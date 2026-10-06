"use client";

import { RiShieldCheckLine } from "@remixicon/react";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { resetWorkspace } from "@/lib/actions/workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "recording", label: "Recording" },
  { id: "notes", label: "Note review" },
  { id: "privacy", label: "Privacy" },
];

type Status = "clean" | "dirty" | "saved" | "cleared";

const statusLabel: Record<Status, string> = {
  clean: "All preferences are up to date",
  dirty: "Unsaved changes",
  saved: "Changes saved",
  cleared: "Recovered demo audio cleared",
};

const defaults = {
  audioRecovery: true,
  soundConfirmation: true,
  autoMicCheck: true,
  openTranscript: true,
  highlightGaps: true,
  compactNote: false,
  localRecovery: true,
  analytics: false,
};

function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  const { t } = useI18n();

  return (
    <FieldLabel className="w-full">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{t(label)}</FieldTitle>
          <FieldDescription>{t(description)}</FieldDescription>
        </FieldContent>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </Field>
    </FieldLabel>
  );
}

/** Every tab is the same card: a head, a body, and the save bar. */
function Pane({
  title,
  description,
  status,
  onSave,
  children,
}: {
  title: string;
  description: string;
  status: Status;
  onSave: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t(title)}</CardTitle>
        <CardDescription>{t(description)}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              status === "dirty" ? "bg-warning" : "bg-primary",
            )}
          />
          {t(statusLabel[status])}
        </span>
        <Button onClick={onSave}>{t("Save changes")}</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Recordings, added patients and approvals made in this browser are kept so
 * every page agrees on them. This puts the demo back as it shipped, ready for
 * the next walkthrough.
 */
function ResetDemo() {
  const { t } = useI18n();
  const [resetting, startReset] = useTransition();

  return (
    <Field orientation="horizontal" className="rounded-xl border p-4">
      <FieldContent>
        <FieldTitle>{t("Changes made in this browser")}</FieldTitle>
        <FieldDescription>
          {t("New recordings, added patients and approvals. Resetting brings back the demo as it started.")}
        </FieldDescription>
      </FieldContent>
      <Button
        variant="outline"
        size="sm"
        disabled={resetting}
        onClick={() =>
          startReset(async () => {
            await resetWorkspace();
            toast.success(t("Demo reset"));
          })
        }
      >
        {t("Reset demo")}
      </Button>
    </Field>
  );
}

export function SettingsForm({
  doctor,
  recoveredSeconds,
}: {
  doctor: { name: string; specialty: string; email: string; registration: string };
  recoveredSeconds: number;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("clean");
  const [prefs, setPrefs] = useState(defaults);

  function toggle(key: keyof typeof prefs) {
    setPrefs({ ...prefs, [key]: !prefs[key] });
    setStatus("dirty");
  }

  function save() {
    setStatus("saved");
    window.setTimeout(() => setStatus("clean"), 2200);
  }

  return (
    <Tabs defaultValue="profile" className="gap-6">
      <TabsList variant="line" className="h-11 w-full justify-start gap-6 overflow-x-auto border-b [scrollbar-width:none]">
        {tabs.map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {t(label)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile">
        <Pane
          status={status}
          onSave={save}
          title="Profile"
          description="Your name and details in this demo workspace."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { id: "display-name", label: "Display name", value: doctor.name },
              { id: "specialty", label: "Specialty", value: doctor.specialty },
              { id: "practice-email", label: "Practice email", value: doctor.email },
              {
                id: "registration",
                label: "Registration number",
                value: doctor.registration,
              },
            ].map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{t(field.label)}</Label>
                <Input
                  id={field.id}
                  defaultValue={field.value}
                  onChange={() => setStatus("dirty")}
                />
              </div>
            ))}
          </div>
        </Pane>
      </TabsContent>

      <TabsContent value="recording">
        <Pane
          status={status}
          onSave={save}
          title="Recording"
          description="Capture safeguards and microphone behaviour."
        >
          <div className="grid gap-4">
            <SwitchField
              checked={prefs.audioRecovery}
              onCheckedChange={() => toggle("audioRecovery")}
              label="Audio recovery"
              description="Keep encrypted recording chunks available after a browser interruption."
            />
            <SwitchField
              checked={prefs.soundConfirmation}
              onCheckedChange={() => toggle("soundConfirmation")}
              label="Sound confirmation"
              description="Play a quiet tone when recording starts and stops."
            />
            <SwitchField
              checked={prefs.autoMicCheck}
              onCheckedChange={() => toggle("autoMicCheck")}
              label="Automatic microphone check"
              description="Verify a live signal is present before the consultation begins."
            />
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="microphone">{t("Preferred microphone")}</Label>
              <Select
                defaultValue="system"
                onValueChange={() => setStatus("dirty")}
                items={{
                  system: t("System default"),
                  external: t("External USB microphone"),
                  laptop: t("Built-in microphone"),
                }}
              >
                <SelectTrigger id="microphone" className="sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t("System default")}</SelectItem>
                  <SelectItem value="external">{t("External USB microphone")}</SelectItem>
                  <SelectItem value="laptop">{t("Built-in microphone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Pane>
      </TabsContent>

      <TabsContent value="notes">
        <Pane
          status={status}
          onSave={save}
          title="Note review"
          description="How draft notes are presented when you sit down to review them."
        >
          <div className="grid gap-4">
            <SwitchField
              checked={prefs.openTranscript}
              onCheckedChange={() => toggle("openTranscript")}
              label="Open the evidence rail beside drafts"
              description="Show the transcript lines behind a section as soon as a note becomes ready."
            />
            <SwitchField
              checked={prefs.highlightGaps}
              onCheckedChange={() => toggle("highlightGaps")}
              label="Highlight explicit gaps"
              description="Call attention to sections that were never discussed in the consultation."
            />
            <SwitchField
              checked={prefs.compactNote}
              onCheckedChange={() => toggle("compactNote")}
              label="Compact note spacing"
              description="Fit more of a long note on screen while keeping the reading size."
            />
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="note-structure">{t("Default note structure")}</Label>
              <Select
                defaultValue="general"
                onValueChange={() => setStatus("dirty")}
                items={{
                  general: t("General consultation"),
                  soap: t("SOAP"),
                  narrative: t("Narrative summary"),
                }}
              >
                <SelectTrigger id="note-structure" className="sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("General consultation")}</SelectItem>
                  <SelectItem value="soap">{t("SOAP")}</SelectItem>
                  <SelectItem value="narrative">{t("Narrative summary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Pane>
      </TabsContent>

      <TabsContent value="privacy">
        <Pane
          status={status}
          onSave={save}
          title="Privacy and recovery"
          description="What this synthetic workspace keeps, and for how long."
        >
          <div className="grid gap-4">
            <Alert>
              <RiShieldCheckLine />
              <AlertTitle>{t("Demo data only")}</AlertTitle>
              <AlertDescription>
                {t("No real patient information should be entered into this environment.")}
              </AlertDescription>
            </Alert>
            <SwitchField
              checked={prefs.localRecovery}
              onCheckedChange={() => toggle("localRecovery")}
              label="Local recording recovery"
              description="Retain encrypted chunks on this device until a visit has uploaded successfully."
            />
            <SwitchField
              checked={prefs.analytics}
              onCheckedChange={() => toggle("analytics")}
              label="Anonymous product analytics"
              description="Share non-clinical interaction data to improve the demo experience."
            />
            <Field orientation="horizontal" className="rounded-xl border p-4">
              <FieldContent>
                <FieldTitle>{t("Recovered demo audio")}</FieldTitle>
                <FieldDescription>
                  {t("One synthetic recording · {duration}", {
                    duration: formatDuration(recoveredSeconds),
                  })}
                </FieldDescription>
              </FieldContent>
              <Button variant="outline" size="sm" onClick={() => setStatus("cleared")}>
                {t("Clear demo data")}
              </Button>
            </Field>
            <ResetDemo />
          </div>
        </Pane>
      </TabsContent>
    </Tabs>
  );
}

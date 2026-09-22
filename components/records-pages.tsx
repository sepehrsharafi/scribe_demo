"use client";

import Link from "next/link";
import {
  RiFileTextLine,
  RiGroupLine,
  RiMailLine,
  RiMicLine,
  RiQuestionLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiUserLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react";
import { useMemo, useState, type ReactNode } from "react";
import {
  doctor,
  getNote,
  getPatient,
  getVisitsForPatient,
  patients,
  visitFilters,
  visits,
  type VisitFilter,
  type VisitStatus,
} from "@/lib/demo-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Cell,
  Eyebrow,
  Page,
  PageHead,
  PatientAvatar,
  RecordHead,
  RecordList,
  RecordRow,
  RowChevron,
  RowIndex,
  StatusBadge,
  visitRowCols,
} from "@/components/shared";

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <InputGroup className="sm:max-w-80">
      <InputGroupAddon>
        <RiSearchLine />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </InputGroup>
  );
}

function Filters<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onChange(next[0] as T);
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.id} value={option.id} className="px-3">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

const newConsultationAction = (
  <Button render={<Link href="/new" />}>
    <RiMicLine data-icon="inline-start" />
    New consultation
  </Button>
);

/* ---------------------------------------------------------------- Visits */

function noteState(visitId: string, status: VisitStatus) {
  if (getNote(visitId)) return status === "signed" ? "Signed note" : "Draft ready to read";
  if (status === "failed") return "Processing stopped";
  return "Note not drafted yet";
}

export function VisitsPage({ initialFilter = "all" }: { initialFilter?: VisitFilter }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VisitFilter>(initialFilter);

  const filtered = useMemo(
    () =>
      visits.filter((visit) => {
        const patient = getPatient(visit.patientId);
        const haystack = `${patient?.name ?? ""} ${visit.reason}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesFilter =
          filter === "all" || visit.status === (filter as VisitStatus);
        return matchesQuery && matchesFilter;
      }),
    [filter, query],
  );

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow="Clinical worklist"
        title="Visits"
        description="Every consultation from captured audio through to a signed clinical note."
        actions={newConsultationAction}
      />

      <Toolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search patient or reason"
        />
        <Filters
          label="Filter visits"
          options={visitFilters}
          value={filter}
          onChange={setFilter}
        />
      </Toolbar>

      {filtered.length ? (
        <RecordList>
          <RecordHead className={visitRowCols}>
            <span className="hidden sm:block">#</span>
            <span className="hidden sm:block" />
            <span>Patient</span>
            <span className="hidden sm:block">Consultation</span>
            <span className="hidden sm:block">Status</span>
            <span className="hidden text-right sm:block">When</span>
            <span className="hidden sm:block" />
          </RecordHead>

          {filtered.map((visit, index) => {
            const patient = getPatient(visit.patientId);
            return (
              <RecordRow
                key={visit.id}
                href={`/visits/${visit.id}`}
                className={visitRowCols}
              >
                <RowIndex index={index} />
                <span className="hidden sm:block">
                  <PatientAvatar initials={patient?.initials ?? "–"} />
                </span>
                <Cell
                  primary={patient?.name ?? "Unknown"}
                  secondary={`DOB ${patient?.dob ?? "—"}`}
                />
                <Cell
                  className="hidden sm:grid"
                  primary={visit.reason}
                  secondary={noteState(visit.id, visit.status)}
                />
                <span className="sm:justify-self-start">
                  <StatusBadge status={visit.status} />
                </span>
                <Cell
                  className="hidden sm:grid"
                  align="end"
                  mono
                  primary={visit.time}
                  secondary={visit.date}
                />
                <RowChevron />
              </RecordRow>
            );
          })}
        </RecordList>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>No matching visits</EmptyTitle>
            <EmptyDescription>
              Try a different patient name, reason, or status.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Page>
  );
}

/* -------------------------------------------------------------- Patients */

const patientCols =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[2rem_2rem_minmax(0,1fr)_8rem_4rem_minmax(0,9rem)_1rem]";

export function PatientsPage() {
  const [query, setQuery] = useState("");
  const filtered = patients.filter((patient) =>
    patient.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow="Records"
        title="Patients"
        description="Only what is needed to group consultations: a name and a date of birth."
        actions={newConsultationAction}
      />

      <Toolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search patient names"
        />
        <Eyebrow>
          {filtered.length} of {patients.length}
        </Eyebrow>
      </Toolbar>

      {filtered.length ? (
        <RecordList>
          <RecordHead className={patientCols}>
            <span className="hidden sm:block">#</span>
            <span className="hidden sm:block" />
            <span>Patient</span>
            <span className="hidden sm:block">Date of birth</span>
            <span className="hidden text-right sm:block">Visits</span>
            <span className="hidden text-right sm:block">Last seen</span>
            <span className="hidden sm:block" />
          </RecordHead>

          {filtered.map((patient, index) => {
            const patientVisits = getVisitsForPatient(patient.id);
            const last = patientVisits[0];
            return (
              <RecordRow
                key={patient.id}
                href={`/patients/${patient.id}`}
                className={patientCols}
              >
                <RowIndex index={index} />
                <span className="hidden sm:block">
                  <PatientAvatar initials={patient.initials} />
                </span>
                <Cell
                  primary={patient.name}
                  secondary={`${patient.age} years · ${patient.pronouns}`}
                />
                <span className="hidden font-mono text-xs tabular-nums sm:block">
                  {patient.dob}
                </span>
                <span className="hidden text-right font-mono text-xs tabular-nums sm:block">
                  {patientVisits.length}
                </span>
                <Cell
                  className="hidden sm:grid"
                  align="end"
                  primary={last ? last.date : "—"}
                  secondary={last ? last.reason : "No visits"}
                />
                <RowChevron />
              </RecordRow>
            );
          })}
        </RecordList>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiGroupLine />
            </EmptyMedia>
            <EmptyTitle>No matching patients</EmptyTitle>
            <EmptyDescription>
              Search by the name recorded on the patient record.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ Help */

const helpTopics = [
  {
    icon: RiMicLine,
    title: "Recording a visit",
    copy: "Consent, microphone checks, pausing, and what happens if the browser closes.",
  },
  {
    icon: RiSparklingLine,
    title: "Reviewing a draft",
    copy: "Edit the text directly, or ask for a revision scoped to one section.",
  },
  {
    icon: RiVerifiedBadgeLine,
    title: "Signing and addenda",
    copy: "What locking means, how versions are kept, and how to correct a signed note.",
  },
];

const faqs = [
  {
    q: "Where do I find a patient's notes?",
    a: "On the consultation they came from. Open a patient to see every consultation in one list, then open a consultation for its note, its transcript and its processing history — all three are tabs on the same page.",
  },
  {
    q: "What happens if the browser closes during a visit?",
    a: "Audio is written to local storage in encrypted chunks as it is captured, not held whole in memory. When you return, Cima offers to recover the recording and carry on from where it stopped.",
  },
  {
    q: "Can Cima add a finding that was not discussed?",
    a: "No. The model may summarise and clinically rephrase, but it cannot introduce findings, values, diagnoses, or medications that are absent from the transcript. Sections that were never covered stay marked as explicit gaps.",
  },
  {
    q: "Can a signed note be changed?",
    a: "A signed note is read-only. Any later correction is stored as a separate addendum, so the original record and the full version chain behind it stay intact.",
  },
  {
    q: "How long does a draft take to arrive?",
    a: "Roughly proportional to the length of the recording. The visit shows its real state the whole time, and you can leave the page and come back without losing anything.",
  },
];

export function HelpPage() {
  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow="Support"
        title="How can we help?"
        description="Short answers for capturing, recovering, reviewing, and signing a consultation."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {helpTopics.map(({ icon: Icon, title, copy }) => (
          <Card
            key={title}
            size="sm"
            className="relative transition-colors hover:bg-muted/40"
          >
            <CardHeader>
              <a href="#questions" className="after:absolute after:inset-0">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle className="mt-3">{title}</CardTitle>
              </a>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {copy}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4" id="questions">
        <div className="flex items-center justify-between gap-4 border-b pb-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Common questions
          </h2>
          <Eyebrow>{faqs.length} answers</Eyebrow>
        </div>
        <Accordion>
          {faqs.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent className="max-w-prose leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Alert>
        <RiQuestionLine />
        <AlertTitle>Still need a hand?</AlertTitle>
        <AlertDescription>
          Demo support usually replies within one working day.
        </AlertDescription>
        <div className="col-start-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            render={<a href="mailto:support@cima.demo" />}
          >
            <RiMailLine data-icon="inline-start" />
            Contact support
          </Button>
        </div>
      </Alert>
    </Page>
  );
}

/* -------------------------------------------------------------- Settings */

function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <FieldLabel className="w-full">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{label}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </Field>
    </FieldLabel>
  );
}

const settingsTabs = [
  { id: "profile", label: "Profile", icon: RiUserLine },
  { id: "recording", label: "Recording", icon: RiMicLine },
  { id: "notes", label: "Note review", icon: RiFileTextLine },
  { id: "privacy", label: "Privacy", icon: RiShieldCheckLine },
] as const;

type SettingsTab = (typeof settingsTabs)[number]["id"];

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [status, setStatus] = useState("All preferences are up to date");
  const [prefs, setPrefs] = useState({
    audioRecovery: true,
    soundConfirmation: true,
    autoMicCheck: true,
    openTranscript: true,
    highlightGaps: true,
    compactNote: false,
    localRecovery: true,
    analytics: false,
  });

  function toggle(key: keyof typeof prefs) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
    setStatus("Unsaved changes");
  }

  function touch() {
    setStatus("Unsaved changes");
  }

  function save() {
    setStatus("Changes saved");
    window.setTimeout(() => setStatus("All preferences are up to date"), 2200);
  }

  const panes: Record<
    SettingsTab,
    { title: string; description: string; body: ReactNode }
  > = {
    profile: {
      title: "Profile",
      description: "The identity that appears on notes signed in this demo workspace.",
      body: (
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
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input id={field.id} defaultValue={field.value} onChange={touch} />
            </div>
          ))}
        </div>
      ),
    },
    recording: {
      title: "Recording",
      description: "Capture safeguards and microphone behaviour.",
      body: (
        <div className="grid gap-4">
          <SwitchField
            label="Audio recovery"
            description="Keep encrypted recording chunks available after a browser interruption."
            checked={prefs.audioRecovery}
            onCheckedChange={() => toggle("audioRecovery")}
          />
          <SwitchField
            label="Sound confirmation"
            description="Play a quiet tone when recording starts and stops."
            checked={prefs.soundConfirmation}
            onCheckedChange={() => toggle("soundConfirmation")}
          />
          <SwitchField
            label="Automatic microphone check"
            description="Verify a live signal is present before the consultation begins."
            checked={prefs.autoMicCheck}
            onCheckedChange={() => toggle("autoMicCheck")}
          />
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="microphone">Preferred microphone</Label>
            <Select
              defaultValue="system"
              onValueChange={touch}
              items={{
                system: "System default",
                external: "External USB microphone",
                laptop: "Built-in microphone",
              }}
            >
              <SelectTrigger id="microphone" className="sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System default</SelectItem>
                <SelectItem value="external">External USB microphone</SelectItem>
                <SelectItem value="laptop">Built-in microphone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    notes: {
      title: "Note review",
      description: "How draft notes are presented when you sit down to review them.",
      body: (
        <div className="grid gap-4">
          <SwitchField
            label="Open the evidence rail beside drafts"
            description="Show the transcript lines behind a section as soon as a note becomes ready."
            checked={prefs.openTranscript}
            onCheckedChange={() => toggle("openTranscript")}
          />
          <SwitchField
            label="Highlight explicit gaps"
            description="Call attention to sections that were never discussed in the consultation."
            checked={prefs.highlightGaps}
            onCheckedChange={() => toggle("highlightGaps")}
          />
          <SwitchField
            label="Compact note spacing"
            description="Fit more of a long note on screen while keeping the reading size."
            checked={prefs.compactNote}
            onCheckedChange={() => toggle("compactNote")}
          />
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="note-structure">Default note structure</Label>
            <Select
              defaultValue="general"
              onValueChange={touch}
              items={{
                general: "General consultation",
                soap: "SOAP",
                narrative: "Narrative summary",
              }}
            >
              <SelectTrigger id="note-structure" className="sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General consultation</SelectItem>
                <SelectItem value="soap">SOAP</SelectItem>
                <SelectItem value="narrative">Narrative summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    privacy: {
      title: "Privacy and recovery",
      description: "What this synthetic workspace keeps, and for how long.",
      body: (
        <div className="grid gap-4">
          <Alert>
            <RiShieldCheckLine />
            <AlertTitle>Demo data only</AlertTitle>
            <AlertDescription>
              No real patient information should be entered into this environment.
            </AlertDescription>
          </Alert>
          <SwitchField
            label="Local recording recovery"
            description="Retain encrypted chunks on this device until a visit has uploaded successfully."
            checked={prefs.localRecovery}
            onCheckedChange={() => toggle("localRecovery")}
          />
          <SwitchField
            label="Anonymous product analytics"
            description="Share non-clinical interaction data to improve the demo experience."
            checked={prefs.analytics}
            onCheckedChange={() => toggle("analytics")}
          />
          <Field orientation="horizontal" className="rounded-2xl border p-4">
            <FieldContent>
              <FieldTitle>Recovered demo audio</FieldTitle>
              <FieldDescription>One synthetic recording · 08:42</FieldDescription>
            </FieldContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Recovered demo audio cleared")}
            >
              Clear demo data
            </Button>
          </Field>
        </div>
      ),
    },
  };

  const unsaved = status === "Unsaved changes";

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow="Workspace"
        title="Settings"
        description="Your demo profile, capture behaviour, and note review preferences."
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SettingsTab)}
        orientation="vertical"
        className="gap-8 max-md:flex-col"
      >
        <TabsList variant="line" className="md:w-52 md:shrink-0">
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id}>
              <Icon data-icon="inline-start" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {settingsTabs.map(({ id }, index) => (
          <TabsContent key={id} value={id}>
            <Card>
              <CardHeader className="border-b">
                <Eyebrow>
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(settingsTabs.length).padStart(2, "0")}
                </Eyebrow>
                <CardTitle className="text-xl">{panes[id].title}</CardTitle>
                <p className="text-sm text-muted-foreground">{panes[id].description}</p>
              </CardHeader>
              <CardContent>{panes[id].body}</CardContent>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className={
                      unsaved
                        ? "size-1.5 rounded-full bg-warning"
                        : "size-1.5 rounded-full bg-primary"
                    }
                  />
                  {status}
                </span>
                <Button onClick={save}>Save changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </Page>
  );
}

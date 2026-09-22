"use client";

import Link from "next/link";
import {
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiHistoryLine,
  RiMicLine,
  RiPauseFill,
  RiPlayFill,
  RiSearchLine,
  RiShieldCheckLine,
  RiStopFill,
  RiTimeLine,
  RiUserAddLine,
} from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  freshNote,
  getPatient,
  getTranscript,
  patients as demoPatients,
  today,
  type Patient,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
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
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Eyebrow, Page, PageHead, PatientAvatar } from "@/components/shared";
import { ConsultationView } from "@/components/consultation-view";
import { personalise } from "@/components/note-editor";

type Stage = "pick" | "record" | "processing" | "review";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

/* Deterministic bar heights — random values would break hydration. */
const meterBars = Array.from({ length: 56 }, (_, index) => ({
  low: 0.12 + ((index * 7) % 5) * 0.04,
  high: 0.45 + ((index * 13) % 11) * 0.05,
  delay: `${((index * 37) % 9) * -0.11}s`,
}));

function Meter({ live }: { live: boolean }) {
  return (
    <div
      className="flex h-16 w-full items-center justify-center gap-0.5"
      role="img"
      aria-label={live ? "Microphone is picking up sound" : "Microphone idle"}
    >
      {meterBars.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            live ? "animate-pulse bg-primary" : "bg-border",
          )}
          style={{
            height: `${(live ? bar.high : bar.low) * 100}%`,
            animationDelay: live ? bar.delay : undefined,
          }}
        />
      ))}
    </div>
  );
}

function SideBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="font-mono text-2xs tracking-[0.14em] uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Assurance({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof RiShieldCheckLine;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <strong className="block text-xs font-semibold">{title}</strong>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Stage: pick */

function PickPatient({ onSelect }: { onSelect: (patient: Patient) => void }) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const visible = demoPatients.filter((patient) =>
    patient.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !dob) return;
    const parts = name.trim().split(/\s+/);
    onSelect({
      id: "new-patient",
      name: name.trim(),
      initials: parts
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      dob: new Date(dob).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      age: Math.max(0, new Date().getFullYear() - new Date(dob).getFullYear()),
      pronouns: "they/them",
      registered: "Today",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        {!creating ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Choose a patient</CardTitle>
              <Eyebrow>{visible.length} records</Eyebrow>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputGroup>
                <InputGroupAddon>
                  <RiSearchLine />
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name"
                  aria-label="Search by name"
                />
              </InputGroup>

              <ItemGroup className="gap-1">
                {visible.map((patient) => (
                  <Item
                    key={patient.id}
                    size="sm"
                    className="cursor-pointer text-left hover:bg-muted"
                    render={<button type="button" onClick={() => onSelect(patient)} />}
                  >
                    <ItemMedia>
                      <PatientAvatar initials={patient.initials} />
                    </ItemMedia>
                    <ItemContent>
                      <span className="text-sm font-semibold">{patient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        DOB {patient.dob} · {patient.age} years
                      </span>
                    </ItemContent>
                    <ItemActions className="ml-auto">
                      <RiArrowRightSLine className="size-4 text-muted-foreground" />
                    </ItemActions>
                  </Item>
                ))}

                {!visible.length ? (
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyTitle>No patient by that name</EmptyTitle>
                      <EmptyDescription>
                        Add them below — a name and date of birth is all that is needed.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}
              </ItemGroup>

              <Separator />

              <Item
                variant="outline"
                className="cursor-pointer border-dashed text-left hover:bg-muted"
                render={<button type="button" onClick={() => setCreating(true)} />}
              >
                <ItemMedia variant="icon">
                  <RiUserAddLine />
                </ItemMedia>
                <ItemContent>
                  <span className="text-sm font-semibold">Add a new patient</span>
                  <span className="text-xs text-muted-foreground">
                    Only a name and a date of birth
                  </span>
                </ItemContent>
                <ItemActions className="ml-auto">
                  <RiArrowRightSLine className="size-4 text-muted-foreground" />
                </ItemActions>
              </Item>
            </CardContent>
          </>
        ) : (
          <form onSubmit={create}>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Add a patient</CardTitle>
              <Eyebrow>Name and DOB only</Eyebrow>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-patient-name">Full name</Label>
                  <Input
                    id="new-patient-name"
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Amara Patel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-patient-dob">Date of birth</Label>
                  <Input
                    id="new-patient-dob"
                    type="date"
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                  Back
                </Button>
                <Button type="submit" disabled={!name.trim() || !dob}>
                  Add and continue
                  <RiArrowRightLine data-icon="inline-end" />
                </Button>
              </div>
            </CardContent>
          </form>
        )}
      </Card>

      <aside className="space-y-4">
        <SideBlock title="What happens next">
          <ol className="grid gap-4">
            {[
              {
                label: "Confirm consent",
                detail: "One line, before anything is captured.",
              },
              {
                label: "Record the visit",
                detail: "Elapsed time and a live level meter, nothing else.",
              },
              {
                label: "Read the draft",
                detail: "A structured note, with the transcript beside it.",
              },
            ].map((step, index) => (
              <li key={step.label} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-2xs tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <strong className="block text-xs font-semibold">{step.label}</strong>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SideBlock>

        <SideBlock title="Safeguards">
          <div className="grid gap-4">
            <Assurance
              icon={RiShieldCheckLine}
              title="Saved as you speak"
              copy="Encrypted chunks written continuously, never one fragile file."
            />
            <Assurance
              icon={RiHistoryLine}
              title="Survives a closed tab"
              copy="If the browser stops, the recording is offered back on return."
            />
          </div>
        </SideBlock>
      </aside>
    </div>
  );
}

/* ----------------------------------------------------------- Stage: record */

function Record({
  patient,
  recoveredSeconds,
  onStop,
  onChangePatient,
}: {
  patient: Patient;
  recoveredSeconds?: number;
  onStop: (seconds: number) => void;
  onChangePatient?: () => void;
}) {
  const recovered = Boolean(recoveredSeconds);
  const [consent, setConsent] = useState(recovered);
  const [recording, setRecording] = useState(recovered);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(recoveredSeconds ?? 0);

  useEffect(() => {
    if (!recording || paused) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [recording, paused]);

  const live = recording && !paused;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card
        className={cn(
          "items-center py-12 text-center transition-colors",
          live && "ring-2 ring-primary/30",
        )}
      >
        <CardContent className="flex w-full flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground uppercase">
            {recording ? (
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  paused ? "bg-muted-foreground" : "animate-pulse bg-destructive",
                )}
              />
            ) : null}
            {recording ? (paused ? "Paused" : "Recording") : "Ready when you are"}
          </span>

          <strong className="font-heading text-6xl leading-none font-bold tracking-tighter tabular-nums sm:text-7xl">
            {formatTime(seconds)}
          </strong>

          <Meter live={live} />

          <p className="max-w-prose text-sm leading-relaxed text-balance text-muted-foreground">
            {recording
              ? "Audio is written to this device as you speak. You can leave this page and come back without losing the visit."
              : "Confirm consent to enable recording. Once it starts, there is nothing to watch — talk to your patient."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!recording ? (
              <Button
                size="lg"
                onClick={() => setRecording(true)}
                disabled={!consent}
                title={consent ? undefined : "Confirm patient consent first"}
              >
                <RiMicLine data-icon="inline-start" />
                Start recording
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? "Resume recording" : "Pause recording"}
                >
                  {paused ? <RiPlayFill /> : <RiPauseFill />}
                </Button>
                <Button size="lg" onClick={() => onStop(seconds)}>
                  <RiStopFill data-icon="inline-start" />
                  Finish consultation
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <SideBlock title="Patient">
          <div className="flex items-center gap-3">
            <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold">
                {patient.name}
              </strong>
              <span className="text-xs text-muted-foreground">
                DOB {patient.dob}
                {patient.age ? ` · ${patient.age} years` : ""}
              </span>
            </div>
          </div>
          {onChangePatient && !recording ? (
            <Button
              variant="ghost"
              size="xs"
              className="mt-3 -ml-2"
              onClick={onChangePatient}
            >
              Change patient
            </Button>
          ) : null}
        </SideBlock>

        <Label
          className={cn(
            "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
            consent ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
            recording && "cursor-default opacity-80",
          )}
        >
          <Checkbox
            checked={consent}
            disabled={recording}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5"
          />
          <span>
            <strong className="block text-xs font-semibold">
              Patient consent confirmed
            </strong>
            <span className="mt-0.5 block text-xs leading-relaxed font-normal text-muted-foreground">
              The patient has agreed to this consultation being recorded for clinical
              documentation.
            </span>
          </span>
        </Label>

        {recovered ? (
          <Card size="sm" className="border-warning/40 bg-warning/5 ring-warning/20">
            <CardContent className="flex gap-3">
              <RiHistoryLine className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <strong className="block text-xs font-semibold">
                  Resumed from recovery
                </strong>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  08:42 of audio was restored from this device and the timer continued.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <SideBlock title="While you talk">
          <div className="grid gap-4">
            <Assurance
              icon={RiShieldCheckLine}
              title="Saved as you speak"
              copy="Encrypted chunks, written continuously."
            />
            <Assurance
              icon={RiTimeLine}
              title="Nothing to type now"
              copy="The structured note comes afterwards."
            />
          </div>
        </SideBlock>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------- Stage: processing */

const processingStages = [
  {
    label: "Recording secured",
    detail: "Audio stored and checksummed on this device.",
    headline: "Securing the recording",
  },
  {
    label: "Uploading audio",
    detail: "Sent in 18 resumable parts.",
    headline: "Uploading the audio",
  },
  {
    label: "Separating speakers",
    detail: "Doctor and patient turns detected.",
    headline: "Separating the speakers",
  },
  {
    label: "Drafting the note",
    detail: "Every statement checked against the transcript.",
    headline: "Drafting the note",
  },
];

function Processing({
  duration,
  patient,
  onReady,
}: {
  duration: string;
  patient: Patient;
  onReady: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(8);
  const readyRef = useRef(onReady);

  useEffect(() => {
    readyRef.current = onReady;
  });

  useEffect(() => {
    const tick = window.setInterval(() => {
      setStage((value) => Math.min(value + 1, processingStages.length - 1));
      setProgress((value) => Math.min(value + 24, 94));
    }, 1500);
    const done = window.setTimeout(() => readyRef.current(), 6600);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, []);

  const current = processingStages[stage];

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8 py-6">
      <div className="space-y-4 text-center">
        <Eyebrow>Honest progress · no fake spinner</Eyebrow>
        <h2 className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
          {current.headline}
        </h2>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-balance text-muted-foreground">
          {duration} captured for {patient.name}. You can leave this page — the visit keeps
          going and shows its real state in your worklist the whole time.
        </p>
      </div>

      {/* A single honest bar, labelled with what it is actually measuring. */}
      <div className="space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Processing progress"
          />
        </div>
        <div className="flex items-center justify-between font-mono text-2xs tracking-[0.12em] text-muted-foreground uppercase">
          <span className="tabular-nums">{progress}% complete</span>
          <span className="tabular-nums">
            Stage {stage + 1} of {processingStages.length}
          </span>
        </div>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl border bg-border">
        {processingStages.map((item, index) => {
          const done = index < stage;
          const activeStep = index === stage;
          return (
            <li
              key={item.label}
              className={cn(
                "flex items-center gap-3 bg-background p-4 transition-colors",
                activeStep && "bg-primary/5",
                !done && !activeStep && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-2xs tabular-nums",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : activeStep
                      ? "border-primary text-primary"
                      : "border-border",
                )}
              >
                {done ? (
                  <RiCheckLine className="size-3" />
                ) : activeStep ? (
                  <Spinner className="size-3" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong
                  className={cn("block text-sm", activeStep && "font-semibold")}
                >
                  {item.label}
                </strong>
                {activeStep ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-2xs tracking-[0.12em] uppercase">
                {done ? "Done" : activeStep ? "Running" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" render={<Link href="/" />}>
          Leave and come back later
        </Button>
        <Button variant="ghost" size="sm" onClick={onReady}>
          Demo · skip to the finished draft
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Flow */

export function CaptureFlow({
  recoveredSeconds,
  patientId,
}: {
  recoveredSeconds?: number;
  patientId?: string;
}) {
  // A recovered recording, or a patient already in context, skips the picker.
  const resuming = Boolean(recoveredSeconds);
  const preselected = patientId ? getPatient(patientId) : undefined;
  const startingPatient = resuming ? demoPatients[0] : preselected;

  const [stage, setStage] = useState<Stage>(startingPatient ? "record" : "pick");
  const [patient, setPatient] = useState<Patient | null>(startingPatient ?? null);
  const [captured, setCaptured] = useState(0);

  const note = useMemo(
    () => (patient ? personalise(freshNote, patient.name.split(" ")[0]) : freshNote),
    [patient],
  );

  if (stage === "review" && patient) {
    return (
      <ConsultationView
        back={{ href: "/", label: "Today" }}
        data={{
          patient,
          reason: "Persistent cough",
          dateLong: today.long,
          time: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: formatTime(captured),
          status: "draft-ready",
          note,
          transcript: getTranscript("v1"),
          versions: [
            { id: 1, label: "AI draft generated", author: "Cima", time: "now", kind: "ai" },
          ],
        }}
      />
    );
  }

  const heading =
    stage === "pick"
      ? { eyebrow: "New consultation", title: "Who are you seeing?" }
      : stage === "record"
        ? { eyebrow: `Consultation · ${patient?.name ?? ""}`, title: "Recording" }
        : { eyebrow: `Visit saved · ${patient?.name ?? ""}`, title: "Building the note" };

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={heading.eyebrow}
        title={heading.title}
        actions={
          stage === "pick" ? (
            <Button variant="outline" render={<Link href="/" />}>
              Cancel
            </Button>
          ) : null
        }
      />

      {stage === "pick" ? (
        <PickPatient
          onSelect={(selected) => {
            setPatient(selected);
            setStage("record");
          }}
        />
      ) : null}

      {stage === "record" && patient ? (
        <Record
          patient={patient}
          recoveredSeconds={recoveredSeconds}
          onChangePatient={resuming ? undefined : () => setStage("pick")}
          onStop={(seconds) => {
            setCaptured(seconds);
            setStage("processing");
          }}
        />
      ) : null}

      {stage === "processing" && patient ? (
        <Processing
          duration={formatTime(captured)}
          patient={patient}
          onReady={() => setStage("review")}
        />
      ) : null}
    </Page>
  );
}

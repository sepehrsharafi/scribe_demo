"use client";

import { useRouter } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine, RiUserAddLine } from "@remixicon/react";
import { useState, useTransition, type FormEvent } from "react";
import type { PatientOption } from "@/lib/patient-options";
import { addPatient } from "@/lib/actions/workspace";
import { demoToday } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { PatientAvatar } from "@/components/patient-avatar";
import { BirthDate, LastSeen } from "@/components/patient-facts";
import { useI18n } from "@/components/i18n-provider";

/** Someone new: the only two things the product asks for. */
function AddPatient({ name: typed, onBack }: { name: string; onBack: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(typed);
  const [born, setBorn] = useState("");
  const [adding, startAdding] = useTransition();
  const ready = Boolean(name.trim() && born) && !adding;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    // Registers them and opens their visit; the action navigates when it is done.
    startAdding(() => addPatient({ name, born }));
  }

  return (
    <form onSubmit={submit} className="grid gap-5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("Back")} title={t("Back")}>
          <RiArrowLeftLine className="rtl:-scale-x-100" />
        </Button>
        <h2 className="font-heading text-base font-semibold tracking-tight">{t("Add a new patient")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="grid gap-2">
          <Label htmlFor="new-patient-name">{t("Full name")}</Label>
          <Input
            id="new-patient-name"
            autoFocus={!typed}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("e.g. Amara Patel")}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-patient-born">{t("Date of birth")}</Label>
          <Input
            id="new-patient-born"
            type="date"
            autoFocus={Boolean(typed)}
            value={born}
            max={demoToday}
            onChange={(event) => setBorn(event.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("Only a name and a date of birth.")}</p>
        <Button type="submit" disabled={!ready}>
          {adding ? <Spinner data-icon="inline-start" /> : null}
          {t("Add and open visit")}
          {adding ? null : <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />}
        </Button>
      </div>
    </form>
  );
}

/** One patient as every list of them shows it: who, born when, last seen when. */
function PatientRow({ patient, opening }: { patient: PatientOption; opening: boolean }) {
  const { t } = useI18n();

  return (
    <>
      <PatientAvatar initials={patient.initials} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm font-semibold">{patient.name}</span>
        <BirthDate dob={patient.born} age={patient.age} />
      </span>
      {opening ? (
        <Spinner className="size-4 shrink-0 text-muted-foreground" />
      ) : patient.lastSeen ? (
        <LastSeen when={patient.lastSeen} className="hidden shrink-0 sm:inline-flex" />
      ) : (
        <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">{t("First visit")}</span>
      )}
    </>
  );
}

const item = "gap-3 rounded-2xl px-2 py-2.5 data-selected:bg-muted";

/**
 * Who the visit is with. Type a name — the list narrows as you go, arrow keys
 * and Enter work — and picking someone opens their visit, ready to record.
 * Anyone not on the list is added from the same place, with the name already
 * typed.
 *
 * As a page's lead control, on Home, the search opens over the page as a
 * dropdown of everyone, and the few people seen most recently stay listed
 * under it, the same whatever is typed.
 */
export function PatientPicker({
  patients,
  lead = false,
  onSamePage,
}: {
  patients: PatientOption[];
  /** The page's main control: a taller field, its results a dropdown, recent patients beneath. */
  lead?: boolean;
  /** Picking the visit already open goes nowhere; this is told instead. */
  onSamePage?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Only the lead picker's list drops down; it opens when the doctor types or asks for it.
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [pending, startOpening] = useTransition();

  if (adding !== null) return <AddPatient name={adding} onBack={() => setAdding(null)} />;

  const search = query.trim().toLocaleLowerCase();
  const matches = search ? patients.filter((patient) => patient.name.toLocaleLowerCase().includes(search)) : patients;
  const listed = !lead || open;

  function openVisit(patientId: string) {
    const href = `/new?patient=${patientId}`;
    if (`${window.location.pathname}${window.location.search}` === href) return onSamePage?.();
    setOpening(patientId);
    startOpening(() => router.push(href));
  }

  const results = (
    <>
      <CommandGroup
        heading={lead ? undefined : search ? t("Matching patients") : t("Recent patients")}
        className="p-0 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-2xs **:[[cmdk-group-heading]]:tracking-[0.14em] **:[[cmdk-group-heading]]:uppercase"
      >
        {matches.map((patient) => (
          <CommandItem
            key={patient.id}
            value={patient.id}
            onSelect={() => openVisit(patient.id)}
            disabled={pending && opening !== patient.id}
            className={item}
          >
            <PatientRow patient={patient} opening={pending && opening === patient.id} />
          </CommandItem>
        ))}
        {search && !matches.length ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {t("Nobody called “{name}” yet.", { name: query.trim() })}
          </p>
        ) : null}
      </CommandGroup>

      <CommandGroup className="mt-1 border-t p-0 pt-1">
        <CommandItem value="add-patient" onSelect={() => setAdding(query.trim())} className={item}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground/30">
            <RiUserAddLine className="size-4" />
          </span>
          <span className="text-sm font-semibold">
            {search ? t("Add “{name}” as a new patient", { name: query.trim() }) : t("Add a new patient")}
          </span>
        </CommandItem>
      </CommandGroup>
    </>
  );

  return (
    <div className="grid gap-10">
      <Command
        shouldFilter={false}
        loop
        label={t("Find a patient")}
        className={cn("rounded-none bg-transparent p-0", lead && "relative z-30 overflow-visible")}
        // Focus leaving the field and its dropdown closes the dropdown.
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <CommandInput
          autoFocus
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setOpen(true);
          }}
          onPointerDown={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!lead) return;
            if (event.key === "ArrowDown") setOpen(true);
            if (event.key === "Escape" && open) {
              event.preventDefault();
              setOpen(false);
            }
          }}
          aria-expanded={lead ? open : undefined}
          placeholder={lead ? t("Search patients by name") : t("Search by name")}
          groupClassName={cn(
            lead
              ? "h-14 rounded-2xl border-border bg-background px-2 text-lg shadow-xs dark:bg-input/30 [&_svg]:size-5!"
              : "h-11",
          )}
          className={cn(lead && "text-lg")}
        />
        {listed ? (
          <CommandList
            // A press on a result must not take focus from the field first, or the dropdown closes under it.
            onMouseDown={lead ? (event) => event.preventDefault() : undefined}
            className={cn(
              "mt-2 max-h-[min(22rem,50dvh)] px-1 pb-1",
              lead &&
                "absolute inset-x-0 top-full mt-2 max-h-[min(26rem,60dvh)] rounded-3xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in duration-150 fade-in slide-in-from-top-1",
            )}
          >
            {results}
          </CommandList>
        ) : null}
      </Command>

      {lead ? (
        <section aria-labelledby="recent-patients" className="grid gap-3">
          <h2 id="recent-patients" className="font-heading text-lg font-semibold tracking-tight">
            {t("Recent patients")}
          </h2>
          <ul className="-mx-2 grid gap-0.5">
            {patients.slice(0, 5).map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => openVisit(patient.id)}
                  disabled={pending && opening !== patient.id}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-start outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <PatientRow patient={patient} opening={pending && opening === patient.id} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

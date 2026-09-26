"use client";

import {
  RiArrowRightLine,
  RiSearchLine,
  RiUserAddLine,
  RiUserSearchLine,
} from "@remixicon/react";
import { useState, type FormEvent } from "react";
import type { Patient } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n/locales";
import type { Translate } from "@/lib/i18n/translate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ItemContent,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PatientAvatar } from "@/components/patient-avatar";
import { BirthDate, LastSeen } from "@/components/patient-facts";
import type { NewPatient } from "@/components/active-recording";
import { useI18n } from "@/components/i18n-provider";
import { SidePanel } from "./side-panel";


/** Builds a patient record for display until the visit is saved and filed. */
function draftPatient(added: NewPatient, locale: Locale, t: Translate): Patient {
  const name = added.name.trim();
  return {
    id: "new-patient",
    name,
    initials: name
      .split(/\s+/)
      .map((word) => word[0])
      // Persian letters would join into a word; a zero-width non-joiner keeps them apart.
      .join(locale === "fa" ? "‌" : "")
      .slice(0, 2)
      .toUpperCase(),
    dob: new Date(added.dob).toLocaleDateString(locale === "fa" ? "fa-IR-u-nu-latn" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    age: Math.max(0, new Date().getFullYear() - new Date(added.dob).getFullYear()),
    registered: t("Today"),
    record: [],
  };
}

/** Search the list, or add someone new with a name and a date of birth. */
function PickPatient({
  onSelect,
}: {
  onSelect: (patient: Patient, added?: NewPatient) => void;
}) {
  const { t, locale, demo } = useI18n();
  const { patients, getVisitsForPatient } = demo;
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const search = query.trim().toLowerCase();
  const matches = patients.filter((patient) => patient.name.toLowerCase().includes(search));

  function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !dob) return;
    const added = { name: name.trim(), dob };
    onSelect(draftPatient(added, locale, t), added);
  }

  if (creating) {
    return (
      <form onSubmit={create} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="new-patient-name">{t("Full name")}</Label>
            <Input
              id="new-patient-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("e.g. Amara Patel")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-patient-dob">{t("Date of birth")}</Label>
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
            {t("Back")}
          </Button>
          <Button type="submit" disabled={!name.trim() || !dob}>
            {t("Add and attach")}
            <RiArrowRightLine data-icon="inline-end" className="rtl:-scale-x-100" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <InputGroup>
        <InputGroupAddon>
          <RiSearchLine />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("Search by name")}
          aria-label={t("Search by name")}
        />
      </InputGroup>

      {/* Rows reach out to the dialog's edge while their text stays on the
          line of the title and the search, so a phone never gets a padding
          nested inside a padding. */}
      <ItemGroup className="-mx-2.5 max-h-[min(24rem,55dvh)] gap-0.5 overflow-y-auto sm:-mx-3">
        {matches.map((patient) => {
          const lastVisit = getVisitsForPatient(patient.id)[0];
          return (
            <Item
              key={patient.id}
              size="sm"
              className="cursor-pointer gap-3 px-2.5 text-start hover:bg-accent focus-visible:ring-inset sm:px-3"
              render={<button type="button" onClick={() => onSelect(patient)} />}
            >
              <ItemMedia>
                <PatientAvatar initials={patient.initials} />
              </ItemMedia>
              <ItemContent className="min-w-0 gap-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{patient.name}</span>
                  <LastSeen when={lastVisit ? lastVisit.date : t("None yet")} className="shrink-0" />
                </span>
                <BirthDate dob={patient.dob} age={patient.age} />
              </ItemContent>
            </Item>
          );
        })}

        {!matches.length ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyTitle>{t("No patient by that name")}</EmptyTitle>
              <EmptyDescription>
                {t("Add them below — a name and date of birth is all that is needed.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </ItemGroup>

      <Separator />

      <Item
        variant="outline"
        className="cursor-pointer gap-3 border-dashed px-2.5 text-start hover:bg-accent sm:px-3"
        render={<button type="button" onClick={() => setCreating(true)} />}
      >
        <ItemMedia variant="icon">
          <RiUserAddLine />
        </ItemMedia>
        <ItemContent>
          <span className="text-sm font-semibold">{t("Add a new patient")}</span>
          <span className="text-xs text-muted-foreground">{t("Only a name and a date of birth")}</span>
        </ItemContent>
      </Item>
    </div>
  );
}

/** The picker in a dialog, so it can be opened in the middle of a recording. */
export function PatientDialog({
  open,
  onOpenChange,
  description,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onSelect: (patient: Patient, added?: NewPatient) => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] gap-5 p-5 sm:max-w-xl sm:gap-6 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("Select or add patient")}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from a clean search. */}
        {open ? (
          <PickPatient
            onSelect={(patient, added) => {
              onSelect(patient, added);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Who this consultation is with — or, until someone is chosen, a plain
 * statement that nobody is yet, and the way to fix that. The recording does
 * not wait for it; saving does.
 */
export function AttachedPatient({
  patient,
  onChoose,
  required,
}: {
  patient: Patient | null;
  onChoose?: () => void;
  /** Saving is waiting on a patient, so the empty state speaks up. */
  required?: boolean;
}) {
  const { t } = useI18n();

  if (!patient) {
    return (
      <SidePanel title="Patient">
        <div
          className={cn(
            "rounded-xl border border-dashed p-4 transition-colors",
            required && "border-warning bg-warning/5",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <RiUserSearchLine className={cn("size-5", required ? "text-warning" : "text-muted-foreground")} />
            {t("No patient attached yet")}
          </span>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {required
              ? t("The recording is held on this device. Attach a patient to save it.")
              : t("Start whenever you are ready. Attach the patient during the recording or after it.")}
          </p>
          {onChoose ? (
            <Button
              className="mt-3 w-full"
              variant={required ? "default" : "outline"}
              onClick={onChoose}
            >
              <RiUserSearchLine data-icon="inline-start" />
              {t("Select or add patient")}
            </Button>
          ) : null}
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel title="Patient">
      <div className="flex items-center gap-3">
        <PatientAvatar initials={patient.initials} size="lg" tone="primary" />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-semibold">{patient.name}</strong>
          <BirthDate dob={patient.dob} age={patient.age} />
        </div>
      </div>
      {onChoose ? (
        <Button variant="ghost" size="xs" className="mt-3 -ms-2" onClick={onChoose}>
          {t("Change patient")}
        </Button>
      ) : null}
    </SidePanel>
  );
}

import type { Demo } from "@/lib/demo-data";
import type { Format } from "@/lib/format";

/** A patient as the picker shows them: enough to tell two people with one name apart. */
export type PatientOption = {
  id: string;
  name: string;
  initials: string;
  /** 14 May 1988 */
  born: string;
  age: number;
  /** When they were last seen, if they have been. */
  lastSeen?: string;
};

/** Everyone on the list, most recently seen first; people never seen come last. */
export function patientOptions(demo: Demo, f: Format): PatientOption[] {
  const seen = (patientId: string) => demo.getVisitsForPatient(patientId)[0];
  // demo.visits is latest first, so where someone last appears in it is how recently they were seen.
  const order = (patientId: string) => {
    const last = seen(patientId);
    return last ? demo.visits.indexOf(last) : demo.visits.length;
  };

  return [...demo.patients]
    .sort((a, b) => order(a.id) - order(b.id))
    .map((patient) => {
      const last = seen(patient.id);
      return {
        id: patient.id,
        name: patient.name,
        initials: f.initials(patient.name),
        born: f.date(patient.born),
        age: f.age(patient.born),
        lastSeen: last ? f.day(last.day) : undefined,
      };
    });
}

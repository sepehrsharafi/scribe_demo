import { AppShell } from "@/components/app-shell";
import { PatientsPage } from "@/components/records-pages";

export default function Page() {
  return <AppShell active="Patients"><PatientsPage /></AppShell>;
}

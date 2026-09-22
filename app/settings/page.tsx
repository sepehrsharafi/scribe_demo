import { AppShell } from "@/components/app-shell";
import { SettingsPage } from "@/components/records-pages";

export default function Page() {
  return <AppShell active="Settings"><SettingsPage /></AppShell>;
}

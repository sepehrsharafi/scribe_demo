import { AppShell } from "@/components/app-shell";
import { Today } from "@/components/today";

export default function Home() {
  return (
    <AppShell active="Today">
      <Today />
    </AppShell>
  );
}

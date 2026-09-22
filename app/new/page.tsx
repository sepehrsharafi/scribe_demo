import { AppShell } from "@/components/app-shell";
import { CaptureFlow } from "@/components/capture-flow";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: PageProps<"/new">) {
  const { resume, patient } = await searchParams;
  return (
    <AppShell active="Visits">
      <CaptureFlow
        recoveredSeconds={resume ? 522 : undefined}
        patientId={first(patient)}
      />
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { VisitsPage } from "@/components/records-pages";
import { toVisitFilter } from "@/lib/demo-data";

export default async function Page({ searchParams }: PageProps<"/visits">) {
  const { filter } = await searchParams;
  return (
    <AppShell active="Visits">
      <VisitsPage initialFilter={toVisitFilter(filter)} />
    </AppShell>
  );
}

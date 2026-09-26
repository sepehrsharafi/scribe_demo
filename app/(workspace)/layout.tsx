import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProcessingWatcher } from "@/components/processing-watcher";
import { ActiveRecordingProvider } from "@/components/active-recording";
import { RecordingDock } from "@/components/recording-dock";
import { getI18n } from "@/lib/i18n/server";
import { nextStatusChange, recordedStatus } from "@/lib/workspace";

/** The recordings from this browser that are still being processed. */
async function Processing() {
  const { changes, demo, now } = await getI18n();
  const processing = changes.recorded.flatMap((visit) => {
    const changesAt = nextStatusChange(visit, now);
    if (changesAt === null) return [];
    return [
      {
        visitId: visit.id,
        patientName: demo.getPatient(visit.patientId)?.name ?? "",
        changesAt,
        ready: recordedStatus(visit, changesAt) === "draft-ready",
      },
    ];
  });
  return <ProcessingWatcher processing={processing} />;
}

/**
 * The chrome lives here, not in the pages. A layout is mounted once: on
 * navigation React swaps `children` and leaves the sidebar alone, so it keeps
 * its collapsed state and never re-renders. A recording lives here for the
 * same reason: leaving the recording screen minimises it instead of ending it.
 */
export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <ActiveRecordingProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
        <Processing />
        <RecordingDock />
      </SidebarProvider>
    </ActiveRecordingProvider>
  );
}

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

/**
 * The chrome lives here, not in the pages. A layout is mounted once: on
 * navigation React swaps `children` and leaves the sidebar alone, so it keeps
 * its collapsed state and never re-renders.
 */
export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

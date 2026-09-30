"use client";

import {
  RiFileList3Line,
  RiFileTextLine,
  RiFolderUserLine,
  RiVoiceprintLine,
} from "@remixicon/react";
import { startTransition, ViewTransition, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n-provider";

export type VisitTab = "context" | "transcript" | "note" | "instructions";

/*
 * The tabs read in the order the doctor works: what was known going in, what
 * they wrote, what the patient takes home — and last, the conversation it all
 * came from, there to check against.
 */
const tabs: { id: VisitTab; label: string; icon: typeof RiFileTextLine }[] = [
  { id: "context", label: "Context", icon: RiFolderUserLine },
  { id: "note", label: "Note", icon: RiFileTextLine },
  { id: "instructions", label: "Instructions", icon: RiFileList3Line },
  { id: "transcript", label: "Transcript", icon: RiVoiceprintLine },
];

/**
 * One visit, four views of it. The strip sticks under the page's top edge so
 * the way between them never scrolls away, and it carries whatever tool the
 * open tab needs — at its far end where there is room, as a second row of the
 * same strip where there is not. Switching is a transition, so the panels
 * cross-fade instead of cutting.
 */
export function VisitTabs({
  value,
  onValueChange,
  recorded = true,
  panels,
  marks,
  tools,
}: {
  value: VisitTab;
  onValueChange: (tab: VisitTab) => void;
  /** A visit written by hand has no transcript, so it has no tab for one. */
  recorded?: boolean;
  panels: Record<VisitTab, ReactNode>;
  /** A small mark beside a tab's name for what is waiting there. */
  marks?: Partial<Record<VisitTab, ReactNode>>;
  tools?: ReactNode;
}) {
  const { t } = useI18n();
  const shown = tabs.filter((tab) => recorded || tab.id !== "transcript");

  return (
    <Tabs
      value={value}
      onValueChange={(next) => startTransition(() => onValueChange(next as VisitTab))}
      className="min-w-0 gap-0"
    >
      <div className="sticky top-(--sticky-top) z-20 -mx-4 border-b bg-background/90 px-4 backdrop-blur-sm sm:mx-0 sm:px-0 xl:flex xl:items-center xl:gap-3">
        <div className="min-w-0 overflow-x-auto [scrollbar-width:none]">
          <TabsList variant="line" className="h-12 gap-3 p-0 sm:gap-5">
            {shown.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="h-full flex-none gap-2 px-0.5 text-sm group-data-horizontal/tabs:after:bottom-0"
              >
                {/* On a phone the words alone fit all four tabs across. */}
                <Icon className="max-sm:hidden" />
                {t(label)}
                {marks?.[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tools ? <div className="border-t py-1.5 xl:ms-auto xl:shrink-0 xl:border-t-0 xl:py-0">{tools}</div> : null}
      </div>

      {shown.map(({ id }) => (
        <TabsContent key={id} value={id} className="pt-6 pb-16">
          <ViewTransition enter="tab-in" exit="tab-out" default="none">
            <div>{panels[id]}</div>
          </ViewTransition>
        </TabsContent>
      ))}
    </Tabs>
  );
}

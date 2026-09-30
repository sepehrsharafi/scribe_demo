import type { ReactNode } from "react";

/**
 * The shape every visit shares, from the moment it is started to long after
 * it is approved: who and when on the start side, what to do next on the end
 * side, and the tabs beneath.
 */
export function VisitFrame({
  identity,
  actions,
  children,
}: {
  identity: ReactNode;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      <header className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        {identity}
        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">{actions}</div>
      </header>
      {children}
    </div>
  );
}

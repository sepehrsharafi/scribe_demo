import type { ReactNode } from "react";

/**
 * The shape every visit shares, from the moment it is started to long after
 * it is approved: who and when on the start side, what to do next on the end
 * side, and the tabs beneath. The two sit side by side wherever the page has
 * room for both, and stack where it has not.
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
    <div className="mx-auto w-full max-w-5xl px-6 pt-6 sm:px-10">
      <header className="@container pb-4">
        <div className="flex flex-col gap-3 @xl:flex-row @xl:items-start @xl:gap-6">
          {identity}
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        </div>
      </header>
      {children}
    </div>
  );
}

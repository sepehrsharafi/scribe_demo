"use client";

import { useEffect } from "react";

/**
 * A page transition the browser skips — the viewport changed size while it
 * ran, as a phone's address bar does when a new page scrolls to the top — is
 * not a failure: the page still arrives, just without the animation. React
 * knows this and stays quiet, but only for the wording browsers used to use;
 * Chrome now adds the reason ("… invalid state. Viewport size changed"), so
 * React reports it as an error and the dev overlay shows it.
 *
 * This hears such an error first (a capturing listener on the window runs
 * before the overlay's) and stops it there. Every other error goes through.
 */
const skipped = (value: unknown) =>
  value instanceof DOMException &&
  value.name === "InvalidStateError" &&
  value.message.startsWith("Transition was aborted because of invalid state");

function silence(event: ErrorEvent | PromiseRejectionEvent) {
  if (!skipped("reason" in event ? event.reason : event.error)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

export function ViewTransitionErrors() {
  useEffect(() => {
    window.addEventListener("error", silence, true);
    window.addEventListener("unhandledrejection", silence, true);
    return () => {
      window.removeEventListener("error", silence, true);
      window.removeEventListener("unhandledrejection", silence, true);
    };
  }, []);

  return null;
}

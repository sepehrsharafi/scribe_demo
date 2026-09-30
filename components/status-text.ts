import type { VisitStatus } from "@/lib/demo-data";

/**
 * What each status is called, and what it means when you hover it. English;
 * rendered through `t()`. Plain data, so server and client components share it.
 */
export const statusText: Record<VisitStatus, { label: string; description: string }> = {
  processing: {
    label: "Processing",
    description: "The note is being written from the recording.",
  },
  ready: {
    label: "To review",
    description: "A draft note is waiting for your review.",
  },
  approved: {
    label: "Approved",
    description: "Signed off. Still editable; a later change is flagged until it is approved.",
  },
  failed: {
    label: "Upload failed",
    description: "Processing was interrupted. The audio is safe and the upload can be retried.",
  },
};

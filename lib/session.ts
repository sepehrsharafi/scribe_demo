// Demo-only sign-in. There is no account system: any valid email and any
// six-digit code open the workspace, and the "session" is a cookie holding the
// email. The proxy reads it to decide who reaches the workspace.

export const sessionCookie = "scribe-session";

/** Where a signed-out visitor is sent, and where they return to after signing in. */
export const signInPath = "/login";

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Only same-site paths are followed after signing in. */
export function safeReturnPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

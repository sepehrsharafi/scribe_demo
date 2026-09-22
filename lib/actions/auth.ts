"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidEmail, safeReturnPath, sessionCookie, signInPath } from "@/lib/session";

/**
 * Demo sign-in: the code is not checked, only that there are six digits of it.
 * Returns an error key when the input is unusable; otherwise it never returns.
 */
export async function signIn(email: string, code: string, returnTo?: string) {
  if (!isValidEmail(email)) return { error: "email" as const };
  if (!/^\d{6}$/.test(code)) return { error: "code" as const };

  (await cookies()).set(sessionCookie, email.trim(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(safeReturnPath(returnTo));
}

export async function signOut() {
  (await cookies()).delete(sessionCookie);
  redirect(signInPath);
}

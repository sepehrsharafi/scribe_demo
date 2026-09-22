import { NextResponse, type NextRequest } from "next/server";
import { sessionCookie, signInPath } from "@/lib/session";

/** Signed-out visitors meet the sign-in screen; signed-in ones never do. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(sessionCookie);
  const onSignIn = pathname === signInPath;

  if (!signedIn && !onSignIn) {
    const url = new URL(signInPath, request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (signedIn && onSignIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own assets and files with an extension (fonts, icons).
  matcher: ["/((?!_next/static|_next/image|.*\\.[\\w]+$).*)"],
};

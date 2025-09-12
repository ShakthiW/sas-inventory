import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const SESSION_COOKIE = "sas_session";

export async function middleware(req: NextRequest) {
  // Let Server Action POSTs pass through to avoid action-hash mismatch issues
  if (req.headers.get("next-action")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isAuth =
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up");

  if (token) {
    try {
      await verifySession(token);
      // Authenticated users shouldn't see auth pages
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    } catch {
      // invalid token -> treat as unauthenticated
    }
  }

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};

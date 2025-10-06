import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Force HTTPS on production to avoid mixed-content and improve trust signals
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto && proto !== "https") {
    const url = new URL(request.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

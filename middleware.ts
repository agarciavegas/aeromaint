import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that only redirects unauthenticated users to login
// The actual auth check is done client-side via NextAuth session
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths without authentication
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/logo.svg")
  ) {
    return NextResponse.next();
  }

  // For all other paths, let the request through
  // Client-side NextAuth will handle redirect to login if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)"],
};

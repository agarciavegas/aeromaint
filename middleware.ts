import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow access to login page and auth API routes without authentication
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized({ token, req }) {
        // Allow login page and auth routes without token
        const path = req.nextUrl.pathname;
        if (path.startsWith("/login") || path.startsWith("/api/auth")) {
          return true;
        }
        // Require token for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|robots.txt|logo.svg|public).*)",
  ],
};

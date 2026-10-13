import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/auth";

// First line of defence for /admin. Every admin page and server action also
// re-checks the session with requireAdmin(), so this is not the only gate.
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!isAdminEmail(req.auth?.user?.email)) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*"] };

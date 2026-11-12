import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get("ceenai_admin_session")?.value;

  // Protect Admin Pages: /admin and any /admin/* (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Admin API routes: /api/admin/* (except /api/admin/auth/login)
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth/login") {
    if (!adminToken) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};


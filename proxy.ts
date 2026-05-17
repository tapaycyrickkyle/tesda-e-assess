import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRoleHomePath, getUserRoleFromMetadata, SESSION_COOKIE_NAME, type UserRole, isSupabaseConfigured } from "@/lib/auth";
import { createSupabaseServerClient, getUserRoleFromRoleTable } from "@/lib/supabase";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const publicPaths = new Set(["/", "/applicant-signup", "/sign-up/applicant", "/teacher-signup", "/teacher-type"]);
  const isPublicPath = publicPaths.has(pathname);

  let isLoggedIn = false;
  let role: UserRole = "unknown";

  if (sessionToken && isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(sessionToken);
    isLoggedIn = !error && Boolean(data.user);
    if (data.user) {
      const metadataRole = getUserRoleFromMetadata(data.user);
      role =
        metadataRole !== "unknown"
          ? metadataRole
          : await getUserRoleFromRoleTable(data.user.email ?? "", sessionToken);
    }
  }

  if (!isPublicPath && !isLoggedIn) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  if (isLoggedIn && pathname.startsWith("/applicant") && role !== "applicant") {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  if (isLoggedIn && pathname.startsWith("/teacher") && role !== "teacher") {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  return middleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

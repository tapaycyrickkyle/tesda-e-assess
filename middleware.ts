import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isSupabaseConfigured } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isLoggedIn = false;

  if (sessionToken && isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(sessionToken);
    isLoggedIn = !error && Boolean(data.user);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !isLoggedIn) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};

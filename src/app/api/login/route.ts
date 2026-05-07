import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseConfigured, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase authentication is not configured on the server.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ success: false, message: "Username and password are required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  });

  if (error || !data.session?.access_token) {
    return NextResponse.json({ success: false, message: "Invalid username or password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: data.session.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in,
  });

  return NextResponse.json({ success: true });
}

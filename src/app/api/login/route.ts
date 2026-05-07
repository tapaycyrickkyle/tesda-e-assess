import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient, getUserRoleFromRoleTable } from "@/lib/supabase";
import {
  getRoleHomePath,
  getUserRoleFromMetadata,
  isSupabaseConfigured,
  SESSION_COOKIE_NAME,
  USER_ROLE_COOKIE_NAME,
} from "@/lib/auth";

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

  const body = (await request.json()) as { email?: string; username?: string; password?: string };
  const email = body.email?.trim() ?? body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const metadataRole = getUserRoleFromMetadata(data.user);
  const userRole =
    metadataRole !== "unknown"
      ? metadataRole
      : await getUserRoleFromRoleTable(data.user.email ?? email, data.session.access_token);

  if (userRole === "unknown") {
    return NextResponse.json(
      {
        success: false,
        message: "No valid role was found for this account. Check your Supabase role table and RLS policy.",
      },
      { status: 403 },
    );
  }

  const redirectTo = getRoleHomePath(userRole);

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: data.session.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in,
  });

  cookieStore.set({
    name: USER_ROLE_COOKIE_NAME,
    value: userRole,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in,
  });

  return NextResponse.json({ success: true, role: userRole, redirectTo });
}

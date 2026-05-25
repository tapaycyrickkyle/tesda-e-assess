import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/auth";

type PasswordRecoveryPayload = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Password recovery is not available right now. Please contact the administrator.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as PasswordRecoveryPayload;
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const redirectTo = `${new URL(request.url).origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to send the password recovery email right now. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to send the password recovery email right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}

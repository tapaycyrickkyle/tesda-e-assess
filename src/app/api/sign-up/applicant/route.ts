import { NextResponse } from "next/server";
import {
  buildFullName,
  deleteProfileByEmail,
  isValidPhilippineMobileNumberInput,
  normalizeContactNumber,
  normalizeEmail,
  syncProfileRecord,
} from "@/lib/registration";
import { createSupabaseAdminClient } from "@/lib/supabase";

type ApplicantSignUpPayload = {
  confirmPassword?: string;
  contactNumber?: string;
  email?: string;
  firstName?: string;
  middleName?: string;
  nameExtension?: string;
  password?: string;
  surname?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ApplicantSignUpPayload;
  const firstName = body.firstName?.trim() ?? "";
  const middleName = body.middleName?.trim() ?? "";
  const nameExtension = body.nameExtension?.trim() ?? "";
  const surname = body.surname?.trim() ?? "";
  const email = normalizeEmail(body.email);
  const rawContactNumber = body.contactNumber ?? "";
  const contactNumber = normalizeContactNumber(rawContactNumber);
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!firstName || !surname || !email || !contactNumber || !password || !confirmPassword) {
    return NextResponse.json(
      { success: false, message: "First name, surname, contact number, email, and both password fields are required." },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
  }

  if (!isValidPhilippineMobileNumberInput(rawContactNumber)) {
    return NextResponse.json(
      {
        success: false,
        message: "Enter a valid Philippine mobile number. Use 10 digits after +63, like 9123456789, or 09123456789 on account pages.",
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ success: false, message: "Password confirmation does not match." }, { status: 400 });
  }

  let createdUserId: string | null = null;

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        first_name: firstName,
        full_name: buildFullName({ firstName, lastName: surname, middleName, nameExtension }),
        role: "applicant",
      },
    });

    if (error || !data.user?.id) {
      const isExistingUser = error?.message?.toLowerCase().includes("already");

      return NextResponse.json(
        {
          success: false,
          message: isExistingUser
            ? "An account with this email already exists."
            : error?.message ?? "Unable to create the applicant account.",
        },
        { status: isExistingUser ? 409 : 500 },
      );
    }

    createdUserId = data.user.id;

    await syncProfileRecord({
      authUserId: createdUserId,
      contactNumber,
      email,
      firstName,
      fullName: buildFullName({ firstName, lastName: surname, middleName, nameExtension }),
      lastName: surname,
      middleName,
      nameExtension,
      role: "applicant",
    });

    return NextResponse.json({
      success: true,
      message: "Applicant account created successfully. You can now log in.",
    });
  } catch (error) {
    if (createdUserId) {
      try {
        const adminSupabase = createSupabaseAdminClient();
        await adminSupabase.auth.admin.deleteUser(createdUserId);
      } catch {
        // Best-effort rollback only.
      }

      await deleteProfileByEmail(email);
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to create the applicant account.",
      },
      { status: 500 },
    );
  }
}

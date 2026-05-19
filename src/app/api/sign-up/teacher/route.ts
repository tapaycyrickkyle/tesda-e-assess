import { NextResponse } from "next/server";
import {
  buildFullName,
  deleteProfileByEmail,
  isValidPhilippineMobileNumberInput,
  normalizeContactNumber,
  normalizeEmail,
  normalizeOptionalText,
  syncProfileRecord,
} from "@/lib/registration";
import { createSupabaseAdminClient } from "@/lib/supabase";

const TEACHER_VERIFICATION_BUCKET = "teacher-verification-docs";
const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const middleName = String(formData.get("middleName") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const rawContactNumber = String(formData.get("contactNumber") ?? "");
  const contactNumber = normalizeContactNumber(rawContactNumber);
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const positionTitle = String(formData.get("positionTitle") ?? "").trim();
  const institutionType = String(formData.get("institutionType") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const verificationDocument = formData.get("verificationDocument");

  if (
    !firstName ||
    !surname ||
    !email ||
    !contactNumber ||
    !schoolName ||
    !positionTitle ||
    !institutionType ||
    !password ||
    !confirmPassword
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "First name, surname, contact number, email, school or institution, position, institution type, and both password fields are required.",
      },
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

  if (institutionType !== "public" && institutionType !== "private") {
    return NextResponse.json({ success: false, message: "Choose whether the teacher belongs to a public or private institution." }, { status: 400 });
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

  if (!(verificationDocument instanceof File) || verificationDocument.size === 0) {
    return NextResponse.json(
      { success: false, message: "Upload a valid PRC ID or school-issued ID before creating the teacher account." },
      { status: 400 },
    );
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(verificationDocument.type)) {
    return NextResponse.json(
      { success: false, message: "Verification documents must be a PDF, JPG, or PNG file." },
      { status: 400 },
    );
  }

  if (verificationDocument.size > MAX_VERIFICATION_FILE_SIZE) {
    return NextResponse.json(
      { success: false, message: "Verification documents must be 5MB or smaller." },
      { status: 400 },
    );
  }

  let createdUserId: string | null = null;
  let uploadedDocumentPath: string | null = null;

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        first_name: firstName,
        full_name: buildFullName({ firstName, lastName: surname, middleName }),
        institution_name: schoolName,
        institution_type: institutionType,
        role: "teacher",
      },
    });

    if (error || !data.user?.id) {
      const isExistingUser = error?.message?.toLowerCase().includes("already");

      return NextResponse.json(
        {
          success: false,
          message: isExistingUser
            ? "An account with this email already exists."
            : error?.message ?? "Unable to create the teacher account.",
        },
        { status: isExistingUser ? 409 : 500 },
      );
    }

    createdUserId = data.user.id;

    const fileExtension = verificationDocument.name.includes(".")
      ? verificationDocument.name.slice(verificationDocument.name.lastIndexOf(".")).toLowerCase()
      : verificationDocument.type === "application/pdf"
        ? ".pdf"
        : verificationDocument.type === "image/png"
          ? ".png"
          : ".jpg";
    const sanitizedBaseName = sanitizeFileName(
      verificationDocument.name.replace(/\.[^.]+$/, "") || `${firstName}-${surname}-verification`,
    );
    uploadedDocumentPath = `${createdUserId}/${Date.now()}-${sanitizedBaseName}${fileExtension}`;
    const verificationDocumentBytes = new Uint8Array(await verificationDocument.arrayBuffer());

    const { error: uploadError } = await adminSupabase.storage
      .from(TEACHER_VERIFICATION_BUCKET)
      .upload(uploadedDocumentPath, verificationDocumentBytes, {
        contentType: verificationDocument.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        "Unable to upload the verification document. Run the teacher signup setup SQL and confirm the storage bucket exists.",
      );
    }

    await syncProfileRecord({
      approvalStatus: "pending_review",
      authUserId: createdUserId,
      contactNumber,
      email,
      firstName,
      fullName: buildFullName({ firstName, lastName: surname, middleName }),
      institutionName: schoolName,
      institutionType,
      lastName: surname,
      middleName,
      positionTitle,
      role: "teacher",
    });

    const { error: teacherRequestError } = await adminSupabase.from("teacher_registration_requests").insert({
      approval_status: "pending_review",
      auth_user_id: createdUserId,
      contact_number: contactNumber,
      email,
      first_name: firstName,
      full_name: buildFullName({ firstName, lastName: surname, middleName }),
      institution_name: schoolName,
      institution_type: institutionType,
      last_name: surname,
      middle_name: normalizeOptionalText(middleName),
      position_title: positionTitle,
      verification_document_mime_type: verificationDocument.type,
      verification_document_name: verificationDocument.name,
      verification_document_path: uploadedDocumentPath,
    });

    if (teacherRequestError) {
      throw new Error(
        "Unable to save the teacher registration request. Run the teacher signup setup SQL and confirm the request table exists.",
      );
    }

    return NextResponse.json({
      success: true,
      message: "Teacher account created successfully. Your verification details were also saved for admin review.",
    });
  } catch (error) {
    try {
      const adminSupabase = createSupabaseAdminClient();

      if (uploadedDocumentPath) {
        await adminSupabase.storage.from(TEACHER_VERIFICATION_BUCKET).remove([uploadedDocumentPath]);
      }

      if (createdUserId) {
        await adminSupabase.auth.admin.deleteUser(createdUserId);
      }
    } catch {
      // Best-effort rollback only.
    }

    await deleteProfileByEmail(email);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to create the teacher account.",
      },
      { status: 500 },
    );
  }
}

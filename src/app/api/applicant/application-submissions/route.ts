import { NextResponse } from "next/server";
import {
  buildApplicantName,
  getPrimaryContactNumber,
  normalizeApplicationFormData,
  type ApplicationSubmissionSource,
  type ApplicationSubmissionStatus,
} from "@/lib/application-form";
import {
  getApplicantSubmissionAssignmentInfoByIds,
  getApplicantSubmissionEditLock,
} from "@/lib/application-submission-lifecycle";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type CreateApplicationSubmissionPayload = {
  formData?: unknown;
  roomId?: string | null;
  submissionId?: string | null;
  submissionSource?: ApplicationSubmissionSource | null;
};

function isLegacySubmissionRouteUniqueConflict(error: { code?: string; message?: string; details?: string | null }) {
  if (error.code !== "23505") {
    return false;
  }

  const combinedMessage = `${error.message ?? ""} ${error.details ?? ""}`;

  return (
    combinedMessage.includes("applicant_application_submissions_individual_unique_idx") ||
    combinedMessage.includes("applicant_application_submissions_room_unique_idx")
  );
}

async function verifyRoomMembership(applicantId: string, roomId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Unable to verify the room application path. Make sure the applicant room membership table exists and can be read.",
    );
  }

  return Boolean(data);
}

function buildFallbackApplicantName(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();

  return normalized.length > 0 ? normalized : email;
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const roomId = new URL(request.url).searchParams.get("roomId")?.trim() ?? "";
  const submissionId = new URL(request.url).searchParams.get("submissionId")?.trim() ?? "";
  const isRoomSubmission = Boolean(roomId);
  const supabase = createSupabaseAdminClient();

  if (isRoomSubmission) {
    try {
      const hasMembership = await verifyRoomMembership(currentUser.id, roomId);

      if (!hasMembership) {
        return NextResponse.json(
          { success: false, message: "You must join the room before opening its application form." },
          { status: 403 },
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Unable to verify room membership." },
        { status: 500 },
      );
    }
  }

  const query = supabase
    .from("applicant_application_submissions")
    .select(
      "id, applicant_id, applicant_email, room_id, submission_source, workflow_status, applicant_name, qualification_title, qualification_type, contact_number, form_data, submitted_at, teacher_forwarded_at, created_at, updated_at",
    )
    .eq("applicant_id", currentUser.id);

  if (submissionId) {
    query.eq("id", submissionId);
  }

  if (isRoomSubmission) {
    query.eq("room_id", roomId);
  } else {
    query.is("room_id", null);
  }

  if (!submissionId) {
    query.order("submitted_at", { ascending: false }).limit(1);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the saved application form. Make sure the applicant application submissions table exists and can be read.",
      },
      { status: 500 },
    );
  }

  const submission = data
    ? {
        ...data,
        form_data: normalizeApplicationFormData(data.form_data),
      }
    : null;

  return NextResponse.json({ success: true, submission });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateApplicationSubmissionPayload;
  const roomId = body.roomId?.trim() ?? "";
  const submissionId = body.submissionId?.trim() ?? "";
  const requestedSubmissionSource = body.submissionSource?.trim() ?? "";
  const isRoomSubmission = Boolean(roomId);
  const formData = normalizeApplicationFormData(body.formData);

  if (
    requestedSubmissionSource &&
    requestedSubmissionSource !== "individual" &&
    requestedSubmissionSource !== "room"
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid application path was submitted." },
      { status: 400 },
    );
  }

  if (isRoomSubmission) {
    try {
      const hasMembership = await verifyRoomMembership(currentUser.id, roomId);

      if (!hasMembership) {
        return NextResponse.json(
          { success: false, message: "You must join the room before submitting its application form." },
          { status: 403 },
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Unable to verify room membership." },
        { status: 500 },
      );
    }
  }

  const applicantName = buildApplicantName(formData) || buildFallbackApplicantName(currentUser.email);

  const submissionSource: ApplicationSubmissionSource = isRoomSubmission ? "room" : "individual";
  const workflowStatus: ApplicationSubmissionStatus = isRoomSubmission ? "submitted_to_teacher" : "submitted_to_admin";

  if (requestedSubmissionSource && requestedSubmissionSource !== submissionSource) {
    return NextResponse.json(
      {
        success: false,
        message:
          "The selected application path does not match the current form. Individual applications go to admin, while joined room applications go to the teacher first.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  const existingQuery = supabase
    .from("applicant_application_submissions")
    .select("id, room_id, submission_source, workflow_status")
    .eq("applicant_id", currentUser.id);

  let existingSubmission:
    | {
        id: string;
        room_id: string | null;
        submission_source: ApplicationSubmissionSource;
        workflow_status: ApplicationSubmissionStatus;
      }
    | null = null;
  let existingSubmissionError: {
    code?: string;
    details?: string | null;
    hint?: string | null;
    message?: string;
  } | null = null;

  if (submissionId) {
    const { data, error } = await existingQuery.eq("id", submissionId).maybeSingle();
    existingSubmission = data;
    existingSubmissionError = error;
  } else if (isRoomSubmission) {
    const { data, error } = await existingQuery
      .eq("room_id", roomId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingSubmission = data;
    existingSubmissionError = error;
  }

  if (existingSubmissionError) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to prepare the application form submission. Make sure the submission table exists and can be updated.",
      },
      { status: 500 },
    );
  }

  if (submissionId && !existingSubmission) {
    return NextResponse.json(
      { success: false, message: "Unable to find the application submission you are trying to update." },
      { status: 404 },
    );
  }

  if (existingSubmission) {
    const existingRoomId = existingSubmission.room_id ?? null;
    const expectedRoomId = isRoomSubmission ? roomId : null;

    if (existingRoomId !== expectedRoomId) {
      return NextResponse.json(
        { success: false, message: "This submission does not match the current application route." },
        { status: 400 },
      );
    }

    const assignmentMap = await getApplicantSubmissionAssignmentInfoByIds({
      applicantId: currentUser.id,
      submissionIds: [existingSubmission.id],
    });
    const editLock = getApplicantSubmissionEditLock({
      assignment: assignmentMap.get(existingSubmission.id) ?? null,
      submissionSource: existingSubmission.submission_source,
      workflowStatus: existingSubmission.workflow_status,
    });

    if (editLock.isLocked) {
      return NextResponse.json({ success: false, message: editLock.message }, { status: 403 });
    }
  }

  const payload = {
    applicant_email: currentUser.email,
    applicant_id: currentUser.id,
    applicant_name: applicantName,
    contact_number: getPrimaryContactNumber(formData) || null,
    form_data: formData,
    qualification_title: formData.qualificationTitle,
    qualification_type: formData.assessmentType,
    room_id: isRoomSubmission ? roomId : null,
    submission_source: submissionSource,
    submitted_at: new Date().toISOString(),
    teacher_forwarded_at: null,
    teacher_forwarded_by: null,
    teacher_forwarded_by_email: null,
    updated_at: new Date().toISOString(),
    workflow_status: workflowStatus,
  };

  const mutation = existingSubmission
    ? supabase
        .from("applicant_application_submissions")
        .update(payload)
        .eq("id", existingSubmission.id)
        .select("id")
        .single()
    : supabase.from("applicant_application_submissions").insert(payload).select("id").single();

  const { data: savedSubmission, error } = await mutation;

  if (error) {
    console.error("Failed to save applicant application submission", {
      applicantId: currentUser.id,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      errorMessage: error.message,
      roomId: isRoomSubmission ? roomId : null,
      submissionId: existingSubmission?.id ?? null,
      submissionSource,
    });

    if (!existingSubmission && isLegacySubmissionRouteUniqueConflict(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to save a new application as a separate entry because the database still enforces one submission per route. Run the applicant application submissions setup SQL to remove the legacy unique indexes, then try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save the application form. Confirm the applicant submissions table exists and applicants can save their own forms.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: isRoomSubmission
      ? existingSubmission
        ? "Application updated and sent back to your teacher for batch review."
        : "Application submitted to your teacher for batch review."
      : existingSubmission
        ? "Application updated and resubmitted to TESDA successfully."
        : "Application submitted to TESDA successfully.",
    submissionId: savedSubmission?.id ?? existingSubmission?.id ?? null,
  });
}

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
  getApplicantSubmissionWithdrawalLock,
} from "@/lib/application-submission-lifecycle";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition, type PortalNotificationInput } from "@/lib/workflow-history";

type CreateApplicationSubmissionPayload = {
  formData?: unknown;
  roomId?: string | null;
  submissionId?: string | null;
  submissionSource?: ApplicationSubmissionSource | null;
};

type UpdateApplicationSubmissionPayload = {
  action?: "withdraw";
  reason?: string | null;
  submissionId?: string | null;
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

  const workflowStatus: ApplicationSubmissionStatus =
    existingSubmission?.workflow_status === "needs_applicant_update"
      ? "submitted_to_admin"
      : isRoomSubmission
        ? "submitted_to_teacher"
        : "submitted_to_admin";

  const submittedAt = new Date().toISOString();
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
    submitted_at: submittedAt,
    teacher_forwarded_at: null,
    teacher_forwarded_by: null,
    teacher_forwarded_by_email: null,
    latest_status_reason: null,
    latest_status_updated_at: submittedAt,
    updated_at: submittedAt,
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

  try {
    let notifications: PortalNotificationInput[] | undefined;

    if (submissionSource === "room" && roomId && workflowStatus === "submitted_to_teacher") {
      const { data: roomRecord } = await supabase
        .from("rooms")
        .select("id, name, teacher_id")
        .eq("id", roomId)
        .maybeSingle();

      if (roomRecord?.teacher_id) {
        const { data: teacherProfile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", roomRecord.teacher_id)
          .maybeSingle();

        if (teacherProfile?.email) {
          notifications = [
            {
              message: existingSubmission
                ? `${applicantName} resubmitted ${formData.qualificationTitle} in ${roomRecord.name}.`
                : `${applicantName} submitted ${formData.qualificationTitle} in ${roomRecord.name}.`,
              notificationType: "info",
              recipientEmail: teacherProfile.email,
              recipientRole: "teacher",
              recipientUserId: teacherProfile.id ?? roomRecord.teacher_id,
              submissionId: savedSubmission?.id ?? existingSubmission?.id ?? "",
              title: existingSubmission ? "Room Submission Updated" : "New Room Submission",
            },
          ];
        }
      }
    } else if (workflowStatus === "submitted_to_admin") {
      const { data: adminRecipients } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("role", "admin");

      if (adminRecipients && adminRecipients.length > 0) {
        notifications = adminRecipients
          .filter((adminRecipient) => Boolean(adminRecipient.email))
          .map((adminRecipient) => ({
            message: existingSubmission
              ? `${applicantName} resubmitted ${formData.qualificationTitle} and it is back in the TESDA queue.`
              : `${applicantName} submitted ${formData.qualificationTitle} directly to TESDA and it is ready for review.`,
            notificationType: "info",
            recipientEmail: adminRecipient.email,
            recipientRole: "admin" as const,
            recipientUserId: adminRecipient.id ?? null,
            submissionId: savedSubmission?.id ?? existingSubmission?.id ?? "",
            title: existingSubmission ? "Individual Submission Updated" : "New Individual Submission",
          }));
      }
    }

    await recordSubmissionWorkflowTransition({
      actor: currentUser,
      eventType: existingSubmission
        ? "applicant_resubmitted"
        : submissionSource === "room"
          ? "applicant_submitted_to_teacher"
          : "applicant_submitted",
      fromStatus: existingSubmission?.workflow_status ?? null,
      notifications,
      submissionId: savedSubmission?.id ?? existingSubmission?.id ?? "",
      toStatus: workflowStatus,
    });
  } catch (historyError) {
    console.error("Failed to record applicant submission workflow history.", {
      error: historyError,
      submissionId: savedSubmission?.id ?? existingSubmission?.id ?? null,
      userId: currentUser.id,
    });
  }

  return NextResponse.json({
    success: true,
    message:
      workflowStatus === "submitted_to_teacher"
        ? existingSubmission
          ? "Application updated and sent back to your teacher for batch review."
          : "Application submitted to your teacher for batch review."
        : existingSubmission
          ? "Application updated and resubmitted to TESDA successfully."
          : "Application submitted to TESDA successfully.",
    submissionId: savedSubmission?.id ?? existingSubmission?.id ?? null,
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const body = (await request.json()) as UpdateApplicationSubmissionPayload;
  const submissionId = body.submissionId?.trim() ?? "";
  const reason = body.reason?.trim() ?? "";
  const action = body.action;

  if (!submissionId || action !== "withdraw") {
    return NextResponse.json(
      { success: false, message: "A valid submission and applicant action are required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: submission, error: submissionError } = await supabase
    .from("applicant_application_submissions")
    .select("id, room_id, submission_source, workflow_status")
    .eq("id", submissionId)
    .eq("applicant_id", currentUser.id)
    .maybeSingle();

  if (submissionError || !submission) {
    return NextResponse.json(
      { success: false, message: "Unable to find the application submission you are trying to withdraw." },
      { status: submissionError ? 500 : 404 },
    );
  }

  const assignmentMap = await getApplicantSubmissionAssignmentInfoByIds({
    applicantId: currentUser.id,
    submissionIds: [submission.id],
  });
  const withdrawalLock = getApplicantSubmissionWithdrawalLock({
    assignment: assignmentMap.get(submission.id) ?? null,
    workflowStatus: submission.workflow_status,
  });

  if (withdrawalLock.isLocked) {
    return NextResponse.json({ success: false, message: withdrawalLock.message }, { status: 403 });
  }

  const withdrawnAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("applicant_application_submissions")
    .update({
      latest_status_reason: reason || null,
      latest_status_updated_at: withdrawnAt,
      updated_at: withdrawnAt,
      workflow_status: "withdrawn" satisfies ApplicationSubmissionStatus,
    })
    .eq("id", submission.id)
    .eq("applicant_id", currentUser.id);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Unable to withdraw the application right now." },
      { status: 500 },
    );
  }

  try {
    let notifications:
      | Array<{
          message: string;
          notificationType: string;
          recipientEmail: string;
          recipientRole: "teacher";
          recipientUserId: string | null;
          submissionId: string;
          title: string;
        }>
      | undefined;

    if (submission.submission_source === "room" && submission.workflow_status === "submitted_to_teacher" && submission.room_id) {
      const { data: roomRecord } = await supabase
        .from("rooms")
        .select("id, name, teacher_id")
        .eq("id", submission.room_id)
        .maybeSingle();

      if (roomRecord?.teacher_id) {
        const { data: teacherProfile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", roomRecord.teacher_id)
          .maybeSingle();

        if (teacherProfile?.email) {
          notifications = [
            {
              message: `A room-based application in ${roomRecord.name} was withdrawn before teacher forwarding.`,
              notificationType: "warning",
              recipientEmail: teacherProfile.email,
              recipientRole: "teacher",
              recipientUserId: teacherProfile.id ?? roomRecord.teacher_id,
              submissionId: submission.id,
              title: "Room Submission Withdrawn",
            },
          ];
        }
      }
    }

    await recordSubmissionWorkflowTransition({
      actor: currentUser,
      eventType: "applicant_withdrew",
      fromStatus: submission.workflow_status,
      notifications,
      reason,
      submissionId: submission.id,
      toStatus: "withdrawn",
    });
  } catch (historyError) {
    console.error("Failed to record applicant withdrawal workflow history.", {
      error: historyError,
      submissionId: submission.id,
      userId: currentUser.id,
    });
  }

  return NextResponse.json({
    success: true,
    message:
      submission.submission_source === "room"
        ? "Your room application was withdrawn successfully."
        : "Your application was withdrawn successfully.",
    workflowStatus: "withdrawn" satisfies ApplicationSubmissionStatus,
  });
}

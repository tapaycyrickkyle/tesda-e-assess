import { NextResponse } from "next/server";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { generateRoomCode } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition } from "@/lib/workflow-history";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

type UpdateRoomPayload = {
  action?: "deactivate" | "activate" | "regenerate_code" | "remove_member" | "submit_applications";
  memberId?: string;
};

const terminalRoomSubmissionStatuses = new Set<ApplicationSubmissionStatus>([
  "completed",
  "rejected",
  "cancelled",
  "withdrawn",
]);

async function generateUniqueRoomCode() {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = generateRoomCode();
    const { data, error } = await supabase.from("rooms").select("id").eq("join_code", joinCode).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return joinCode;
    }
  }

  throw new Error("Unable to generate a unique room code. Please try again.");
}

export async function GET(_: Request, context: RouteContext) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const { roomId } = await context.params;
  const supabase = createSupabaseAdminClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("id", roomId)
    .eq("teacher_id", currentUser.id)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load room details. Check that your Supabase tables and RLS policies are configured.",
      },
      { status: 500 },
    );
  }

  if (!room) {
    return NextResponse.json({ success: false, message: "Room not found." }, { status: 404 });
  }

  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("id, applicant_id, applicant_email, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: false });

  if (membersError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load room members. Check that your Supabase tables and RLS policies are configured.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    room,
    members: members ?? [],
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const { roomId } = await context.params;
  const body = (await request.json()) as UpdateRoomPayload;
  const action = body.action;

  if (!action) {
    return NextResponse.json({ success: false, message: "Action is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: room, error: roomLookupError } = await supabase
    .from("rooms")
    .select("id, teacher_id, name")
    .eq("id", roomId)
    .eq("teacher_id", currentUser.id)
    .maybeSingle();

  if (roomLookupError) {
    return NextResponse.json({ success: false, message: "Unable to verify room ownership." }, { status: 500 });
  }

  if (!room) {
    return NextResponse.json({ success: false, message: "Room not found." }, { status: 404 });
  }

  let updateValues: Record<string, unknown>;

  try {
    if (action === "regenerate_code") {
      updateValues = {
        join_code: await generateUniqueRoomCode(),
      };
    } else if (action === "submit_applications") {
      const [{ data: members, error: membersError }, { data: submissions, error: submissionsError }] = await Promise.all([
        supabase.from("room_members").select("applicant_id").eq("room_id", roomId),
        supabase
          .from("applicant_application_submissions")
          .select("id, applicant_id, applicant_email, applicant_name, qualification_title, workflow_status")
          .eq("room_id", roomId),
      ]);

      if (membersError || submissionsError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to load room application submissions. Make sure the room and applicant submission tables are available.",
          },
          { status: 500 },
        );
      }

      const joinedApplicantIds = (members ?? []).map((member) => member.applicant_id);

      if (joinedApplicantIds.length === 0) {
        return NextResponse.json(
          { success: false, message: "No applicants have joined this room yet." },
          { status: 400 },
        );
      }

      const submittedApplicantIds = new Set((submissions ?? []).map((submission) => submission.applicant_id));
      const missingApplicants = joinedApplicantIds.filter((applicantId) => !submittedApplicantIds.has(applicantId));

      if (missingApplicants.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "All joined applicants must submit their application form before the batch can be forwarded.",
          },
          { status: 400 },
        );
      }

      const submissionIdsToForward = (submissions ?? [])
        .filter((submission) => submission.workflow_status === "submitted_to_teacher")
        .map((submission) => submission.id);
      const submissionsToForward = (submissions ?? []).filter((submission) => submission.workflow_status === "submitted_to_teacher");

      if (submissionIdsToForward.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All current room application submissions have already been submitted to TESDA.",
          submittedCount: 0,
        });
      }

      const forwardedAt = new Date().toISOString();
      const { error: submissionUpdateError } = await supabase
        .from("applicant_application_submissions")
        .update({
          teacher_forwarded_at: forwardedAt,
          teacher_forwarded_by: currentUser.id,
          teacher_forwarded_by_email: currentUser.email,
          updated_at: forwardedAt,
          workflow_status: "submitted_to_admin",
        })
        .in("id", submissionIdsToForward);

      if (submissionUpdateError) {
        return NextResponse.json(
          {
            success: false,
            message: "Unable to forward room submissions to admin right now.",
          },
          { status: 500 },
        );
      }

      try {
        const { data: adminRecipients } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("role", "admin");

        await Promise.all(
          submissionsToForward.map((submission) =>
            recordSubmissionWorkflowTransition({
              actor: currentUser,
              eventType: "teacher_forwarded_to_admin",
              fromStatus: submission.workflow_status,
              metadata: {
                roomId,
                roomName: room.name,
              },
              notifications: [
                {
                  message: `${room.name}: your ${submission.qualification_title} application is now in the TESDA queue.`,
                  notificationType: "success",
                  recipientEmail: submission.applicant_email,
                  recipientRole: "applicant",
                  recipientUserId: submission.applicant_id,
                  submissionId: submission.id,
                  title: "Application Forwarded",
                },
                ...(adminRecipients ?? []).map((adminRecipient) => ({
                  message: `${submission.applicant_name} from ${room.name} submitted ${submission.qualification_title} and is ready for center assignment.`,
                  notificationType: "info",
                  recipientEmail: adminRecipient.email,
                  recipientRole: "admin" as const,
                  recipientUserId: adminRecipient.id,
                  submissionId: submission.id,
                  title: "Room Submission Ready",
                })),
              ],
              submissionId: submission.id,
              toStatus: "submitted_to_admin",
            }),
          ),
        );
      } catch (historyError) {
        console.error("Failed to record teacher forwarding workflow history.", {
          error: historyError,
          roomId,
          teacherId: currentUser.id,
        });
      }

      return NextResponse.json({
        success: true,
        message:
          submissionIdsToForward.length === 1
            ? "1 room application was submitted to TESDA successfully."
            : `${submissionIdsToForward.length} room applications were submitted to TESDA successfully.`,
        submittedCount: submissionIdsToForward.length,
      });
    } else if (action === "remove_member") {
      const memberId = body.memberId?.trim() ?? "";

      if (!memberId) {
        return NextResponse.json({ success: false, message: "The room member to remove is required." }, { status: 400 });
      }

      const { data: member, error: memberLookupError } = await supabase
        .from("room_members")
        .select("id, applicant_id")
        .eq("id", memberId)
        .eq("room_id", roomId)
        .maybeSingle();

      if (memberLookupError) {
        return NextResponse.json({ success: false, message: "Unable to verify the selected room member." }, { status: 500 });
      }

      if (!member) {
        return NextResponse.json({ success: false, message: "The selected applicant is no longer in this room." }, { status: 404 });
      }

      const { data: linkedSubmission, error: linkedSubmissionError } = await supabase
        .from("applicant_application_submissions")
        .select("id, teacher_forwarded_at")
        .eq("room_id", roomId)
        .eq("applicant_id", member.applicant_id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (linkedSubmissionError) {
        return NextResponse.json(
          { success: false, message: "Unable to verify whether this applicant's room submission was already forwarded." },
          { status: 500 },
        );
      }

      if (linkedSubmission?.teacher_forwarded_at) {
        return NextResponse.json(
          {
            success: false,
            message: "This applicant can no longer be removed because the room submission was already submitted to TESDA.",
          },
          { status: 400 },
        );
      }

      const { error: removeMemberError } = await supabase
        .from("room_members")
        .delete()
        .eq("id", member.id)
        .eq("room_id", roomId);

      if (removeMemberError) {
        return NextResponse.json({ success: false, message: "Unable to remove the applicant from this room." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Applicant removed from the room successfully.",
        removedMemberId: member.id,
      });
    } else if (action === "deactivate") {
      updateValues = { is_active: false };
    } else if (action === "activate") {
      updateValues = { is_active: true };
    } else {
      return NextResponse.json({ success: false, message: "Unsupported action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update room.",
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("rooms")
    .update(updateValues)
    .eq("id", roomId)
    .eq("teacher_id", currentUser.id)
    .select("id, name, qualification, join_code, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: "Unable to update room." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message:
      action === "regenerate_code"
        ? "Room code regenerated successfully."
        : action === "deactivate"
          ? "Room deactivated successfully."
          : "Room activated successfully.",
    room: data,
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const { roomId } = await context.params;
  const supabase = createSupabaseAdminClient();

  const [{ data: members, error: membersError }, { data: submissions, error: submissionsError }] = await Promise.all([
    supabase.from("room_members").select("id").eq("room_id", roomId),
    supabase.from("applicant_application_submissions").select("id, workflow_status").eq("room_id", roomId),
  ]);

  if (membersError || submissionsError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify whether the room can be deleted right now.",
      },
      { status: 500 },
    );
  }

  if ((members ?? []).length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Remove all joined applicants from the room before deleting it.",
      },
      { status: 400 },
    );
  }

  const activeSubmissionCount = (submissions ?? []).filter(
    (submission) => !terminalRoomSubmissionStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  ).length;

  if (activeSubmissionCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          activeSubmissionCount === 1
            ? "This room still has 1 active application in progress. Ask the applicant to withdraw it or let the workflow finish before deleting the room."
            : `This room still has ${activeSubmissionCount} active applications in progress. Ask the applicants to withdraw them or let the workflow finish before deleting the room.`,
      },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("teacher_id", currentUser.id);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete room. Make sure teachers can delete their own rooms in Supabase RLS.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Room deleted successfully.",
  });
}

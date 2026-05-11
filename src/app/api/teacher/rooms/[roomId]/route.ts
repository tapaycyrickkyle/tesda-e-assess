import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { generateRoomCode } from "@/lib/rooms";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

type UpdateRoomPayload = {
  action?: "deactivate" | "activate" | "regenerate_code" | "submit_applications";
};

async function generateUniqueRoomCode(accessToken: string) {
  const supabase = createSupabaseAccessTokenClient(accessToken);

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
  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  const [{ data: room, error: roomError }, { data: members, error: membersError }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, qualification, join_code, is_active, created_at")
      .eq("id", roomId)
      .eq("teacher_id", currentUser.id)
      .maybeSingle(),
    supabase
      .from("room_members")
      .select("id, applicant_id, applicant_email, joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: false }),
  ]);

  if (roomError || membersError) {
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

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  const { data: room, error: roomLookupError } = await supabase
    .from("rooms")
    .select("id, teacher_id")
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
        join_code: await generateUniqueRoomCode(currentUser.accessToken),
      };
    } else if (action === "submit_applications") {
      const [{ data: members, error: membersError }, { data: submissions, error: submissionsError }] = await Promise.all([
        supabase.from("room_members").select("applicant_id").eq("room_id", roomId),
        supabase
          .from("applicant_application_submissions")
          .select("id, applicant_id, workflow_status")
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

      if (submissionIdsToForward.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All current room application submissions have already been forwarded to admin.",
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

      return NextResponse.json({
        success: true,
        message:
          submissionIdsToForward.length === 1
            ? "1 room application was forwarded to admin successfully."
            : `${submissionIdsToForward.length} room applications were forwarded to admin successfully.`,
        submittedCount: submissionIdsToForward.length,
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
  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

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

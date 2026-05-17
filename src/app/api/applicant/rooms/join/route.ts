import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { normalizeRoomCode, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

type JoinRoomPayload = {
  code?: string;
};

const ROOM_JOIN_WINDOW_MINUTES = 15;
const ROOM_JOIN_MAX_FAILED_ATTEMPTS = 5;

async function countRecentFailedJoinAttempts(applicantId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const windowStart = new Date(Date.now() - ROOM_JOIN_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await adminSupabase
    .from("room_join_attempts")
    .select("*", { count: "exact", head: true })
    .eq("applicant_id", applicantId)
    .eq("was_success", false)
    .gte("attempted_at", windowStart);

  if (error) {
    console.error("Failed to count recent room join attempts", {
      applicantId,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      errorMessage: error.message,
    });
    return null;
  }

  return count ?? 0;
}

async function recordRoomJoinAttempt({
  applicantId,
  attemptedCode,
  wasSuccess,
}: {
  applicantId: string;
  attemptedCode: string;
  wasSuccess: boolean;
}) {
  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase.from("room_join_attempts").insert({
    applicant_id: applicantId,
    attempted_code: attemptedCode,
    attempted_at: new Date().toISOString(),
    was_success: wasSuccess,
  });

  if (error) {
    console.error("Failed to record room join attempt", {
      applicantId,
      attemptedCode,
      wasSuccess,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      errorMessage: error.message,
    });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const body = (await request.json()) as JoinRoomPayload;
  const code = normalizeRoomCode(body.code ?? "");

  if (!code) {
    return NextResponse.json({ success: false, message: "Room code is required." }, { status: 400 });
  }

  const adminSupabase = createSupabaseAdminClient();
  const recentFailedAttempts = await countRecentFailedJoinAttempts(currentUser.id);

  if (recentFailedAttempts !== null && recentFailedAttempts >= ROOM_JOIN_MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many room join attempts. Please wait a few minutes before trying again.",
      },
      { status: 429 },
    );
  }

  const { data: room, error: roomError } = await adminSupabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("join_code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify the room code right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  if (!room) {
    await recordRoomJoinAttempt({
      applicantId: currentUser.id,
      attemptedCode: code,
      wasSuccess: false,
    });
    return NextResponse.json({ success: false, message: "Room code not found or inactive." }, { status: 404 });
  }

  const { data: existingMembership, error: membershipLookupError } = await adminSupabase
    .from("room_members")
    .select("id")
    .eq("room_id", room.id)
    .eq("applicant_id", currentUser.id)
    .maybeSingle();

  if (membershipLookupError) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify your room membership. Make sure the `room_members` table exists and its RLS policies are configured.",
      },
      { status: 500 },
    );
  }

  if (!existingMembership) {
    const { error: insertError } = await adminSupabase.from("room_members").insert({
      room_id: room.id,
      applicant_id: currentUser.id,
      applicant_email: currentUser.email,
    });

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to join the room. Confirm the `room_members` table exists and the membership record can be saved.",
        },
        { status: 500 },
      );
    }
  }

  await recordRoomJoinAttempt({
    applicantId: currentUser.id,
    attemptedCode: code,
    wasSuccess: true,
  });

  return NextResponse.json({
    success: true,
    message: existingMembership ? "You are already in this room." : "Joined room successfully.",
    room: room as RoomRecord,
  });
}

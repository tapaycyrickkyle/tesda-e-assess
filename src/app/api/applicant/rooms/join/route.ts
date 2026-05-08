import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { normalizeRoomCode, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type JoinRoomPayload = {
  code?: string;
};

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "student") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const body = (await request.json()) as JoinRoomPayload;
  const code = normalizeRoomCode(body.code ?? "");

  if (!code) {
    return NextResponse.json({ success: false, message: "Room code is required." }, { status: 400 });
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { data: room, error: roomError } = await supabase
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
          "Unable to verify the room code. Make sure the `rooms` table and its RLS policies are configured in Supabase.",
      },
      { status: 500 },
    );
  }

  if (!room) {
    return NextResponse.json({ success: false, message: "Room code not found or inactive." }, { status: 404 });
  }

  const { data: existingMembership, error: membershipLookupError } = await supabase
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
    const { error: insertError } = await supabase.from("room_members").insert({
      room_id: room.id,
      applicant_id: currentUser.id,
      applicant_email: currentUser.email,
    });

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to join the room. Confirm the `room_members` table exists and applicants can insert their own membership records.",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: existingMembership ? "You are already in this room." : "Joined room successfully.",
    room: room as RoomRecord,
  });
}

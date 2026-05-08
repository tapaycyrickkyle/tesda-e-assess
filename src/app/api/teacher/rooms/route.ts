import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { generateRoomCode, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type CreateRoomPayload = {
  name?: string;
  qualification?: string;
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

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("teacher_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load rooms. Make sure the `rooms` table and its RLS policies are created in Supabase.",
      },
      { status: 500 },
    );
  }

  const rooms = (data ?? []) as RoomRecord[];

  if (rooms.length === 0) {
    return NextResponse.json({ success: true, rooms });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("room_members")
    .select("room_id")
    .in(
      "room_id",
      rooms.map((room) => room.id),
    );

  if (membershipError) {
    return NextResponse.json({ success: true, rooms });
  }

  const counts = new Map<string, number>();

  for (const membership of memberships ?? []) {
    const roomId = (membership as { room_id: string }).room_id;
    counts.set(roomId, (counts.get(roomId) ?? 0) + 1);
  }

  return NextResponse.json({
    success: true,
    rooms: rooms.map((room) => ({
      ...room,
      member_count: counts.get(room.id) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateRoomPayload;
  const name = body.name?.trim() ?? "";
  const qualification = body.qualification?.trim() ?? "";

  if (!name || !qualification) {
    return NextResponse.json(
      { success: false, message: "Room name and qualification are required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  try {
    const joinCode = await generateUniqueRoomCode(currentUser.accessToken);
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        teacher_id: currentUser.id,
        teacher_email: currentUser.email,
        name,
        qualification,
        join_code: joinCode,
        is_active: true,
      })
      .select("id, name, qualification, join_code, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create room. Make sure the `rooms` table exists and your Supabase RLS policies allow teachers to insert their own rooms.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room created successfully.",
      room: {
        ...(data as RoomRecord),
        member_count: 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to create room.",
      },
      { status: 500 },
    );
  }
}

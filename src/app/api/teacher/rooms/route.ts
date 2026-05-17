import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { generateRoomCode, getRoomSubmissionStatus, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

type CreateRoomPayload = {
  name?: string;
  qualification?: string;
};

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

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "Teacher access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("teacher_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your rooms right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  const rooms = (data ?? []) as RoomRecord[];

  if (rooms.length === 0) {
    return NextResponse.json({ success: true, rooms });
  }

  const roomIds = rooms.map((room) => room.id);
  const [{ data: memberships, error: membershipError }, { data: submissions, error: submissionError }] =
    await Promise.all([
      supabase.from("room_members").select("room_id").in("room_id", roomIds),
      supabase
        .from("applicant_application_submissions")
        .select("room_id, applicant_id, workflow_status")
        .in("room_id", roomIds),
    ]);

  if (membershipError || submissionError) {
    return NextResponse.json({ success: true, rooms });
  }

  const counts = new Map<string, number>();
  const submissionsByRoomId = new Map<
    string,
    Array<{ applicant_id: string; workflow_status: "submitted_to_teacher" | "submitted_to_admin" }>
  >();

  for (const membership of memberships ?? []) {
    const roomId = (membership as { room_id: string }).room_id;
    counts.set(roomId, (counts.get(roomId) ?? 0) + 1);
  }

  for (const submission of submissions ?? []) {
    const typedSubmission = submission as {
      applicant_id: string;
      room_id: string | null;
      workflow_status: "submitted_to_teacher" | "submitted_to_admin";
    };

    if (!typedSubmission.room_id) {
      continue;
    }

    const roomSubmissions = submissionsByRoomId.get(typedSubmission.room_id) ?? [];
    roomSubmissions.push({
      applicant_id: typedSubmission.applicant_id,
      workflow_status: typedSubmission.workflow_status,
    });
    submissionsByRoomId.set(typedSubmission.room_id, roomSubmissions);
  }

  return NextResponse.json({
    success: true,
    rooms: rooms.map((room) => ({
      ...room,
      member_count: counts.get(room.id) ?? 0,
      submission_status: getRoomSubmissionStatus(counts.get(room.id) ?? 0, submissionsByRoomId.get(room.id) ?? []),
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
  const qualification = body.qualification?.trim() ?? "";

  if (!qualification) {
    return NextResponse.json(
      { success: false, message: "Qualification is required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase.from("profiles").select("institution_name").eq("id", currentUser.id).maybeSingle();
  const name = ((profile as { institution_name?: string | null } | null)?.institution_name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { success: false, message: "Your school name is missing from the teacher profile. Please contact admin." },
      { status: 400 },
    );
  }

  try {
    const joinCode = await generateUniqueRoomCode();
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
          message: "Unable to create the room right now. Please try again in a moment.",
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
        submission_status: "not_submitted",
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

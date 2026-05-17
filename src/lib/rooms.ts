export const ROOM_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

import type { PostgrestError } from "@supabase/supabase-js";
import type { ApplicationSubmissionStatus } from "@/lib/application-form";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type RoomSubmissionStatus = "submitted" | "not_submitted";

export type RoomRecord = {
  id: string;
  name: string;
  qualification: string;
  join_code: string;
  is_active: boolean;
  created_at: string;
  member_count?: number;
  submission_status?: RoomSubmissionStatus;
};

export type ApplicantJoinedRoomMembership = {
  id: string;
  joined_at: string;
  room_id: string;
  room: RoomRecord | null;
};

type RoomSubmissionEntry = {
  applicant_id: string;
  workflow_status: ApplicationSubmissionStatus;
};

export function getRoomSubmissionStatus(
  memberCount: number,
  submissions: RoomSubmissionEntry[],
): RoomSubmissionStatus {
  if (memberCount === 0 || submissions.length === 0) {
    return "not_submitted";
  }

  const submittedApplicantIds = new Set(submissions.map((submission) => submission.applicant_id));

  if (submittedApplicantIds.size < memberCount) {
    return "not_submitted";
  }

  return submissions.every(
    (submission) =>
      submission.workflow_status !== "submitted_to_teacher" && submission.workflow_status !== "draft",
  )
    ? "submitted"
    : "not_submitted";
}

export function getRoomSubmissionStatusLabel(status: RoomSubmissionStatus) {
  return status === "submitted" ? "Submitted" : "Not Submitted";
}

export function generateRoomCode(length = 6) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  let code = "";

  for (const value of values) {
    code += ROOM_CODE_CHARSET[value % ROOM_CODE_CHARSET.length];
  }

  return code;
}

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function loadApplicantJoinedRooms(accessToken: string, applicantId: string): Promise<{
  error: PostgrestError | null;
  memberships: ApplicantJoinedRoomMembership[];
}> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: membershipRows, error: membershipsError } = await adminSupabase
    .from("room_members")
    .select("id, joined_at, room_id")
    .eq("applicant_id", applicantId)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    return { error: membershipsError, memberships: [] };
  }

  const roomIds = [...new Set((membershipRows ?? []).map((membership) => membership.room_id).filter(Boolean))];
  const { data: roomRows, error: roomsError } =
    roomIds.length > 0
      ? await adminSupabase
          .from("rooms")
          .select("id, name, qualification, join_code, is_active, created_at")
          .in("id", roomIds)
      : { data: [] as RoomRecord[], error: null };

  if (roomsError) {
    return { error: roomsError, memberships: [] };
  }

  const roomById = new Map((roomRows ?? []).map((room) => [room.id, room as RoomRecord]));

  return {
    error: null,
    memberships: (membershipRows ?? []).map((membership) => ({
      id: membership.id,
      joined_at: membership.joined_at,
      room: roomById.get(membership.room_id) ?? null,
      room_id: membership.room_id,
    })),
  };
}

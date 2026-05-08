import { notFound } from "next/navigation";
import TeacherRoomDetailClient from "@/app/teacher/room/[roomId]/TeacherRoomDetailClient";
import { getCurrentAppUser } from "@/lib/current-user";
import type { RoomRecord } from "@/lib/rooms";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type RouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

type RoomMember = {
  id: string;
  applicant_id: string;
  applicant_email: string;
  joined_at: string;
};

export default async function TeacherRoomDetailPage({ params }: RouteProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "teacher") {
    notFound();
  }

  const { roomId } = await params;
  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  const [{ data: room }, { data: members }] = await Promise.all([
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

  if (!room) {
    notFound();
  }

  return (
    <TeacherRoomDetailClient
      initialMembers={(members ?? []) as RoomMember[]}
      initialRoom={room as RoomRecord}
    />
  );
}

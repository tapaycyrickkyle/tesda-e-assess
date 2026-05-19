import { notFound } from "next/navigation";
import TeacherRoomDetailClient from "@/app/teacher/rooms/[roomId]/TeacherRoomDetailClient";
import { getCurrentAppUser } from "@/lib/current-user";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import type { RoomRecord } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

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

type RoomApplicationSubmission = {
  applicant_id: string;
  applicant_name: string;
  id: string;
  qualification_title: string;
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: ApplicationSubmissionStatus;
};

export default async function TeacherRoomDetailPage({ params }: RouteProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "teacher") {
    notFound();
  }

  const { roomId } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("id", roomId)
    .eq("teacher_id", currentUser.id)
    .maybeSingle();

  if (!room) {
    notFound();
  }

  const [{ data: members }, { data: submissions }] = await Promise.all([
    supabase
      .from("room_members")
      .select("id, applicant_id, applicant_email, joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: false }),
    supabase
      .from("applicant_application_submissions")
      .select("id, applicant_id, applicant_name, qualification_title, submitted_at, teacher_forwarded_at, workflow_status")
      .eq("room_id", roomId)
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <TeacherRoomDetailClient
      initialApplications={(submissions ?? []) as RoomApplicationSubmission[]}
      initialMembers={(members ?? []) as RoomMember[]}
      initialRoom={room as RoomRecord}
    />
  );
}

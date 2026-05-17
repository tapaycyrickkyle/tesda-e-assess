import { NextResponse } from "next/server";
import { normalizeApplicationFormData } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: submissions, error: submissionsError }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("applicant_application_submissions")
        .select(
          "id, applicant_id, applicant_email, applicant_name, contact_number, qualification_title, qualification_type, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status, form_data",
        )
        .eq("workflow_status", "submitted_to_admin")
        .order("teacher_forwarded_at", { ascending: false, nullsFirst: false })
        .order("submitted_at", { ascending: false }),
      supabase.from("assessment_center_applicants").select("applicant_reference"),
    ]);

  if (submissionsError || assignmentsError) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load submitted applicants. Make sure the applicant submissions and assignment tables exist and admins can read them.",
      },
      { status: 500 },
    );
  }

  const assignedSubmissionIds = new Set((assignments ?? []).map((assignment) => assignment.applicant_reference));
  const queueEntries = (submissions ?? []).filter((submission) => !assignedSubmissionIds.has(submission.id));
  const roomIds = [...new Set(queueEntries.map((submission) => submission.room_id).filter(Boolean))];

  const { data: rooms, error: roomsError } =
    roomIds.length > 0
      ? await supabase.from("rooms").select("id, name, qualification, join_code").in("id", roomIds)
      : { data: [], error: null };

  if (roomsError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load the submitted room details for bulk applications.",
      },
      { status: 500 },
    );
  }

  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room]));
  const normalizedSubmissions = queueEntries.map((submission) => ({
    ...submission,
    form_data: normalizeApplicationFormData(submission.form_data),
    room: submission.room_id ? roomMap.get(submission.room_id) ?? null : null,
  }));

  return NextResponse.json({ success: true, submissions: normalizedSubmissions });
}

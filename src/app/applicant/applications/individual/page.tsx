import { notFound } from "next/navigation";
import ApplicantApplicationFormClient from "@/app/applicant/applications/ApplicationFormClient";
import { normalizeApplicationFormData, type ApplicationSubmissionRecord } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type IndividualApplicationPageProps = {
  searchParams: Promise<{ edit?: string | string[]; roomId?: string | string[]; submissionId?: string | string[] }>;
};

export default async function IndividualApplicationPage({ searchParams }: IndividualApplicationPageProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "student") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const editParam = resolvedSearchParams.edit;
  const roomIdParam = resolvedSearchParams.roomId;
  const submissionIdParam = resolvedSearchParams.submissionId;
  const shouldLoadExistingSubmission = Array.isArray(editParam) ? editParam.includes("1") : editParam === "1";
  const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;
  const submissionId = Array.isArray(submissionIdParam) ? submissionIdParam[0] : submissionIdParam;
  const isRoomApplication = Boolean(roomId?.trim());
  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  let room: { id: string; join_code: string; name: string; qualification: string } | null = null;

  if (isRoomApplication) {
    const [{ data: membership }, { data: matchedRoom }] = await Promise.all([
      supabase
        .from("room_members")
        .select("id")
        .eq("room_id", roomId!.trim())
        .eq("applicant_id", currentUser.id)
        .maybeSingle(),
      supabase.from("rooms").select("id, name, qualification, join_code").eq("id", roomId!.trim()).maybeSingle(),
    ]);

    if (!membership || !matchedRoom) {
      notFound();
    }

    room = matchedRoom;
  }

  if (!shouldLoadExistingSubmission || !submissionId?.trim()) {
    return (
      <ApplicantApplicationFormClient
        applicantEmail={currentUser.email}
        existingSubmission={null}
        mode={isRoomApplication ? "room" : "individual"}
        room={room}
      />
    );
  }

  const submissionQuery = supabase
    .from("applicant_application_submissions")
    .select(
      "id, applicant_id, applicant_email, room_id, submission_source, workflow_status, applicant_name, qualification_title, qualification_type, contact_number, form_data, submitted_at, teacher_forwarded_at, created_at, updated_at",
    )
    .eq("id", submissionId.trim())
    .eq("applicant_id", currentUser.id);

  if (isRoomApplication) {
    submissionQuery.eq("room_id", roomId!.trim());
  } else {
    submissionQuery.is("room_id", null);
  }

  const { data } = await submissionQuery.maybeSingle();

  const existingSubmission = data
    ? ({
        ...data,
        form_data: normalizeApplicationFormData(data.form_data),
      } satisfies ApplicationSubmissionRecord)
    : null;

  return (
    <ApplicantApplicationFormClient
      applicantEmail={currentUser.email}
      existingSubmission={existingSubmission}
      mode={isRoomApplication ? "room" : "individual"}
      room={room}
    />
  );
}

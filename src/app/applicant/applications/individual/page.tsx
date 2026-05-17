import { notFound } from "next/navigation";
import ApplicantApplicationFormClient from "@/app/applicant/applications/ApplicationFormClient";
import { normalizeApplicationFormData, type ApplicationSubmissionRecord } from "@/lib/application-form";
import {
  getSubmissionAssignmentInfoByIds,
  getApplicantSubmissionEditLock,
} from "@/lib/application-submission-lifecycle";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type IndividualApplicationPageProps = {
  searchParams: Promise<{ edit?: string | string[]; roomId?: string | string[]; submissionId?: string | string[] }>;
};

export default async function IndividualApplicationPage({ searchParams }: IndividualApplicationPageProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "applicant") {
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
  const supabase = createSupabaseAdminClient();

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

  const shouldLoadSpecificSubmission = shouldLoadExistingSubmission && Boolean(submissionId?.trim());

  if (!shouldLoadSpecificSubmission && !isRoomApplication) {
    return (
      <ApplicantApplicationFormClient
        applicantEmail={currentUser.email}
        existingSubmission={null}
        isReadOnly={false}
        mode={isRoomApplication ? "room" : "individual"}
        readOnlyMessage={null}
        room={room}
      />
    );
  }

  const submissionQuery = supabase
    .from("applicant_application_submissions")
    .select(
      "id, applicant_id, applicant_email, room_id, submission_source, workflow_status, applicant_name, qualification_title, qualification_type, contact_number, form_data, submitted_at, teacher_forwarded_at, created_at, updated_at",
    )
    .eq("applicant_id", currentUser.id);

  if (shouldLoadSpecificSubmission && submissionId?.trim()) {
    submissionQuery.eq("id", submissionId.trim());
  }

  if (isRoomApplication) {
    submissionQuery.eq("room_id", roomId!.trim());
    if (!shouldLoadSpecificSubmission) {
      submissionQuery.order("submitted_at", { ascending: false }).limit(1);
    }
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

  const assignmentMap = existingSubmission
    ? await getSubmissionAssignmentInfoByIds([existingSubmission.id])
    : new Map();
  const editLock = existingSubmission
    ? getApplicantSubmissionEditLock({
        assignment: assignmentMap.get(existingSubmission.id) ?? null,
        submissionSource: existingSubmission.submission_source,
        workflowStatus: existingSubmission.workflow_status,
      })
    : { isLocked: false, message: null };

  return (
    <ApplicantApplicationFormClient
      applicantEmail={currentUser.email}
      existingSubmission={existingSubmission}
      isReadOnly={editLock.isLocked}
      mode={isRoomApplication ? "room" : "individual"}
      readOnlyMessage={editLock.message}
      room={room}
    />
  );
}

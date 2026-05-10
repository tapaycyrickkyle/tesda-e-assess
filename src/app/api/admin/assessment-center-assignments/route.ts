import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type ApplicantAssignmentPayload = {
  applicantName?: string;
  applicantReference?: string;
  assignmentBatch?: string | null;
  qualification?: string;
};

type CreateAssessmentCenterAssignmentsPayload = {
  applicants?: ApplicantAssignmentPayload[];
  assessmentCenterId?: string;
};

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateAssessmentCenterAssignmentsPayload;
  const assessmentCenterId = body.assessmentCenterId?.trim() ?? "";
  const applicants = body.applicants ?? [];

  if (!assessmentCenterId || applicants.length === 0) {
    return NextResponse.json(
      { success: false, message: "Assessment center and applicant assignment details are required." },
      { status: 400 },
    );
  }

  const normalizedApplicants = applicants
    .map((applicant) => ({
      applicant_name: applicant.applicantName?.trim() ?? "",
      applicant_reference: applicant.applicantReference?.trim() ?? "",
      assignment_batch: applicant.assignmentBatch?.trim() ?? null,
      qualification: applicant.qualification?.trim() ?? "",
    }))
    .filter(
      (applicant) =>
        applicant.applicant_name.length > 0 &&
        applicant.applicant_reference.length > 0 &&
        applicant.qualification.length > 0,
    );

  if (normalizedApplicants.length === 0) {
    return NextResponse.json(
      { success: false, message: "At least one valid applicant assignment is required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { data: center, error: centerError } = await supabase
    .from("assessment_centers")
    .select("id")
    .eq("id", assessmentCenterId)
    .maybeSingle();

  if (centerError || !center) {
    return NextResponse.json({ success: false, message: "Selected assessment center was not found." }, { status: 404 });
  }

  const { error } = await supabase.from("assessment_center_applicants").upsert(
    normalizedApplicants.map((applicant) => ({
      ...applicant,
      assessment_center_id: assessmentCenterId,
      assigned_by: currentUser.id,
      assigned_by_email: currentUser.email,
    })),
    {
      onConflict: "assessment_center_id,applicant_reference",
    },
  );

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to assign applicants. Make sure the `assessment_center_applicants` table exists and its policies allow admin inserts.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "Applicants assigned successfully." });
}

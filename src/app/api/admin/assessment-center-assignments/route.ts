import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type ApplicantAssignmentPayload = {
  applicantName?: string;
  applicantReference?: string;
  assignmentBatch?: string | null;
  assignmentTitle?: string | null;
  qualification?: string;
};

type CreateAssessmentCenterAssignmentsPayload = {
  applicants?: ApplicantAssignmentPayload[];
  assessmentCenterId?: string;
};

type DeleteAssessmentCenterAssignmentsPayload = {
  assignmentIds?: string[];
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
      assignment_title: applicant.assignmentTitle?.trim() ?? null,
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

export async function DELETE(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as DeleteAssessmentCenterAssignmentsPayload;
  const assignmentIds = (body.assignmentIds ?? []).map((assignmentId) => assignmentId.trim()).filter(Boolean);

  if (assignmentIds.length === 0) {
    return NextResponse.json(
      { success: false, message: "At least one assignment must be selected for removal." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { error } = await supabase.from("assessment_center_applicants").delete().in("id", assignmentIds);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to remove the assignment. Make sure the assessment center assignment table exists and admins can delete records.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "Assignment removed successfully." });
}

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  const [{ data: applicants, error: applicantsError }, { data: centers, error: centersError }] = await Promise.all([
    supabase
      .from("assessment_center_applicants")
      .select("id, assessment_center_id, applicant_reference, applicant_name, qualification, assignment_batch, assignment_title, assigned_at")
      .order("assigned_at", { ascending: false }),
    supabase.from("assessment_centers").select("id, name"),
  ]);

  if (applicantsError || centersError) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load assigned applicants. Make sure the assessment center assignment tables exist and admins can read them.",
      },
      { status: 500 },
    );
  }

  const centerNamesById = new Map((centers ?? []).map((center) => [center.id, center.name]));
  const normalizedApplicants = (applicants ?? []).map((applicant) => ({
    ...applicant,
    center_name: centerNamesById.get(applicant.assessment_center_id) ?? "Unknown Center",
  }));

  return NextResponse.json({ success: true, applicants: normalizedApplicants });
}

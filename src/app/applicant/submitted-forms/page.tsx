import Link from "next/link";
import { notFound } from "next/navigation";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

type SubmissionListItem = {
  assigned_at?: string | null;
  applicant_name: string;
  assessment_center_name?: string | null;
  id: string;
  qualification_title: string;
  room_id: string | null;
  room_name?: string | null;
  submission_source: "individual" | "room";
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: "submitted_to_teacher" | "submitted_to_admin";
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function buildEditHref(submission: SubmissionListItem) {
  if (submission.submission_source === "room" && submission.room_id) {
    return `/applicant/applications/individual?roomId=${submission.room_id}&edit=1&submissionId=${submission.id}`;
  }

  return `/applicant/applications/individual?edit=1&submissionId=${submission.id}`;
}

function getAssessmentCenterBadge(submission: SubmissionListItem) {
  if (submission.assessment_center_name) {
    return {
      className: "bg-[#e8f2ff] text-[#0038a8]",
      label: submission.assessment_center_name,
    };
  }

  return {
    className: "bg-[#eef4ff] text-[#3056c4]",
    label: "Not assigned yet",
  };
}

export default async function ApplicantSubmittedFormsPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "student") {
    notFound();
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { data: submissions } = await supabase
    .from("applicant_application_submissions")
    .select("id, applicant_name, qualification_title, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status")
    .eq("applicant_id", currentUser.id)
    .order("submitted_at", { ascending: false });

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const roomIds = [...new Set((submissions ?? []).map((submission) => submission.room_id).filter(Boolean))];
  const [{ data: rooms }, { data: assignments }, { data: centers }] = await Promise.all([
    roomIds.length > 0
      ? await supabase.from("rooms").select("id, name").in("id", roomIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    submissionIds.length > 0
      ? supabase
          .from("assessment_center_applicants")
          .select("assessment_center_id, applicant_reference, assigned_at")
          .in("applicant_reference", submissionIds)
      : Promise.resolve({ data: [] as Array<{ assessment_center_id: string; applicant_reference: string; assigned_at: string }> }),
    supabase.from("assessment_centers").select("id, name"),
  ]);

  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room.name]));
  const centerMap = new Map((centers ?? []).map((center) => [center.id, center.name]));
  const assignmentMap = new Map(
    (assignments ?? []).map((assignment) => [
      assignment.applicant_reference,
      {
        assessment_center_name: centerMap.get(assignment.assessment_center_id) ?? "Unknown Assessment Center",
        assigned_at: assignment.assigned_at,
      },
    ]),
  );
  const normalizedSubmissions: SubmissionListItem[] = (submissions ?? []).map((submission) => ({
    ...submission,
    assigned_at: assignmentMap.get(submission.id)?.assigned_at ?? null,
    assessment_center_name: assignmentMap.get(submission.id)?.assessment_center_name ?? null,
    room_name: submission.room_id ? roomMap.get(submission.room_id) ?? null : null,
  }));

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <section className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Submitted Forms</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                View every application form you have already submitted, reopen it for edits, and download the PDF
                softcopy any time.
              </p>
            </div>

            <div className="flex min-h-[112px] w-full max-w-[196px] flex-col justify-center rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Forms</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none text-[#0b1c30]">{normalizedSubmissions.length}</p>
              <p className="mt-1 text-[11px] text-[#4563a5]">Saved application PDFs</p>
            </div>
          </div>
        </section>

        {normalizedSubmissions.length === 0 ? (
          <section className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-file-circle-plus text-[18px]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No submitted forms yet</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
              Once you submit an individual or room-based application, the official PDF softcopy will appear here.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4">
            {normalizedSubmissions.map((submission) => (
              <article key={submission.id} className="rounded-[18px] border border-[#d9e3f7] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[19px] font-bold leading-[1.2] text-[#0b1c30]">{submission.qualification_title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getAssessmentCenterBadge(submission).className}`}>
                        {getAssessmentCenterBadge(submission).label}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] text-[#444653]">
                      {submission.submission_source === "individual"
                        ? "Individual application"
                        : `Room application${submission.room_name ? ` • ${submission.room_name}` : ""}`}
                    </p>
                    <p className="mt-1 text-[13px] text-[#747685]">Submitted {formatDateTime(submission.submitted_at)}</p>
                    {submission.teacher_forwarded_at ? (
                      <p className="mt-1 text-[13px] text-[#747685]">
                        Forwarded to admin {formatDateTime(submission.teacher_forwarded_at)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      className="inline-flex min-h-[40px] min-w-[118px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      href={buildEditHref(submission)}
                    >
                      Edit Form
                    </Link>
                    <a
                      className="inline-flex min-h-[40px] min-w-[118px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      href={buildApplicationSubmissionPdfUrl(submission.id)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View PDF
                    </a>
                    <a
                      className="inline-flex min-h-[40px] min-w-[118px] items-center justify-center rounded-lg bg-[#002576] px-4 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                      href={buildApplicationSubmissionPdfUrl(submission.id, { download: true })}
                    >
                      Download
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

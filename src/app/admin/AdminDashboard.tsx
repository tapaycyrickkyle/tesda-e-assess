import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { createSupabaseAdminClient } from "@/lib/supabase";

type TeacherApprovalStatus = "approved" | "pending_review" | "rejected";

type TeacherApprovalRecord = {
  approval_status: TeacherApprovalStatus;
  created_at: string;
  full_name: string;
  id: string;
  institution_name: string;
};

type SubmissionSummary = {
  applicant_name: string;
  id: string;
  qualification_title: string;
  submission_source: "individual" | "room";
  submitted_at: string;
  workflow_status: ApplicationSubmissionStatus;
};

const terminalStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];
const centerQueueStatuses: ApplicationSubmissionStatus[] = ["assigned", "under_review"];
const statCardClass = "rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();
  let dashboardNotice = "";

  const [
    { data: teacherRequests, error: teacherRequestsError },
    { data: submissions, error: submissionsError },
    { data: centers, error: centersError },
  ] = await Promise.all([
    supabase
      .from("teacher_registration_requests")
      .select("id, full_name, institution_name, created_at, approval_status")
      .order("created_at", { ascending: false }),
    supabase
      .from("applicant_application_submissions")
      .select("id, applicant_name, qualification_title, submission_source, submitted_at, workflow_status")
      .order("submitted_at", { ascending: false }),
    supabase.from("assessment_centers").select("id, name"),
  ]);

  if (teacherRequestsError || submissionsError || centersError) {
    dashboardNotice = "Some dashboard details could not be loaded right now. You can still open the queue pages below.";
  }

  const allTeacherRequests = (teacherRequests ?? []) as TeacherApprovalRecord[];
  const allSubmissions = (submissions ?? []) as SubmissionSummary[];
  const pendingTeacherApprovals = allTeacherRequests.filter((record) => record.approval_status === "pending_review");
  const tesdaQueue = allSubmissions.filter((submission) => submission.workflow_status === "submitted_to_admin");
  const centerQueue = allSubmissions.filter((submission) => centerQueueStatuses.includes(submission.workflow_status));
  const finalizedSubmissions = allSubmissions.filter((submission) => terminalStatuses.includes(submission.workflow_status));

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Monitor approvals, submitted applications, and assessment-center activity from one place.
          </p>
        </section>

        {dashboardNotice ? <NotificationBanner className="mb-5" message={dashboardNotice} variant="warning" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Pending Teacher Approvals</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{pendingTeacherApprovals.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Teacher accounts waiting for credential review and approval.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Submitted to TESDA</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{tesdaQueue.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Applicant submissions currently waiting for assessment-center assignment.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Under Review at Centers</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{centerQueue.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Submissions currently with assessment centers for review and outcome processing.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessment Centers</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{(centers ?? []).length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Centers currently available as assignment destinations.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Teacher Approval Queue</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Pending Requests</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/admin/teacher-approvals"
              >
                View All
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {pendingTeacherApprovals.slice(0, 5).map((record) => (
                <div key={record.id} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{record.full_name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {record.institution_name} | Submitted {formatDate(record.created_at)}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      href="/admin/teacher-approvals"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}

              {pendingTeacherApprovals.length === 0 ? (
                <div className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No teacher approval requests are waiting right now.
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Application Routing</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Submitted Queue</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/admin/applicants"
              >
                Open Queue
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {tesdaQueue.slice(0, 5).map((submission) => (
                <div key={submission.id} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{submission.applicant_name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {submission.qualification_title} | {submission.submission_source === "room" ? "Room submission" : "Individual submission"}
                      </p>
                    </div>
                    <p className="text-[12px] font-semibold text-[#4563a5]">{formatDate(submission.submitted_at)}</p>
                  </div>
                </div>
              ))}

              {tesdaQueue.length === 0 ? (
                <div className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No applicant submissions are waiting for TESDA assignment right now.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                className="rounded-[10px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-4 transition hover:border-[#bfd0f2] hover:bg-white"
                href="/admin/assigned-applicants"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned Queue</p>
                <p className="mt-2 text-[20px] font-bold text-[#0b1c30]">{centerQueue.length}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">Applicants currently with assessment centers.</p>
              </Link>
              <Link
                className="rounded-[10px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-4 transition hover:border-[#bfd0f2] hover:bg-white"
                href="/admin/assessment-center"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Finalized Records</p>
                <p className="mt-2 text-[20px] font-bold text-[#0b1c30]">{finalizedSubmissions.length}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">Completed or closed submissions already processed downstream.</p>
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

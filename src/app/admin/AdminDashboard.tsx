import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  getWorkflowEventDescription,
  getWorkflowEventLabel,
  loadRecentWorkflowEvents,
} from "@/lib/workflow-history";

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
const statCardClass = "rounded-xl border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function getActivityBadgeClass(eventType: string) {
  if (eventType.includes("completed")) {
    return "border-[#cce9d8] bg-[#edf9f1] text-[#166534]";
  }

  if (eventType.includes("rejected") || eventType.includes("cancelled") || eventType.includes("withdrew")) {
    return "border-[#f2d1d1] bg-[#fff4f4] text-[#b42318]";
  }

  if (eventType.includes("assigned")) {
    return "border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]";
  }

  return "border-[#f1d8bf] bg-[#fff8e8] text-[#8a5200]";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatActivityActor(actorRole: string | null) {
  switch (actorRole) {
    case "admin":
      return "TESDA";
    case "applicant":
      return "Applicant";
    case "assessment_center":
      return "Assessment Center";
    case "teacher":
      return "Teacher";
    default:
      return "System";
  }
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
  const recentWorkflowActivity = await loadRecentWorkflowEvents(5);

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Overview</h1>
          <p className="ui-page-description">
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
            <p className="mt-2 text-[13px] text-[#747685]">Submissions currently with assessment centers for review and status processing.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessment Centers</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{(centers ?? []).length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Centers currently available as assignment destinations.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Teacher Approval Queue</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Pending Requests</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/admin/teachers"
              >
                View All
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {pendingTeacherApprovals.slice(0, 5).map((record) => (
                <div key={record.id} className="border-t border-[#e7edf4] px-1 py-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{record.full_name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {record.institution_name} | Submitted {formatDate(record.created_at)}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      href="/admin/teachers"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}

              {pendingTeacherApprovals.length === 0 ? (
                <div className="px-1 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No teacher approval requests are waiting right now.
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Application Routing</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Submitted Queue</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/admin/queue"
              >
                Open Queue
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {tesdaQueue.slice(0, 5).map((submission) => (
                <div key={submission.id} className="border-t border-[#e7edf4] px-1 py-3 first:border-t-0 first:pt-0">
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
                <div className="px-1 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No applicant submissions are waiting for TESDA assignment right now.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                className="border-t border-[#e7edf4] px-1 py-4 transition hover:border-[#bfd0f2]"
                href="/admin/assignments"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned Queue</p>
                <p className="mt-2 text-[20px] font-bold text-[#0b1c30]">{centerQueue.length}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">Applicants currently with assessment centers.</p>
              </Link>
              <Link
                className="border-t border-[#e7edf4] px-1 py-4 transition hover:border-[#bfd0f2]"
                href="/admin/centers"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Finalized Records</p>
                <p className="mt-2 text-[20px] font-bold text-[#0b1c30]">{finalizedSubmissions.length}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">Completed or closed submissions already processed downstream.</p>
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-5">
          <article className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Audit Trail</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Recent Workflow Activity</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/admin/inbox"
              >
                Inbox
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentWorkflowActivity.map((entry) => (
                <div key={entry.id} className="border-t border-[#e7edf4] px-1 py-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex min-h-[30px] items-center justify-center rounded-full border px-3 text-[11px] font-bold ${getActivityBadgeClass(entry.event_type)}`}>
                          {getWorkflowEventLabel(entry)}
                        </span>
                        <span className="inline-flex min-h-[30px] items-center justify-center rounded-full border border-[#d9e3f7] bg-white px-3 text-[11px] font-bold text-[#747685]">
                          {entry.qualification_title}
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-bold text-[#0b1c30]">{entry.applicant_name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{getWorkflowEventDescription(entry)}</p>
                      <p className="mt-1 text-[12px] text-[#747685]">By {formatActivityActor(entry.actor_role)}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-[#747685]">{formatDateTime(entry.created_at)}</p>
                  </div>
                </div>
              ))}

              {recentWorkflowActivity.length === 0 ? (
                <div className="px-1 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    Workflow history will appear here after submissions start moving through the new audit trail.
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

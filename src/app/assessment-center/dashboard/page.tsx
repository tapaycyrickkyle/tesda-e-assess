import Link from "next/link";
import { notFound } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
} from "@/lib/assessment-centers";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser, type CurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type CenterAssignment = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
  id: string;
  qualification: string;
  workflow_status: ApplicationSubmissionStatus;
};

type DashboardDateFilter = "all" | "this_month" | "this_week" | "today";

type AssessmentCenterDashboardPageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

async function resolveCurrentCenter(currentUser: CurrentAppUser) {
  return resolveAssessmentCenterForUser<{
    center_auth_user_id: string | null;
    center_email: string | null;
    id: string;
    name: string;
  }>(currentUser, "id, name, center_email, center_auth_user_id");
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

function matchesAssignedDateFilter(value: string, dateFilter: DashboardDateFilter) {
  if (dateFilter === "all") {
    return true;
  }

  const assignedAt = new Date(value);

  if (Number.isNaN(assignedAt.getTime())) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateFilter === "today") {
    return assignedAt >= startOfToday;
  }

  if (dateFilter === "this_week") {
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    return assignedAt >= startOfWeek;
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return assignedAt >= startOfMonth;
}

function normalizeDateFilter(value: string | string[] | undefined): DashboardDateFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue === "today" ||
    normalizedValue === "this_week" ||
    normalizedValue === "this_month"
  ) {
    return normalizedValue;
  }

  return "all";
}

function buildDashboardDateFilterHref(dateFilter: DashboardDateFilter) {
  if (dateFilter === "all") {
    return "/assessment-center/dashboard";
  }

  return `/assessment-center/dashboard?date=${dateFilter}`;
}

function getStatusBadgeClass(status: ApplicationSubmissionStatus) {
  if (status === "completed") {
    return "bg-[#edf9f1] text-[#166534]";
  }

  if (status === "rejected" || status === "cancelled" || status === "withdrawn") {
    return "bg-[#fff4f4] text-[#b42318]";
  }

  if (status === "assigned" || status === "under_review") {
    return "bg-[#eef4ff] text-[#3056c4]";
  }

  return "bg-[#fff8e8] text-[#8a5200]";
}

export default async function AssessmentCenterDashboardPage({ searchParams }: AssessmentCenterDashboardPageProps) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "assessment_center") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const dateFilter = normalizeDateFilter(resolvedSearchParams.date);
  let dashboardNotice = "";
  let assignments: CenterAssignment[] = [];

  try {
    const centerResult = await resolveCurrentCenter(currentUser);

    if (!centerResult.center) {
      dashboardNotice = getAssessmentCenterLinkMessage(centerResult.status) ?? "";
    } else {
      dashboardNotice = getAssessmentCenterLinkMessage(centerResult.status) ?? "";
      const adminSupabase = createSupabaseAdminClient();
      const { data: assignmentRows, error: assignmentsError } = await adminSupabase
        .from("assessment_center_applicants")
        .select("id, applicant_name, applicant_reference, qualification, assignment_batch, assigned_at")
        .eq("assessment_center_id", centerResult.center.id)
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        dashboardNotice = "Some dashboard details could not be loaded right now. You can still open the applicants page below.";
      } else {
        const submissionIds = (assignmentRows ?? []).map((assignment) => assignment.applicant_reference);
        const { data: submissionRows, error: submissionsError } = submissionIds.length
          ? await adminSupabase
              .from("applicant_application_submissions")
              .select("id, workflow_status")
              .in("id", submissionIds)
          : { data: [], error: null };

        if (submissionsError) {
          dashboardNotice =
            "Some dashboard details could not be loaded right now. You can still open the applicants page below.";
        }

        const submissionStatusById = new Map(
          (submissionRows ?? []).map((submission) => [submission.id, submission.workflow_status as ApplicationSubmissionStatus]),
        );

        assignments = (assignmentRows ?? []).map((assignment) => ({
          ...assignment,
          workflow_status: (submissionStatusById.get(assignment.applicant_reference) ?? "under_review") as ApplicationSubmissionStatus,
        }));
      }
    }
  } catch {
    dashboardNotice = "Some dashboard details could not be loaded right now. You can still open the applicants page below.";
  }

  const filteredAssignments = assignments.filter((assignment) => matchesAssignedDateFilter(assignment.assigned_at, dateFilter));
  const underReviewCount = filteredAssignments.filter(
    (assignment) => assignment.workflow_status === "assigned" || assignment.workflow_status === "under_review",
  ).length;
  const processedCount = filteredAssignments.filter(
    (assignment) =>
      assignment.workflow_status === "completed" ||
      assignment.workflow_status === "rejected" ||
      assignment.workflow_status === "cancelled" ||
      assignment.workflow_status === "withdrawn",
  ).length;
  const bulkBatchCount = new Set(filteredAssignments.map((assignment) => assignment.assignment_batch).filter(Boolean)).size;

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Assessment Center Dashboard</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Monitor the queue assigned to your center and jump into applicant review quickly.
          </p>
        </section>

        <section className="mb-5 rounded-[12px] border border-[#d9e3f7] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f7ff_100%)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-[#d9e3f7] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#3056c4] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                {dateFilter === "all"
                  ? "All Dates"
                  : dateFilter === "today"
                    ? "Today"
                    : dateFilter === "this_week"
                      ? "This Week"
                      : "This Month"}
              </span>
              <span className="inline-flex rounded-full border border-[#d9e3f7] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                {filteredAssignments.length} Visible Records
              </span>
              <span className="inline-flex rounded-full border border-[#cce9d8] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#166534] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                {underReviewCount} Under Review
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
                href="/assessment-center/applicants"
              >
                Open Applicants
              </Link>
            </div>
          </div>
        </section>

        {dashboardNotice ? <NotificationBanner className="mb-5" message={dashboardNotice} variant="warning" /> : null}

        <section className="mb-5 rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Date Filter</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-[#4c5d79]">
                Keep the dashboard cards and recent queue focused on the same assignment period.
              </p>
            </div>

            <div className="inline-flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              {([
                { key: "all", label: "All Dates" },
                { key: "today", label: "Today" },
                { key: "this_week", label: "This Week" },
                { key: "this_month", label: "This Month" },
              ] as Array<{ key: DashboardDateFilter; label: string }>).map((option) => (
                <Link
                  key={option.key}
                  className={`inline-flex min-h-[36px] items-center justify-center rounded-full border px-4 text-[12px] font-bold transition ${
                    dateFilter === option.key
                      ? "border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]"
                      : "border-[#d9e3f7] bg-white text-[#5d5f5f] hover:bg-[#f8fbff]"
                  }`}
                  href={buildDashboardDateFilterHref(option.key)}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Total Queue</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{filteredAssignments.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">All submissions currently visible for the selected date range.</p>
          </div>
          <div className="rounded-[12px] border border-[#d9e3f7] bg-[#eef4ff] px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#3056c4]">Under Review</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{underReviewCount}</p>
            <p className="mt-2 text-[13px] text-[#4563a5]">Submissions currently with your center for review and outcome processing.</p>
          </div>
          <div className="rounded-[12px] border border-[#cce9d8] bg-[#edf9f1] px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#166534]">Closed</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{processedCount}</p>
            <p className="mt-2 text-[13px] text-[#3d6b4d]">Submissions already marked completed, rejected, or cancelled.</p>
          </div>
          <div className="rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Bulk Batches</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{bulkBatchCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Distinct bulk assignment batches currently visible in your queue.</p>
          </div>
        </section>

        <section className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Recent Queue</p>
              <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Center Queue</h2>
            </div>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
              href="/assessment-center/applicants"
            >
              Manage Queue
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {filteredAssignments.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0b1c30]">{assignment.applicant_name}</p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                      {assignment.qualification} | Assigned {formatDateTime(assignment.assigned_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-[12px] font-bold ${getStatusBadgeClass(
                      assignment.workflow_status,
                    )}`}
                  >
                    {getApplicationSubmissionStatusLabel(assignment.workflow_status)}
                  </span>
                </div>
              </div>
            ))}

            {filteredAssignments.length === 0 ? (
              <div className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                <p className="text-[14px] leading-[1.6] text-[#444653]">
                  No applicants match the selected dashboard date filter right now.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

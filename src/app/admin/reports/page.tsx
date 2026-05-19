import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { getApplicationSubmissionStatusLabel } from "@/lib/application-form";
import { loadApplicationSubmissionReportRows, type SubmissionReportRow } from "@/lib/workflow-history";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusBadgeClass(status: SubmissionReportRow["workflow_status"]) {
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

export default async function AdminReportsPage() {
  let reportError = "";
  let rows: SubmissionReportRow[] = [];

  try {
    rows = await loadApplicationSubmissionReportRows();
  } catch (error) {
    reportError =
      error instanceof Error ? error.message : "Unable to load the application submission report right now.";
  }

  const totalCount = rows.length;
  const roomCount = rows.filter((row) => row.submission_source === "room").length;
  const individualCount = rows.filter((row) => row.submission_source === "individual").length;
  const closedCount = rows.filter((row) =>
    ["completed", "rejected", "cancelled", "withdrawn"].includes(row.workflow_status),
  ).length;

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="ui-page-title text-[#002576]">Reports</h1>
              <p className="ui-page-description">
                Review submission activity across the full workflow and export the current report as CSV.
              </p>
            </div>
            <a
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/api/admin/reports/application-submissions?format=csv"
            >
              Download CSV
            </a>
          </div>
        </section>

        {reportError ? <NotificationBanner className="mb-5" message={reportError} variant="error" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Total Submissions</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{totalCount}</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Individual</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{individualCount}</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Room-Based</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{roomCount}</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Closed Outcomes</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{closedCount}</p>
          </article>
        </section>

        {rows.length > 0 ? (
          <section className="ui-data-table-shell">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th className="text-left">Applicant</th>
                  <th className="text-left">Qualification</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Room / Center</th>
                  <th className="text-left">Submitted</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="ui-data-table-stack min-w-0">
                        <p className="ui-data-table-title truncate">{row.applicant_name}</p>
                        <p className="ui-data-table-meta truncate">{row.applicant_email}</p>
                      </div>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{row.qualification_title}</p>
                    </td>
                    <td>
                      <div className="ui-data-table-stack">
                        <span className="ui-data-table-copy font-semibold text-[#0b1c30]">
                          {row.submission_source === "room" ? "Room" : "Individual"}
                        </span>
                        {row.room_name ? <span className="ui-data-table-meta">{row.room_name}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="ui-data-table-stack">
                        <span className="ui-data-table-copy font-semibold text-[#0b1c30]">
                          {row.assessment_center_name ?? "Not assigned"}
                        </span>
                        {row.assigned_at ? <span className="ui-data-table-meta">Assigned {formatDateTime(row.assigned_at)}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="ui-data-table-stack">
                        <span className="ui-data-table-copy font-semibold text-[#0b1c30]">{formatDateTime(row.submitted_at)}</span>
                        {row.teacher_forwarded_at ? (
                          <span className="ui-data-table-meta">Teacher forwarded {formatDateTime(row.teacher_forwarded_at)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="ui-data-table-stack">
                        <span className={`ui-data-table-badge ${getStatusBadgeClass(row.workflow_status)}`}>
                          {getApplicationSubmissionStatusLabel(row.workflow_status)}
                        </span>
                        {row.latest_status_reason ? (
                          <p className="ui-data-table-meta max-w-[220px]">{row.latest_status_reason}</p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : !reportError ? (
          <section className="ui-empty-state">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-file-circle-exclamation text-[18px]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No submissions to report yet</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
              Submission reporting will appear here once applicants start moving through the workflow.
            </p>
            <Link
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/admin/queue"
            >
              Open Applicant Queue
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

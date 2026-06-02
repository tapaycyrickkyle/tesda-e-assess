import { notFound } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { formatAssessmentDate } from "@/lib/assessment-date";
import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
} from "@/lib/assessment-centers";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadMonthlySummaryRows } from "@/lib/monthly-summary-reports";

export default async function AssessmentCenterReportsPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "assessment_center") {
    notFound();
  }

  const centerResult = await resolveAssessmentCenterForUser<{
    center_auth_user_id: string | null;
    center_email: string | null;
    id: string;
    name: string;
  }>(currentUser, "id, name, center_email, center_auth_user_id");

  if (!centerResult.center) {
    return (
      <main className="ui-portal-main pb-8 pt-8">
        <div className="ui-page-content">
          <section className="ui-page-header">
            <h1 className="ui-page-title text-[#002576]">Reports</h1>
            <p className="ui-page-description">
              Monthly assessment summaries for your assessment center.
            </p>
          </section>
          <NotificationBanner
            className="mb-5"
            message={getAssessmentCenterLinkMessage(centerResult.status) ?? "No linked assessment center was found."}
            variant="warning"
          />
        </div>
      </main>
    );
  }

  let reportError = "";
  let monthLabel = "";
  let rows: Awaited<ReturnType<typeof loadMonthlySummaryRows>>["rows"] = [];

  try {
    const report = await loadMonthlySummaryRows({
      assessmentCenterId: centerResult.center.id,
    });
    monthLabel = report.monthLabel;
    rows = report.rows;
  } catch (error) {
    reportError = error instanceof Error ? error.message : "Unable to load the monthly summary report right now.";
  }

  const totalCount = rows.length;
  const qualificationCount = new Set(rows.map((row) => row.qualification_title)).size;
  const assessorCount = new Set(rows.map((row) => row.assessor)).size;

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="ui-page-title text-[#002576]">Reports</h1>
              <p className="ui-page-description">
                Review your center&apos;s monthly finalized assessment results and export the summary report.
              </p>
            </div>
            <a
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/api/assessment-center/reports/monthly-summary?format=excel"
            >
              Download Monthly Excel
            </a>
          </div>
        </section>

        {reportError ? <NotificationBanner className="mb-5" message={reportError} variant="error" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessment Center</p>
            <p className="mt-2 text-[20px] font-bold leading-tight text-[#0b1c30]">{centerResult.center.name}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Current report scope</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Report Month</p>
            <p className="mt-2 text-[20px] font-bold leading-tight text-[#0b1c30]">{monthLabel || "Current Month"}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Finalized results only</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Finalized Results</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{totalCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Applicants with encoded outcomes this month</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessor Coverage</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{assessorCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">{qualificationCount} qualifications represented</p>
          </article>
        </section>

        {rows.length > 0 ? (
          <section className="ui-data-table-shell">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th className="text-left">Assessment Date</th>
                  <th className="text-left">Applicant</th>
                  <th className="text-left">Qualification</th>
                  <th className="text-left">Assessor</th>
                  <th className="text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.applicant_name}-${row.assessment_date}-${index}`}>
                    <td>
                      <p className="ui-data-table-copy">{formatAssessmentDate(row.assessment_date)}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy font-semibold text-[#0b1c30]">{row.applicant_name}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{row.qualification_title}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{row.assessor}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{row.workflow_status === "not_passed" ? "Failed" : "Passed"}</p>
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
            <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No finalized assessment results yet for this month</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
              Finalized assessment summaries will appear here once your center encodes applicant outcomes this month.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

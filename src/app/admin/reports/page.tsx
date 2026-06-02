import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { loadMonthlySummaryRows } from "@/lib/monthly-summary-reports";
import { createSupabaseAdminClient } from "@/lib/supabase";

type AssessmentCenterDirectoryRow = {
  id: string;
  name: string;
};

export default async function AdminReportsPage() {
  let reportError = "";
  let monthLabel = "";
  let rows: Awaited<ReturnType<typeof loadMonthlySummaryRows>>["rows"] = [];
  let centers: AssessmentCenterDirectoryRow[] = [];
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const supabase = createSupabaseAdminClient();
    const [report, centersResult] = await Promise.all([
      loadMonthlySummaryRows({ month: currentMonth }),
      supabase.from("assessment_centers").select("id, name").order("name", { ascending: true }),
    ]);

    monthLabel = report.monthLabel;
    rows = report.rows;

    if (centersResult.error) {
      throw new Error("Unable to load the assessment center reports right now.");
    }

    centers = centersResult.data ?? [];
  } catch (error) {
    reportError =
      error instanceof Error ? error.message : "Unable to load the assessment center reports right now.";
  }

  const totalApplicantsCount = rows.length;
  const assessmentCenterCount = centers.length;
  const passedCount = rows.filter((row) => row.workflow_status === "passed" || row.workflow_status === "completed").length;
  const failedCount = rows.filter((row) => row.workflow_status === "not_passed").length;

  const centerSummaries = centers.map((center) => {
    const centerRows = rows.filter((row) => row.assessment_center_id === center.id);

    return {
      assessorCount: new Set(centerRows.map((row) => row.assessor)).size,
      id: center.id,
      name: center.name,
      qualificationCount: new Set(centerRows.map((row) => row.qualification_title)).size,
      totalApplicants: centerRows.length,
    };
  });

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="ui-page-title text-[#002576]">Reports</h1>
              <p className="ui-page-description">
                Review the monthly report summary for all assessment centers and download either the full compilation or a specific center report.
              </p>
            </div>
            <a
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href={`/api/admin/reports/application-submissions?format=excel&month=${currentMonth}`}
            >
              Download Monthly Excel
            </a>
          </div>
        </section>

        {reportError ? <NotificationBanner className="mb-5" message={reportError} variant="error" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Report Month</p>
            <p className="mt-2 text-[20px] font-bold leading-tight text-[#0b1c30]">{monthLabel || "Current Month"}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Overall monthly summary scope</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Total Applicants</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{totalApplicantsCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">All finalized applicants across every assessment center combined</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessment Centers</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{assessmentCenterCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Centers included in the overall monthly report</p>
          </article>
          <article className="ui-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Passed / Failed</p>
            <p className="mt-2 text-[20px] font-bold leading-tight text-[#0b1c30]">
              {passedCount} / {failedCount}
            </p>
            <p className="mt-2 text-[13px] text-[#747685]">Recorded monthly outcomes across all centers</p>
          </article>
        </section>

        {centerSummaries.length > 0 ? (
          <section className="ui-data-table-shell">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th className="text-left">Assessment Center</th>
                  <th className="text-left">Finalized Applicants</th>
                  <th className="text-left">Qualifications</th>
                  <th className="text-left">Assessors</th>
                  <th className="text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {centerSummaries.map((center) => (
                  <tr key={center.id}>
                    <td>
                      <div className="ui-data-table-stack min-w-0">
                        <p className="ui-data-table-title">{center.name}</p>
                        <p className="ui-data-table-meta">Monthly report summary</p>
                      </div>
                    </td>
                    <td>
                      <p className="ui-data-table-copy font-semibold text-[#0b1c30]">{center.totalApplicants}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{center.qualificationCount}</p>
                    </td>
                    <td>
                      <p className="ui-data-table-copy">{center.assessorCount}</p>
                    </td>
                    <td className="text-right">
                      <a
                        className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[#002576] px-4 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                        href={`/api/admin/reports/application-submissions?format=excel&month=${currentMonth}&assessmentCenterId=${center.id}`}
                      >
                        Download Monthly Report
                      </a>
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
            <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No assessment center summaries yet for this month</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
              Monthly center reports will appear here once assessment centers encode applicant outcomes for this month.
            </p>
            <Link
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/admin/assignments"
            >
              Open Assignments
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

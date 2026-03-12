import React from "react";
import AssessmentCenterDashboardHeader from "./AssessmentCenterDashboardHeader";
import AssessmentCenterDashboardSidebar from "./AssessmentCenterDashboardSidebar";

const stats = [
  {
    id: "pending",
    label: "Pending Reviews",
    value: "42",
    trend: "+5% from last week",
    trendUp: true,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    id: "verified",
    label: "Verified Documents",
    value: "128",
    trend: "-2% from last week",
    trendUp: false,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    id: "completed",
    label: "Completed Certifications",
    value: "850",
    trend: "+12% from last week",
    trendUp: true,
    accent: "bg-emerald-50 text-emerald-600",
  },
];

const applicants = [
  {
    id: "JD",
    name: "Juan Dela Cruz",
    course: "IT-0112 (Computer Systems Servicing)",
    school: "Manila Training Center",
    docs: "All Verified",
    docsOk: true,
    report: "Ready for Signature",
    reportClass: "text-slate-400 italic",
  },
  {
    id: "MS",
    name: "Maria Santos",
    course: "NC-2041 (Culinary Arts)",
    school: "Pasig Culinary Institute",
    docs: "1 Missing",
    docsOk: false,
    report: "Hold - Incomplete",
    reportClass: "text-amber-500 italic",
  },
  {
    id: "RL",
    name: "Ricardo Luna",
    course: "ME-0322 (Automotive Repair)",
    school: "Quezon City Tech School",
    docs: "All Verified",
    docsOk: true,
    report: "Approved",
    reportClass: "font-bold text-green-600",
  },
  {
    id: "AB",
    name: "Anna Bautista",
    course: "HS-0092 (Caregiving Services)",
    school: "Regional Health Center",
    docs: "All Verified",
    docsOk: true,
    report: "Pending Review",
    reportClass: "text-slate-400 italic",
  },
];

function PendingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <circle cx="12" cy="12" r="8.2" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M6 12.5 10 16l8-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
    </svg>
  );
}

function PremiumIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="m12 2 2.85 5.77 6.37.93-4.6 4.48 1.08 6.34L12 16.53 6.3 19.52l1.08-6.34L2.78 8.7l6.37-.93L12 2Z" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m4.5 15 5-5 4 4 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m4.5 9 5 5 4-4 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M8 4h6l4 4v12H8z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 4v4h4" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <rect x="3.5" y="5" width="17" height="14" rx="1.8" strokeWidth="1.8" />
      <path d="M3.5 10h17M9 5v14M15 5v14" strokeWidth="1.8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
      <path d="m8.4 12.2 2.3 2.2 4.9-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
      <path d="M12 8v4.2l2.8 1.6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m15 6-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m9 6 6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
      <path d="M12 10v6M12 7.3h.01" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8.3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4.8V8.3h3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.8V12l3 1.8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ item }) {
  const icon =
    item.id === "pending" ? <PendingIcon /> : item.id === "verified" ? <VerifiedIcon /> : <PremiumIcon />;

  return (
    <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
          <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{item.value}</h3>
        </div>
        <span className={`inline-flex rounded-lg p-2 ${item.accent}`}>{icon}</span>
      </div>
      <p className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${item.trendUp ? "text-green-600" : "text-red-600"}`}>
        {item.trendUp ? <TrendUpIcon /> : <TrendDownIcon />}
        {item.trend}
      </p>
    </article>
  );
}

function DataBadge({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {ok ? <CheckCircleIcon /> : <ScheduleIcon />}
      {label}
    </span>
  );
}

function ToolbarButton({ icon, label, primary = false }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const AssessmentCenterDashboardPage = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[300px_1fr]">
      <AssessmentCenterDashboardSidebar />

      <div className="min-w-0">
        <AssessmentCenterDashboardHeader />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </section>

          <section className="ui-card mt-6 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Final Review Queue</h4>
                <p className="text-sm text-slate-500">Processing applications for national certification (NC II).</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToolbarButton icon={<PdfIcon />} label="Export PDF" />
                <ToolbarButton icon={<TableIcon />} label="Export Excel" />
                <ToolbarButton icon={<DownloadIcon />} label="Batch Download" primary />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Applicant Name</th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Course / Qualification</th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Institution/School</th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Documents</th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Director Report</th>
                    <th className="border-b border-slate-200 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {applicants.map((item) => (
                    <tr key={item.name} className="transition hover:bg-slate-50/70">
                      <td className="border-b border-slate-200 px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {item.id}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4 text-slate-700">{item.course}</td>
                      <td className="border-b border-slate-200 px-6 py-4 text-slate-500">{item.school}</td>
                      <td className="border-b border-slate-200 px-6 py-4">
                        <DataBadge ok={item.docsOk} label={item.docs} />
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4 text-xs">
                        <span className={item.reportClass}>{item.report}</span>
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            title="View information"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-slate-100 hover:text-blue-700"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            type="button"
                            title="Download documents"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-slate-100 hover:text-blue-700"
                          >
                            <DownloadIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">Showing 1 to 4 of 42 entries</p>
              <div className="flex items-center gap-1">
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                  <ChevronLeftIcon />
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
                  1
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  2
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  3
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                <InfoIcon />
                Processing Requirements
              </h5>
              <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-600" />
                  Documents must be verified against original copies.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-600" />
                  Final assessment results must be signed by the Lead Assessor.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-600" />
                  Digital certificates will be issued within 48 hours of approval.
                </li>
              </ul>
            </article>

            <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <h5 className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                <HistoryIcon />
                Recent Activity
              </h5>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircleIcon />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900">Certification Approved</p>
                    <p className="text-[10px] text-slate-500">Applicant ID #TSD-9982 - 15 mins ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <DownloadIcon />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900">New Batch Uploaded</p>
                    <p className="text-[10px] text-slate-500">Regional Center 04A - 1 hour ago</p>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AssessmentCenterDashboardPage;

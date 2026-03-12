import React from "react";
import TeacherDashboardHeader from "./TeacherDashboardHeader";
import TeacherDashboardSidebar from "./TeacherDashboardSidebar";

const applicants = [
  { initials: "JC", name: "Juan Dela Cruz", course: "Automotive Servicing NC II" },
  { initials: "MS", name: "Maria Santos", course: "Computer Systems Servicing" },
  { initials: "RG", name: "Ricardo Gomez", course: "Electrical Installation" },
  { initials: "AL", name: "Ana Lopez", course: "Health Care Services NC II" },
  { initials: "FB", name: "Ferdinand Bautista", course: "Welding (SMAW) NC II" },
];

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm4 6h4v2h-4v-2Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5M5 18.5h14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="m12 16.5 0-9m0 0 3 3m-3-3-3 3M4.5 15.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const TeacherDashboardPage = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[300px_1fr]">
      <TeacherDashboardSidebar />

      <div className="min-w-0">
        <TeacherDashboardHeader />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="page-title">Assigned Applicants</h1>
              <p className="mt-2 text-base text-slate-500">
                Review and verify applicant documentation for National
                Certification.
              </p>
            </div>

            <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Total Assigned
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                124
              </p>
            </article>
          </section>

          <section className="ui-card mt-6 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Applicant Registry
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage applicant records and review submitted requirements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FilterIcon />
                  Filters
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <DownloadIcon />
                  Export List
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[780px] w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Applicant Name
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Course
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {applicants.map((item) => (
                    <tr key={item.name} className="transition hover:bg-slate-50/70">
                      <td className="border-b border-slate-200 px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {item.initials}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4 text-slate-700">
                        {item.course}
                      </td>
                      <td className="border-b border-slate-200 px-6 py-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition hover:underline"
                        >
                          <ViewIcon />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">
                Showing 1 to 5 of 124 applicants
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  2
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  3
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  25
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 flex justify-end">
            <button
              type="button"
              className="ui-btn-primary inline-flex items-center gap-2 px-7 py-3 text-base"
            >
              <UploadIcon />
              Submit All Applicants to TESDA
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;

import React from "react";
import DirectorDashboardHeader from "./DirectorDashboardHeader";
import DirectorDashboardSidebar from "./DirectorDashboardSidebar";

const statCards = [
  {
    id: "total",
    title: "Total Applications",
    value: "1,284",
    badge: "+8.2% this month",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "pending",
    title: "Pending Assignment",
    value: "214",
    badge: "Needs attention",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  {
    id: "evaluations",
    title: "Evaluations Completed",
    value: "926",
    badge: "72% completion",
    badgeClass: "bg-blue-50 text-blue-700",
  },
  {
    id: "centers",
    title: "Active Assessment Centers",
    value: "37",
    badge: "3 recently added",
    badgeClass: "bg-slate-100 text-slate-700",
  },
];

const applicants = [
  {
    id: "APP-240001",
    name: "Juan Dela Cruz",
    initials: "JC",
    program: "Computer Systems Servicing NC II",
    department: "ICT Department",
    teacher: "Mr. Paolo Reyes",
    center: "Makati Skills Center",
    status: "Pending Assignment",
    statusClass: "bg-amber-50 text-amber-700",
    action: "Assign Evaluator",
  },
  {
    id: "APP-240002",
    name: "Maria Clara",
    initials: "MC",
    program: "Automotive Servicing NC II",
    department: "Automotive Department",
    teacher: "Ms. Elena Santos",
    center: "Quezon Assessment Hub",
    status: "Evaluation Ongoing",
    statusClass: "bg-blue-50 text-blue-700",
    action: "Write Evaluation",
  },
  {
    id: "APP-240003",
    name: "Jose Rizal",
    initials: "JR",
    program: "Electrical Installation and Maintenance NC II",
    department: "Electrical Department",
    teacher: "Unassigned",
    center: "Caloocan Trade Center",
    status: "Unassigned Teacher",
    statusClass: "bg-rose-50 text-rose-700",
    action: "Assign Evaluator",
  },
  {
    id: "APP-240004",
    name: "Andres Bonifacio",
    initials: "AB",
    program: "Cookery NC II",
    department: "Hospitality Department",
    teacher: "Chef Noel Aquino",
    center: "Pasig Culinary Center",
    status: "Report Filed",
    statusClass: "bg-emerald-50 text-emerald-700",
    action: "Report Filed",
  },
];

function StatsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M5 19V9m7 10V5m7 14v-7" strokeWidth="2" strokeLinecap="round" />
      <path d="M3.5 19.5h17" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm4 6h4v2h-4v-2Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m6 9 6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12.68 2.05a.75.75 0 0 1 .73.56l1.02 3.9a.75.75 0 0 0 .53.53l3.9 1.02a.75.75 0 0 1 0 1.46l-3.9 1.02a.75.75 0 0 0-.53.53l-1.02 3.9a.75.75 0 0 1-1.46 0l-1.02-3.9a.75.75 0 0 0-.53-.53l-3.9-1.02a.75.75 0 0 1 0-1.46l3.9-1.02a.75.75 0 0 0 .53-.53l1.02-3.9a.75.75 0 0 1 .73-.56Z" />
    </svg>
  );
}

function StatCard({ title, value, badge, badgeClass }) {
  return (
    <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <StatsIcon />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{badge}</span>
    </article>
  );
}

function ProgramSelector() {
  return (
    <label className="relative">
      <span className="sr-only">Program filter</span>
      <select className="ui-input h-10 min-w-[190px] appearance-none rounded-lg border-slate-200 bg-white pr-9 text-sm">
        <option>All Programs</option>
        <option>ICT Programs</option>
        <option>Automotive Programs</option>
        <option>Hospitality Programs</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
        <ChevronDownIcon />
      </span>
    </label>
  );
}

function CenterSelector({ value }) {
  return (
    <label className="relative block">
      <span className="sr-only">Assessment center</span>
      <select className="ui-input h-9 w-full appearance-none rounded-lg border-slate-200 bg-slate-50 pr-8 text-sm text-slate-700">
        <option>{value}</option>
        <option>Makati Skills Center</option>
        <option>Quezon Assessment Hub</option>
        <option>Caloocan Trade Center</option>
        <option>Pasig Culinary Center</option>
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
        <ChevronDownIcon />
      </span>
    </label>
  );
}

function ApplicantRow({ item }) {
  return (
    <tr className="align-top">
      <td className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {item.initials}
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-500">{item.id}</p>
          </div>
        </div>
      </td>
      <td className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-medium text-slate-800">{item.program}</p>
        <p className="mt-1 text-xs text-slate-500">{item.department}</p>
      </td>
      <td className="border-b border-slate-200 px-5 py-4">
        <span
          className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
            item.teacher === "Unassigned" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
          }`}
        >
          {item.teacher}
        </span>
      </td>
      <td className="border-b border-slate-200 px-5 py-4">
        <CenterSelector value={item.center} />
      </td>
      <td className="border-b border-slate-200 px-5 py-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.statusClass}`}>{item.status}</span>
      </td>
      <td className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              item.action === "Report Filed"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition`}
          >
            {item.action}
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`View ${item.name}`}
          >
            <EyeIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}

const DirectorDashboardPage = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[300px_1fr]">
      <DirectorDashboardSidebar />

      <div className="min-w-0">
        <DirectorDashboardHeader />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section>
            <h1 className="page-title">Director Dashboard</h1>
            <p className="page-description">Monitor applicants, assign assessment centers, and review reports across all programs.</p>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.id} title={card.title} value={card.value} badge={card.badge} badgeClass={card.badgeClass} />
            ))}
          </section>

          <section className="ui-card mt-6 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Applicant Management</h2>
                <p className="mt-1 text-sm text-slate-500">Review and assign applications for vocational training.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ProgramSelector />
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FilterIcon />
                  Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Applicant Details</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Program</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Assigned Teacher</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Assessment Center</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((item) => (
                    <ApplicantRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">Showing 1 to 4 of 120 applicants</p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Previous
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
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
                  Next
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-blue-700">Need assistance?</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Director Handbook and Support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access workflow guides for center assignments, evaluation monitoring, and escalation handling.
              </p>
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                <SparkIcon />
                Open handbook
              </button>
            </article>

            <article className="ui-card rounded-2xl border border-slate-200 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700">System Status</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">All systems operational</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                No service incidents detected. Assignment and report modules are running normally.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Last sync: Today, 09:48 AM
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DirectorDashboardPage;

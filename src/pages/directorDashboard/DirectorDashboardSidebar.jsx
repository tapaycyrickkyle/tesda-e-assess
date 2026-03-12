import React from "react";

const mainNavItems = [
  { id: "dashboard", label: "Dashboard", active: true },
  { id: "all-applicants", label: "All Applicants" },
  { id: "assign-centers", label: "Assign Centers" },
  { id: "reports", label: "Reports" },
];

const managementNavItems = [
  { id: "assessors", label: "Assessors" },
  { id: "settings", label: "Settings" },
];

function MortarboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-current">
      <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 0h11v8H10v-8Z" />
    </svg>
  );
}

function ApplicantIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M4 4h16v12H4V4Zm2 2v8h12V6H6Zm1 11h10v2H7v-2Z" />
    </svg>
  );
}

function CenterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2 3 6.5 12 11l7.4-3.7v5.2H21V6.5L12 2Zm-6 9.5v3.5c0 2.2 2.8 4 6 4s6-1.8 6-4v-3.5L12 14l-6-2.5Z" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M7 5h10M7 9h10M7 13h6M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssessorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
      <path d="M5 19c1.75-3.2 4.4-4.8 7-4.8s5.25 1.6 7 4.8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="m10.9 2.5-.3 1.6a7.8 7.8 0 0 0-1.7.7l-1.3-1a1 1 0 0 0-1.3.1L4 5.1a1 1 0 0 0-.1 1.3l1 1.3c-.3.5-.6 1.1-.7 1.7l-1.6.3a1 1 0 0 0-.8 1v2.4a1 1 0 0 0 .8 1l1.6.3c.2.6.4 1.2.7 1.7l-1 1.3a1 1 0 0 0 .1 1.3l1.7 1.7a1 1 0 0 0 1.3.1l1.3-1c.5.3 1.1.6 1.7.7l.3 1.6a1 1 0 0 0 1 .8h2.4a1 1 0 0 0 1-.8l.3-1.6c.6-.2 1.2-.4 1.7-.7l1.3 1a1 1 0 0 0 1.3-.1l1.7-1.7a1 1 0 0 0 .1-1.3l-1-1.3c.3-.5.6-1.1.7-1.7l1.6-.3a1 1 0 0 0 .8-1V11a1 1 0 0 0-.8-1l-1.6-.3a7.8 7.8 0 0 0-.7-1.7l1-1.3a1 1 0 0 0-.1-1.3L18.4 4a1 1 0 0 0-1.3-.1l-1.3 1c-.5-.3-1.1-.6-1.7-.7l-.3-1.6a1 1 0 0 0-1-.8h-2.4a1 1 0 0 0-1 .8Zm1.3 6a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function iconForItem(id) {
  if (id === "dashboard") return <GridIcon />;
  if (id === "all-applicants") return <ApplicantIcon />;
  if (id === "assign-centers") return <CenterIcon />;
  if (id === "reports") return <ReportIcon />;
  if (id === "assessors") return <AssessorIcon />;
  return <SettingsIcon />;
}

const DirectorDashboardSidebar = () => {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <MortarboardIcon />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">TESDA E-Assess</p>
            <p className="text-base text-slate-500">Director Dashboard</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium transition ${
                item.active ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className={item.active ? "text-blue-700" : "text-slate-500"}>{iconForItem(item.id)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-7 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Management</p>
        </div>

        <nav className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {managementNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <span className="text-slate-500">{iconForItem(item.id)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 lg:mt-auto">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            DR
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">Director Reyes</p>
            <p className="text-sm text-slate-500">Regional Head</p>
          </div>
          <button
            type="button"
            aria-label="More profile actions"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreIcon />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DirectorDashboardSidebar;

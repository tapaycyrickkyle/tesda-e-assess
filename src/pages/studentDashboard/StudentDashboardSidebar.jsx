import React from "react";

function FormIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="M8 6h8M8 10h8M8 14h5M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="M6 12.5 10 16l8-9"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="M14 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m10 12 10 0m-3-3 3 3-3 3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MortarboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7 fill-current"
    >
      <path d="M12 3 1.5 8.25 12 13.5l8.63-4.31v5.96H22V8.25L12 3Zm-6.75 8.49V15c0 2.14 3.2 3.75 6.75 3.75s6.75-1.61 6.75-3.75v-3.51L12 14.86l-6.75-3.37Z" />
    </svg>
  );
}

const StudentDashboardSidebar = () => {
  return (
    <aside className="student-dashboard-sidebar flex min-h-full flex-col">
      <div className="student-dashboard-brand">
        <span className="student-dashboard-brand-icon">
          <MortarboardIcon />
        </span>
        <div>
          <p className="text-[2rem] font-bold tracking-tight text-blue-700">
            TESDA
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Skills Development
          </p>
        </div>
      </div>

      <nav className="mt-7 space-y-1.5">
        <button
          type="button"
          className="student-dashboard-nav-item is-active"
        >
          <FormIcon />
          <span>Application Form</span>
        </button>

        <button
          type="button"
          className="student-dashboard-nav-item"
        >
          <StatusIcon />
          <span>Application Status</span>
        </button>
      </nav>

      <button
        type="button"
        className="student-dashboard-logout mt-auto"
      >
        <LogoutIcon />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default StudentDashboardSidebar;

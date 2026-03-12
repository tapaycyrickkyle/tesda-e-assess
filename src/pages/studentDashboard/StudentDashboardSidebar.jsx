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
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <MortarboardIcon />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">
              TESDA Portal
            </p>
            <p className="text-base text-slate-500">Student Dashboard</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg bg-blue-100 px-4 py-3 text-left text-base font-medium text-blue-700 transition"
          >
            <span className="text-blue-700">
              <FormIcon />
            </span>
            <span>Application Form</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <span className="text-slate-500">
              <StatusIcon />
            </span>
            <span>Application Status</span>
          </button>
        </nav>

        <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 lg:mt-auto">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
            A
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">Alex Rivera</p>
            <p className="text-sm text-slate-500">Learner Account</p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            aria-label="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default StudentDashboardSidebar;

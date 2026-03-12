import React from "react";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
      <path
        d="M5 19c1.75-3.2 4.4-4.8 7-4.8s5.25 1.6 7 4.8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const StudentDashboardHeader = () => {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <label className="relative w-full max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          className="ui-input rounded-xl border-slate-200 bg-slate-100 pl-12"
          placeholder="Search documents, status, or courses..."
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-base font-semibold text-slate-900">Alex Rivera</p>
          <p className="text-sm text-slate-500">Student ID: 2024-0892</p>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-700">
          <ProfileIcon />
        </span>
      </div>
    </header>
  );
};

export default StudentDashboardHeader;

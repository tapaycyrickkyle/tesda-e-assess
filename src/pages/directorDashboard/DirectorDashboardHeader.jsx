import React from "react";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2.5a6 6 0 0 0-6 6v2.66c0 .84-.33 1.65-.93 2.25L3.5 15h17l-1.57-1.59a3.2 3.2 0 0 1-.93-2.25V8.5a6 6 0 0 0-6-6Zm0 19a2.75 2.75 0 0 0 2.67-2h-5.34a2.75 2.75 0 0 0 2.67 2Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M13.2 5.2 12 6.4l4.6 4.6H4v1.7h12.6L12 17.3l1.2 1.2 6.7-6.7-6.7-6.6Z" />
    </svg>
  );
}

const DirectorDashboardHeader = () => {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <label className="relative w-full max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          className="ui-input rounded-xl border-slate-200 bg-slate-100 pl-12"
          placeholder="Search applicants, teacher, center, or status..."
        />
      </label>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <BellIcon />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <span className="h-8 border-l border-slate-200" />

        <button
          type="button"
          className="ui-btn-primary inline-flex items-center gap-2 px-5 py-2.5"
        >
          <ArrowRightIcon />
          Send to Assessment Center
        </button>
      </div>
    </header>
  );
};

export default DirectorDashboardHeader;

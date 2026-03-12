import React from "react";

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 fill-none stroke-current"
    >
      <path
        d="M8.5 4.5h6l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5.5 19v-13A1.5 1.5 0 0 1 7 4.5h1.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 4.5V8h3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 16v-5m0 0-2 2m2-2 2 2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const StudentDashboardUploadBox = ({ title, description, buttonLabel }) => {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="flex flex-col items-center">
        <span className="mb-4 text-slate-400">
          <UploadIcon />
        </span>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        className="ui-btn-secondary mt-5"
      >
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};

export default StudentDashboardUploadBox;

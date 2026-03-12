import React, { useState } from "react";
import StudentDashboardHeader from "./StudentDashboardHeader";
import StudentDashboardSidebar from "./StudentDashboardSidebar";
import StudentDashboardStatsCard from "./StudentDashboardStatsCard";
import StudentDashboardUploadBox from "./StudentDashboardUploadBox";

const tabs = ["Personal", "Address", "Education", "Contact"];

const tabCopy = {
  Personal: {
    fields: [
      { label: "Full Name", value: "Alex Rivera" },
      {
        label: "Desired Course",
        value: "Computer Systems Servicing NC II",
      },
      { label: "Preferred Teacher", value: "Juan Luna" },
      { label: "Date of Birth", value: "mm/dd/yyyy" },
    ],
  },
  Address: {
    message:
      "Address details will appear here once the student completes the residence section.",
  },
  Education: {
    message:
      "Education history and prior school records will be summarized in this tab.",
  },
  Contact: {
    message:
      "Primary contact details and emergency contacts will be managed here.",
  },
};

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="m6 9 6 6 6-6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="M7 3.75V6m10-2.25V6M4.75 8.5h14.5M6.5 5.5h11A1.75 1.75 0 0 1 19.25 7.25v10.25A1.75 1.75 0 0 1 17.5 19.25h-11a1.75 1.75 0 0 1-1.75-1.75V7.25A1.75 1.75 0 0 1 6.5 5.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeacherBadgeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <circle cx="12" cy="8" r="3.25" strokeWidth="1.8" />
      <path
        d="M6.5 18.25c1.45-2.6 3.65-3.9 5.5-3.9s4.05 1.3 5.5 3.9"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="8.25" strokeWidth="1.5" />
    </svg>
  );
}

function DashboardField({
  label,
  value,
  icon,
  type = "input"
}) {
  return (
    <label className="block">
      <span className="form-label mb-2 text-sm sm:text-sm">{label}</span>
      <div
        className={`ui-input flex min-h-11 items-center justify-between gap-3 border-slate-200 bg-slate-100 ${
          type === "select" ? "pr-3" : ""
        }`}
      >
        <span className="truncate">{value}</span>
        {icon ? (
          <span className="shrink-0 text-slate-500">{icon}</span>
        ) : null}
      </div>
    </label>
  );
}

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("Personal");
  const activeContent = tabCopy[activeTab];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[300px_1fr]">
      <StudentDashboardSidebar />

      <div className="min-w-0">
        <StudentDashboardHeader />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section>
            <h1 className="page-title">Student Dashboard</h1>
            <p className="page-description">
              Manage your application details and track your certification
              progress.
            </p>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StudentDashboardStatsCard
              title="Application Progress"
              value="60%"
              progress={60}
            />
            <StudentDashboardStatsCard
              title="Assigned Teacher"
              value="Juan Luna"
              icon={<TeacherBadgeIcon />}
            />
            <StudentDashboardStatsCard
              title="Current Status"
              value="Waiting for Teacher Review"
              status
            />
          </section>

          <section className="ui-card mt-6 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex w-full items-center gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-2 whitespace-nowrap sm:px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`border-b-2 px-3 py-3 text-base font-medium transition ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeContent.fields ? (
              <div className="grid gap-5 px-4 py-6 sm:px-6 md:grid-cols-2">
                <DashboardField
                  label="Full Name"
                  value="Alex Rivera"
                />
                <DashboardField
                  label="Desired Course"
                  value="Computer Systems Servicing NC II"
                  type="select"
                  icon={<ChevronDownIcon />}
                />
                <DashboardField
                  label="Preferred Teacher"
                  value="Juan Luna"
                  type="select"
                  icon={<ChevronDownIcon />}
                />
                <DashboardField
                  label="Date of Birth"
                  value="mm/dd/yyyy"
                  icon={<CalendarIcon />}
                />
              </div>
            ) : (
              <div className="mx-4 my-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 sm:mx-6">
                <p className="text-base leading-7 text-slate-600">
                  {activeContent.message}
                </p>
              </div>
            )}

            <div className="border-t border-slate-200 px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="section-title !text-xl">Supporting Documents</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload the required files to continue your application.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <StudentDashboardUploadBox
                  title="Government Issued ID"
                  description="Upload a clear photo or PDF (Max 5MB)"
                  buttonLabel="Choose File"
                />
                <StudentDashboardUploadBox
                  title="School Diploma/Transcript"
                  description="Latest educational records (Max 10MB)"
                  buttonLabel="Choose File"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" className="ui-btn-secondary">
                Save Draft
              </button>
              <button type="button" className="ui-btn-primary">
                Submit Application
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

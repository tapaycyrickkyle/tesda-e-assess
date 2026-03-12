import React, { useState } from "react";
import StudentDashboardHeader from "./StudentDashboardHeader";
import StudentDashboardSidebar from "./StudentDashboardSidebar";
import StudentDashboardStatsCard from "./StudentDashboardStatsCard";
import StudentDashboardUploadBox from "./StudentDashboardUploadBox";
import "./studentDashboard.css";

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
  type = "input",
}) {
  return (
    <label className="block">
      <span className="student-dashboard-field-label">
        {label}
      </span>
      <div className={`student-dashboard-field ${type === "select" ? "is-select" : ""}`}>
        <span className="truncate">{value}</span>
        {icon ? (
          <span className="student-dashboard-field-icon">
            {icon}
          </span>
        ) : null}
      </div>
    </label>
  );
}

const StudentDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("Personal");
  const activeContent = tabCopy[activeTab];

  return (
    <div className="app-shell">
      <main className="student-dashboard-layout">
        <StudentDashboardSidebar />

        <section className="student-dashboard-content">
          <StudentDashboardHeader />

          <div className="student-dashboard-stats-grid">
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
          </div>

          <section className="student-dashboard-panel">
            <div className="student-dashboard-tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`student-dashboard-tab ${activeTab === tab ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeContent.fields ? (
              <div className="student-dashboard-form-grid">
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
              <div className="student-dashboard-empty-state mt-8">
                <p className="text-base leading-7 text-slate-600">
                  {activeContent.message}
                </p>
              </div>
            )}

            <div className="mt-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[1.05rem] font-bold tracking-tight text-slate-950 sm:text-[1.1rem]">
                    Supporting Documents
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
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

            <div className="student-dashboard-actions">
              <button
                type="button"
                className="student-dashboard-action-button is-secondary"
              >
                Save Draft
              </button>
              <button
                type="button"
                className="student-dashboard-action-button is-primary"
              >
                Submit Application
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboardPage;

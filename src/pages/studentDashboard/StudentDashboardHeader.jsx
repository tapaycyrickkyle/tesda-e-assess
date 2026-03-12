import React from "react";

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7 fill-none stroke-current"
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
    <header className="student-dashboard-header">
      <div>
        <h1 className="page-title text-[2.4rem] leading-none sm:text-[3rem]">
          Student Dashboard
        </h1>
        <p className="page-description mt-3 max-w-2xl text-[1.1rem]">
          Manage your applications and track your certification progress.
        </p>
      </div>

      <div className="student-dashboard-profile">
        <div className="student-dashboard-profile-copy">
          <p className="text-[1.05rem] font-semibold text-slate-900">
            Alex Rivera
          </p>
          <p className="text-[0.95rem] text-slate-500">
            Student ID: 2024-0892
          </p>
        </div>
        <span className="student-dashboard-avatar">
          <ProfileIcon />
        </span>
      </div>
    </header>
  );
};

export default StudentDashboardHeader;

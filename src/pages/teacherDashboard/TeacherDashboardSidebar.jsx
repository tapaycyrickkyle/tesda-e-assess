import React from "react";
import tesdaLogo from "../../assets/toppng.com-deped-logo-tesda-logo-624x621.png";

function TesdaIcon() {
  return (
    <img
      src={tesdaLogo}
      alt="TESDA Logo"
      className="h-8 w-8 object-contain"
    />
  );
}

function GroupIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16 11a3.5 3.5 0 1 0-2.52-5.93A4.25 4.25 0 1 0 11 14.1V15a5.75 5.75 0 0 0-5.75 5.75h1.5A4.25 4.25 0 0 1 11 16.5h2a4.25 4.25 0 0 1 4.25 4.25h1.5A5.75 5.75 0 0 0 13 15v-.9A3.5 3.5 0 0 0 16 11Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M14 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m10 12 10 0m-3-3 3 3-3 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TeacherDashboardSidebar = () => {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white">
            <TesdaIcon />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">
              TESDA E-Assess
            </p>
            <p className="text-base text-slate-500">Teacher Dashboard</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg bg-blue-100 px-4 py-3 text-left text-base font-medium text-blue-700 transition"
          >
            <GroupIcon />
            Applicants
          </button>
        </nav>

        <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 lg:mt-auto">
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-slate-200">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3l_fBPrum09iTOfI62Nv87RvwSM0K9w9BSkDtoDHuDuV7cQHYcBk7N9XcGdvB-hO8qxA_yo3CXgm8AFR1iWTmtOhkpElJgf-uhIsSj9lvRP_HjO2Zg0wVh3mFuEcAoU8y2a9KZ5XZ_qhHj197DiVolksPZLkDTQ3KS4yg5Z9BYjh6EhwCzMK-1B93pg9TbWK9nh5o8XrOtUz9_yijWjGl8idfxpDFtgf4iSSEzo0iJZkfaNt9iRUdNm0FkCo-r6V97qA8XAtP3eHe"
              alt="Teacher profile"
              className="h-full w-full object-cover"
            />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">
              Prof. Robert Chen
            </p>
            <p className="text-sm text-slate-500">Instructor IV</p>
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

export default TeacherDashboardSidebar;

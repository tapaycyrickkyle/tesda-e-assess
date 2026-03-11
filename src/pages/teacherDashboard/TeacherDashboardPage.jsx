import React from "react";
import "./teacherDashboard.css";

const fieldBaseClass =
  "teacher-field w-full rounded-[14px] border border-slate-300 bg-[#f8fafc] pl-14 pr-4 text-[16px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
    >
      <path
        d="M15 6 9 12l6 6M9 12h10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M12 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.25c-4.3 0-7.5 2.21-7.5 5.25 0 .41.34.75.75.75h13.5a.75.75 0 0 0 .75-.75c0-3.04-3.2-5.25-7.5-5.25Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M4.25 5.5A2.25 2.25 0 0 0 2 7.75v8.5a2.25 2.25 0 0 0 2.25 2.25h15.5A2.25 2.25 0 0 0 22 16.25v-8.5A2.25 2.25 0 0 0 19.75 5.5H4.25Zm-.53 2.1 7.82 5.45a.75.75 0 0 0 .92 0l7.82-5.45v8.65a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75V7.6Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M7 2.75A2.25 2.25 0 0 0 4.75 5v14A2.25 2.25 0 0 0 7 21.25h10A2.25 2.25 0 0 0 19.25 19V5A2.25 2.25 0 0 0 17 2.75H7ZM12 18.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M5 3.75A1.75 1.75 0 0 0 3.25 5.5v13A1.75 1.75 0 0 0 5 20.25h14a1.75 1.75 0 0 0 1.75-1.75V9.4a1.75 1.75 0 0 0-.57-1.29l-4.4-4.15a1.75 1.75 0 0 0-1.2-.46H5Zm1.5 2h6v4h4.75v9H6.5v-13Zm1.5 2.5v1.5h2v-1.5H8Zm0 3v1.5h2v-1.5H8Zm0 3v1.5h2v-1.5H8Zm4-6v1.5h2v-1.5h-2Zm0 3v1.5h2v-1.5h-2Zm0 3v1.5h2v-1.5h-2Z" />
    </svg>
  );
}

function DepartmentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M11.47 3.34a.75.75 0 0 1 1.06 0l4.13 4.13a.75.75 0 0 1-.53 1.28h-2.38v3.5h3.5a.75.75 0 0 1 .75.75v4.75a.75.75 0 0 1-.75.75h-4.75a.75.75 0 0 1-.75-.75v-3.5h-3.5v3.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V13a.75.75 0 0 1 .75-.75h3.5v-3.5H5.87a.75.75 0 0 1-.53-1.28l4.13-4.13a.75.75 0 0 1 1.06 0l.94.94.94-.94Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M12 2.75A4.75 4.75 0 0 0 7.25 7.5v2H6A2.25 2.25 0 0 0 3.75 11.75v8.5A2.25 2.25 0 0 0 6 22.5h12a2.25 2.25 0 0 0 2.25-2.25v-8.5A2.25 2.25 0 0 0 18 9.5h-1.25v-2A4.75 4.75 0 0 0 12 2.75Zm-3.25 6.5v-1.75a3.25 3.25 0 1 1 6.5 0v1.75h-6.5Z" />
    </svg>
  );
}

function RefreshLockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M12.75 3a.75.75 0 0 1 0 1.5 6.75 6.75 0 1 0 6.12 9.6.75.75 0 0 1 1.37.6A8.25 8.25 0 1 1 12.75 3Z" />
      <path d="M13 7.25A2.75 2.75 0 0 0 10.25 10v1H9.5A1.75 1.75 0 0 0 7.75 12.75v4.5A1.75 1.75 0 0 0 9.5 19h7a1.75 1.75 0 0 0 1.75-1.75v-4.5A1.75 1.75 0 0 0 16.5 11h-.75v-1A2.75 2.75 0 0 0 13 7.25Zm-1.25 3A1.25 1.25 0 1 1 14.25 10v1h-2.5v-1Z" />
      <path d="M18.33 3.39a.75.75 0 0 1 1.06.07l1.73 1.98a.75.75 0 0 1-.07 1.06l-1.97 1.73a.75.75 0 1 1-.99-1.13l.61-.53h-2.95a.75.75 0 0 1 0-1.5h2.95l-.44-.5a.75.75 0 0 1 .07-1.06Z" />
    </svg>
  );
}

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

function CheckUserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current"
    >
      <path
        d="M17.5 21a5.5 5.5 0 0 0-11 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm4 8 2 2 4-4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FieldShell({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-3 block text-[15px] font-medium text-slate-900">
        {label}
      </span>
      <div className="relative">
        <span className="teacher-field-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

const TeacherDashboardPage = () => {
  return (
    <main className="bg-[#f4f6f8] px-4 pb-14 pt-28 text-slate-900 sm:px-6 lg:px-8 lg:pt-36">
      <div className="mx-auto w-full max-w-[1200px]">
        <a
          href="#"
          className="inline-flex items-center gap-3 text-[18px] font-medium text-blue-700 transition hover:text-blue-800"
        >
          <ArrowLeftIcon />
          Back to Login
        </a>

        <section className="mt-14 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[400px_minmax(0,1fr)]">
            <aside className="teacher-portal-panel relative overflow-hidden bg-[#1d6fcd] px-8 py-10 text-white sm:px-10 lg:min-h-[760px] lg:px-10 lg:py-12">
              <div className="relative z-10 max-w-[240px]">
                <h1 className="text-[34px] font-bold leading-tight">
                  Instructor Portal
                </h1>
                <p className="mt-8 text-[18px] leading-[1.8] text-white/92">
                  Join thousands of TVET trainers across the Philippines.
                  Digitalizing vocational education for a brighter future.
                </p>
              </div>

              <div className="teacher-portal-building pointer-events-none absolute bottom-0 right-0 h-56 w-56 opacity-70 sm:h-64 sm:w-64" />
            </aside>

            <div className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
              <div className="mx-auto max-w-[680px]">
                <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[38px]">
                  Teacher Registration
                </h2>

                <form className="mt-10 space-y-8">
                  <FieldShell label="Full Name" icon={<UserIcon />}>
                    <input
                      type="text"
                      placeholder="Dela Cruz, Juan A."
                      className={`${fieldBaseClass} h-[62px]`}
                    />
                  </FieldShell>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FieldShell label="Email Address" icon={<MailIcon />}>
                      <input
                        type="email"
                        placeholder="instructor@school.edu.ph"
                        className={`${fieldBaseClass} h-[62px]`}
                      />
                    </FieldShell>

                    <FieldShell label="Contact Number" icon={<PhoneIcon />}>
                      <input
                        type="tel"
                        placeholder="0917 XXX XXXX"
                        className={`${fieldBaseClass} h-[62px]`}
                      />
                    </FieldShell>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FieldShell label="School Name" icon={<BuildingIcon />}>
                      <input
                        type="text"
                        placeholder="TESDA Technology Center"
                        className={`${fieldBaseClass} h-[62px]`}
                      />
                    </FieldShell>

                    <FieldShell label="Department" icon={<DepartmentIcon />}>
                      <div className="relative">
                        <select
                          defaultValue=""
                          className={`${fieldBaseClass} h-[62px] appearance-none text-slate-950`}
                        >
                          <option value="" disabled>
                            Select Department
                          </option>
                          <option>Automotive</option>
                          <option>Hospitality</option>
                          <option>ICT</option>
                          <option>Construction</option>
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                          <ChevronDownIcon />
                        </span>
                      </div>
                    </FieldShell>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FieldShell label="Password" icon={<LockIcon />}>
                      <input
                        type="password"
                        placeholder="........"
                        className={`${fieldBaseClass} h-[62px]`}
                      />
                    </FieldShell>

                    <FieldShell
                      label="Confirm Password"
                      icon={<RefreshLockIcon />}
                    >
                      <input
                        type="password"
                        placeholder="........"
                        className={`${fieldBaseClass} h-[62px]`}
                      />
                    </FieldShell>
                  </div>

                  <label className="flex items-start gap-4 text-[15px] leading-7 text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-1 h-6 w-6 rounded-[6px] border border-slate-300 text-blue-700 accent-blue-700"
                    />
                    <span>
                      I agree to the TESDA{" "}
                      <a
                        href="#"
                        className="text-blue-700 transition hover:text-blue-800"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-blue-700 transition hover:text-blue-800"
                      >
                        Privacy Policy.
                      </a>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="flex h-[74px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#1d6fcd] px-6 text-[18px] font-semibold text-white shadow-[0_8px_20px_rgba(29,111,205,0.28)] transition hover:bg-[#155fb5]"
                  >
                    <CheckUserIcon />
                    Complete Registration
                  </button>

                  <p className="pt-4 text-center text-[15px] text-slate-500">
                    Already have an instructor account?{" "}
                    <a
                      href="#"
                      className="font-semibold text-blue-700 transition hover:text-blue-800"
                    >
                      Login here
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TeacherDashboardPage;

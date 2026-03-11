import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./teacherDashboard.css";

const fieldBaseClass =
  "teacher-field w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:py-4 sm:text-lg";

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

function TeacherCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-14 w-14 text-white/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="7.75" r="3.25" />
      <path d="M5.2 19c1.5-2.9 4.1-4.35 6.8-4.35s5.3 1.45 6.8 4.35" />
      <path d="m4 10 8-4 8 4-8 4-8-4Z" />
      <path d="M19 11.5V16" />
    </svg>
  );
}

function FieldShell({ label, children }) {
  return (
    <label className="block">
      <span className="mb-3 block text-base font-semibold text-slate-700 sm:text-lg">
        {label}
      </span>
      {children}
    </label>
  );
}

const TeacherDashboardPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <Navbar />
      <main className="mx-auto mb-14 w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 mt-4 w-full max-w-6xl text-start">
          <Link
            to="/registration-type"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600 transition hover:text-blue-700"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Registration Type
          </Link>
        </div>

        <section className="mx-auto max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
          <div className="grid lg:min-h-[760px] lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="teacher-portal-panel relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-blue-700 px-8 py-10 text-white sm:px-12 sm:py-14 lg:min-h-full lg:px-14 lg:py-16">
              <div>
                <div className="mb-14 flex justify-center rounded-full border border-white/20 bg-white/10 p-2">
                  <TeacherCircleIcon />
                </div>
                <h1 className="text-center text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Teach with TESDA
                </h1>
                <p className="mt-8 max-w-md text-sm leading-2 text-white/90 sm:text-[1.2rem] sm:leading-[2rem]">
                  Join thousands of TVET trainers across the Philippines.
                  Digitalizing vocational education for a brighter future.
                </p>
              </div>

              <div className="teacher-portal-pattern pointer-events-none absolute bottom-0 right-0 h-72 w-72 sm:h-80 sm:w-80" />
            </aside>

            <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-3xl">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                  Teacher Registration
                </h2>
                <p className="mt-4 text-base text-slate-500 sm:text-[1.2rem]">
                  Please fill out all the fields below to create your account.
                </p>

                <form className="mt-12 space-y-6">
                  <FieldShell label="Full Name">
                    <input
                      type="text"
                      placeholder="Dela Cruz, Juan A."
                      className={fieldBaseClass}
                    />
                  </FieldShell>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FieldShell label="Email Address">
                      <input
                        type="email"
                        placeholder="instructor@school.edu.ph"
                        className={fieldBaseClass}
                      />
                    </FieldShell>

                    <FieldShell label="Contact Number">
                      <input
                        type="tel"
                        placeholder="0917 XXX XXXX"
                        className={fieldBaseClass}
                      />
                    </FieldShell>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FieldShell label="School Name">
                      <input
                        type="text"
                        placeholder="TESDA Technology Center"
                        className={fieldBaseClass}
                      />
                    </FieldShell>

                    <FieldShell label="Department">
                      <div className="relative">
                        <select
                          defaultValue=""
                          className={`${fieldBaseClass} appearance-none text-slate-950`}
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
                    <FieldShell label="Password">
                      <input
                        type="password"
                        placeholder="........"
                        className={fieldBaseClass}
                      />
                    </FieldShell>

                    <FieldShell label="Confirm Password">
                      <input
                        type="password"
                        placeholder="........"
                        className={fieldBaseClass}
                      />
                    </FieldShell>
                  </div>

                  <label className="flex items-start gap-4 text-base text-slate-600 sm:text-lg">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border border-slate-300 text-blue-700 accent-blue-700"
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
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-800 sm:py-5 sm:text-xl"
                  >
                    <CheckUserIcon />
                    Complete Registration
                  </button>

                  <p className="text-center text-base text-slate-600 sm:text-lg">
                    Already have an instructor account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-700 transition hover:text-blue-800"
                    >
                      Login here
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherDashboardPage;

import React from "react";
import "./studentRegistration.css";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const fieldBaseClass =
  "w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-xl text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

function UserCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-14 w-14 text-white/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19c1.66-3 4.2-4.5 7-4.5S17.34 16 19 19" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

const StudentRegistrationPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <Navbar />
      <main className="mx-auto mb-14 w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-3">
        <div className="mt-4 mb-5 text-start">
          <Link
            to="/registration-type"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600 transition hover:text-blue-700"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Registration Type
          </Link>
        </div>
        <section className="overflow-hidden rounded-[30px] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
          <div className="grid min-h-[760px] lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="registration-panel relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-blue-700 px-8 py-10 text-white sm:px-12 sm:py-14 lg:min-h-full lg:px-14 lg:py-16">
              <div>
                <div className="mb-14 flex justify-center rounded-full border border-white/20 bg-white/10 p-2">
                  <UserCircleIcon />
                </div>
                <h1 className="text-4xl font-bold text-center leading-tight sm:text-5xl">
                  Join TESDA
                </h1>
                <p className="mt-8 max-w-md text-sm leading-2 text-white/90 sm:text-[1.2rem] sm:leading-[2rem]">
                  Access world-class technical education and skills development
                  programs across the Philippines.
                </p>
              </div>

              <div className="registration-pattern pointer-events-none absolute bottom-0 right-0 h-72 w-72 sm:h-80 sm:w-80" />
            </aside>

            <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-3xl">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                  Student Registration
                </h2>
                <p className="mt-4 text-lg text-slate-500 sm:text-[1.2rem]">
                  Please fill out all the fields below to create your account.
                </p>

                <form className="mt-12 space-y-6">
                  <label className="block">
                    <span className="mb-3 block text-xl font-semibold text-slate-700">
                      Full Name
                    </span>
                    <input
                      type="text"
                      placeholder="Juan Dela Cruz"
                      className={fieldBaseClass}
                    />
                  </label>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-xl font-semibold text-slate-700">
                        Email Address
                      </span>
                      <input
                        type="email"
                        placeholder="juan@example.com"
                        className={fieldBaseClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-xl font-semibold text-slate-700">
                        Contact Number
                      </span>
                      <input
                        type="tel"
                        placeholder="0917XXXXXXX"
                        className={fieldBaseClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-3 block text-xl font-semibold text-slate-700">
                      Residential Address
                    </span>
                    <input
                      type="text"
                      placeholder="House No., Street, Brgy, City, Province"
                      className={fieldBaseClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-xl font-semibold text-slate-700">
                      Last School Attended
                    </span>
                    <input
                      type="text"
                      placeholder="Name of School / Training Center"
                      className={fieldBaseClass}
                    />
                  </label>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-xl font-semibold text-slate-700">
                        Password
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        className={fieldBaseClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-xl font-semibold text-slate-700">
                        Confirm Password
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        className={fieldBaseClass}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="mt-4 w-full rounded-2xl bg-blue-700 px-6 py-5 text-xl font-bold text-white transition hover:bg-blue-800"
                  >
                    Complete Registration
                  </button>

                  <p className="text-center text-lg text-slate-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-700 hover:text-blue-800"
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

export default StudentRegistrationPage;

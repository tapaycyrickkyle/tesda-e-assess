import React from "react";
import "./studentRegistration.css";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import tesdaLogo from "../../assets/TESDA_Logo_official-removebg-preview.png";

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
  const inputClassName = "ui-input border-slate-200 bg-slate-100";

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content mb-12">
        <div className="mb-6 text-start">
          <Link
            to="/registration-type"
            className="back-link"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Registration Type
          </Link>
        </div>
        <section className="ui-card mx-auto overflow-hidden rounded-[30px] p-0 shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
          <div className="grid lg:min-h-[760px] lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="registration-panel relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-blue-700 px-8 py-10 text-white sm:px-12 sm:py-14 lg:min-h-full lg:px-14 lg:py-16">
              <div>
                <div className="mb-14 flex justify-center rounded-full border border-white/20 bg-white/10 p-2">
                  <UserCircleIcon />
                </div>
                <h1 className="text-center text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Join TESDA
                </h1>
                <p className="mt-8 max-w-md text-sm leading-relaxed text-white/90 sm:text-[1.2rem] sm:leading-[2rem]">
                  Access world-class technical education and skills development
                  programs across the Philippines.
                </p>
              </div>
              <img
                src={tesdaLogo}
                alt="TESDA Logo"
                className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 object-contain opacity-20 sm:h-80 sm:w-80"
              />
            </aside>

            <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-3xl">
                <h2 className="page-title text-slate-800">
                  Student Registration
                </h2>
                <p className="page-description sm:text-[1.1rem]">
                  Please fill out all the fields below to create your account.
                </p>

                <form className="mt-12 space-y-6">
                  <label className="block">
                    <span className="form-label">
                      Full Name
                    </span>
                    <input
                      type="text"
                      placeholder="Juan Dela Cruz"
                      className={inputClassName}
                    />
                  </label>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">
                        Email Address
                      </span>
                      <input
                        type="email"
                        placeholder="juan@example.com"
                        className={inputClassName}
                      />
                    </label>

                    <label className="block">
                      <span className="form-label">
                        Contact Number
                      </span>
                      <input
                        type="tel"
                        placeholder="0917XXXXXXX"
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="form-label">
                      Residential Address
                    </span>
                    <input
                      type="text"
                      placeholder="House No., Street, Brgy, City, Province"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="form-label">
                      Last School Attended
                    </span>
                    <input
                      type="text"
                      placeholder="Name of School / Training Center"
                      className={inputClassName}
                    />
                  </label>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">
                        Password
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        className={inputClassName}
                      />
                    </label>

                    <label className="block">
                      <span className="form-label">
                        Confirm Password
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="ui-btn-primary mt-4 w-full py-3 text-lg sm:py-4"
                  >
                    Complete Registration
                  </button>

                  <p className="text-center text-sm text-slate-600 sm:text-base">
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

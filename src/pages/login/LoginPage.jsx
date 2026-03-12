import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../studentRegistration/studentRegistration.css";

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M12 2.5 4.5 5.2v5.83c0 4.3 2.7 8.2 6.76 9.8a2.03 2.03 0 0 0 1.48 0c4.06-1.6 6.76-5.5 6.76-9.8V5.2L12 2.5Zm-.9 12.25-2.7-2.7 1.05-1.05 1.65 1.66 3.45-3.45 1.05 1.05-4.5 4.5Z" />
    </svg>
  );
}

const LoginPage = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content mb-12">
        <div className="mx-auto mb-6 max-w-5xl text-start">
          <Link
            to="/"
            className="back-link"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Home
          </Link>
        </div>
        <section className="ui-card mx-auto max-w-5xl overflow-hidden rounded-[30px] p-0 shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
          <div className="grid lg:min-h-[560px] lg:grid-cols-[0.88fr_1.12fr]">
            <aside className="registration-panel relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-blue-700 px-8 py-9 text-white sm:px-10 sm:py-11 lg:min-h-full lg:px-12 lg:py-12">
              <div>
                <div className="mb-14 flex justify-center rounded-full border border-white/20 bg-white/10 p-2">
                  <ShieldIcon />
                </div>
                <h1 className="text-center text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Welcome Back
                </h1>
                <p className="mt-8 max-w-md text-sm leading-relaxed text-white/90 sm:text-[1.2rem] sm:leading-[2rem]">
                  Log in to your TESDA account to access your vocational
                  training, certifications, and learning resources.
                </p>
              </div>
              <div className="registration-pattern pointer-events-none absolute bottom-0 right-0 h-72 w-72 sm:h-80 sm:w-80" />
            </aside>

            <div className="px-7 py-9 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
              <div className="mx-auto max-w-3xl">
                <h2 className="page-title text-slate-800">
                  Login
                </h2>
                <p className="page-description sm:text-[1.1rem]">
                  Log in to your account to continue your learning journey.
                </p>
                <form className="mt-9 space-y-5">
                  <label className="block">
                    <span className="form-label">
                      Email Address
                    </span>
                    <input
                      type="email"
                      placeholder="juan@example.com"
                      className="ui-input"
                    />
                  </label>
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <span className="form-label mb-0">
                      Password
                    </span>
                    <a
                      href="#"
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 sm:text-base"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <label className="block">
                    <input
                      type="password"
                      placeholder="Password"
                      className="ui-input"
                    />
                  </label>
                  <button
                    type="submit"
                    className="ui-btn-primary mt-4 w-full py-3 text-lg sm:py-4"
                  >
                    Login
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-600 sm:text-base">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/registration-type"
                    className="font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Register now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;

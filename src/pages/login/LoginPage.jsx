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

const fieldBaseClass =
  "w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-xl text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <Navbar />
      <main className="mx-auto mb-14 w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-3">
        <div className="mx-auto mt-4 mb-5 w-full max-w-6xl text-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600 transition hover:text-blue-700"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Home
          </Link>
        </div>
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)]">
          <div className="grid min-h-[680px] lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="registration-panel relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-blue-700 px-8 py-10 text-white sm:px-12 sm:py-14 lg:min-h-full lg:px-14 lg:py-16">
              <div>
                <div className="mb-14 flex justify-center rounded-full border border-white/20 bg-white/10 p-2">
                  <ShieldIcon />
                </div>
                <h1 className="text-4xl text-center font-bold leading-tight sm:text-5xl">
                  Welcome Back
                </h1>
                <p className="mt-8 max-w-md text-sm leading-2 text-white/90 sm:text-[1.2rem] sm:leading-[2rem]">
                  Log in to your TESDA account to access your vocational
                  training, certifications, and learning resources.
                </p>
              </div>
              <div className="registration-pattern pointer-events-none absolute bottom-0 right-0 h-72 w-72 sm:h-80 sm:w-80" />
            </aside>

            <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-3xl">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                  Login
                </h2>
                <p className="mt-4 text-lg text-slate-500 sm:text-[1.2rem]">
                  Log in to your account to continue your learning journey.
                </p>
                <form className="mt-12 space-y-6">
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
                  <div className="flex items-center justify-between">
                    <span className="block text-xl font-semibold text-slate-700">
                      Password
                    </span>
                    <a
                      href="#"
                      className="text-lg font-medium text-blue-700 hover:text-blue-800"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <label className="block">
                    <input
                      type="password"
                      placeholder="Password"
                      className={fieldBaseClass}
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-4 w-full rounded-2xl bg-blue-700 px-6 py-5 text-xl font-bold text-white transition hover:bg-blue-800"
                  >
                    Login
                  </button>
                </form>
                <p className="mt-6 text-center text-lg text-slate-600">
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

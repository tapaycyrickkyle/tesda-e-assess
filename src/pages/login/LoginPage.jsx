import React from "react";
import { Link } from "react-router-dom";

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
    <main className=" bg-slate-100 min-h-screen py-20">
      <div className="grid lg:grid-cols-2 max-w-screen-2xl mx-auto">
        <section className="relative hidden overflow-hidden bg-[#1f72c8] lg:block rounded-l-2xl">
          <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-white/10" />
          <div className="relative mx-auto flex h-full max-w-[690px] flex-col px-12 py-16">
            <h1 className="mt-12 max-w-[560px] text-[3rem] font-bold leading-[1.04] tracking-tight text-white">
              Empowering Filipinos through Technical Excellence
            </h1>
            <p className="mt-8 max-w-[560px] text-[1.3rem] leading-10 text-blue-100">
              Welcome to the unified TESDA online portal. Access your vocational
              training, manage certifications, and stay updated with the latest
              industry skills.
            </p>
            <div className="relative mt-12 overflow-hidden rounded-2xl border border-white/20 bg-[#6fb1f2]">
              <img
                src="https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1400&q=80"
                alt="Technical training scene"
                className="h-[440px] w-full object-cover opacity-80"
              />
              <div className="absolute bottom-6 left-6 flex items-center gap-3 text-white">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <ShieldIcon />
                </span>
                <div>
                  <p className="text-[28px] font-semibold leading-tight">
                    Secure Access
                  </p>
                  <p className="text-[14px] text-blue-100">
                    Official Government System
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="flex bg-white flex-col px-6 pt-24 md:px-17 rounded-r-2xl">
          <div className="w-full max-w-[620px]">
            <h2 className="text-[3rem] font-bold tracking-tight text-slate-900">
              LOGIN
            </h2>
            <p className="text-xl leading-8 text-slate-500">
              Log in to your account to continue your learning journey.
            </p>
            <form className="mt-10">
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
              <div className="mt-6 flex items-center justify-between">
                <span className="mb-3 block text-xl font-semibold text-slate-700">
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
                className="cursor-pointer mt-8 h-16 w-full items-center justify-center gap-3 rounded-xl bg-blue-700 text-xl font-semibold text-white transition hover:bg-blue-800"
              >
                login
              </button>
            </form>
            <div className="border-t border-slate-200 pt-10 text-center">
              <p className="text-xl text-slate-600">
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
        </section>
      </div>
    </main>
  );
};

export default LoginPage;

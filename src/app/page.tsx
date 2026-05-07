"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#f3f4f6_55%,#eceff3_100%)] px-4 py-6 text-[#1a1c1c] sm:px-6">
      <main className="z-10 flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="mb-1 text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#002576]">
            TESDA E-Forms
          </h1>
          <p className="mx-auto max-w-[320px] text-[14px] leading-[1.5] text-[#5d5f5f]">
            Application Form System for TESDA Eastern Samar Provincial Office
          </p>
        </div>

        <div className="w-full rounded-xl border border-[#c4c5d5] bg-white p-6 shadow-[0_20px_45px_rgba(9,18,33,0.12)] sm:p-8">
          <form action="#" className="space-y-6" method="POST">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold leading-[1.2] text-[#1a1c1c]" htmlFor="username">
                Email or Username
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-user text-[14px] leading-none text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                </span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] py-3 pl-10 pr-4 text-[16px] leading-[1.5] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                  id="username"
                  name="username"
                  placeholder="Enter your credentials"
                  required
                  type="text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-semibold leading-[1.2] text-[#1a1c1c]" htmlFor="password">
                  Password
                </label>
                <Link className="text-[14px] font-semibold leading-[1.5] text-[#002576] hover:underline" href="#">
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-lock text-[14px] leading-none text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                </span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] py-3 pl-10 pr-10 text-[16px] leading-[1.5] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                  id="password"
                  name="password"
                  placeholder="********"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#747685] transition-colors hover:text-[#1a1c1c]"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  <i
                    aria-hidden="true"
                    className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-[14px] leading-none`}
                  />
                </button>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#002576] py-4 text-[16px] font-semibold leading-none tracking-[0.02em] text-white shadow-sm transition-all hover:bg-[#0038a8] hover:shadow-md active:scale-[0.98]"
              type="submit"
            >
              Login
            </button>

            <div className="pt-1">
              <p className="mb-2 text-center text-[13px] leading-[1.4] text-[#5d5f5f]">
                Don&apos;t have an account?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/sign-up/applicant"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c4c5d5] bg-white py-3 text-[14px] font-semibold text-[#444653] transition hover:border-[#0038a8] hover:bg-[#eef3ff] hover:text-[#0038a8] active:border-[#0038a8] active:text-[#0038a8]"
              >
                <i aria-hidden="true" className="fa-solid fa-user-plus text-[13px]" />
                Sign Up as Applicant
              </Link>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c4c5d5] bg-white py-3 text-[14px] font-semibold text-[#444653] transition hover:border-[#0038a8] hover:bg-[#eef3ff] hover:text-[#0038a8] active:border-[#0038a8] active:text-[#0038a8]"
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-chalkboard-user text-[13px]" />
                Sign Up as Teacher
              </button>
            </div>
          </form>

        </div>

        <div className="mt-8 space-y-1 text-center opacity-70">
          <p className="text-[14px] leading-[1.5] text-[#444653]">
            (c) 2024 TESDA E-Forms Portal. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-[12px] font-medium text-[#5d5f5f]">
            <Link className="transition-colors hover:text-[#002576]" href="#">
              Privacy Policy
            </Link>
            <span className="h-1 w-1 rounded-full bg-[#c4c5d5]" />
            <Link className="transition-colors hover:text-[#002576]" href="#">
              Terms of Service
            </Link>
            <span className="h-1 w-1 rounded-full bg-[#c4c5d5]" />
            <Link className="transition-colors hover:text-[#002576]" href="#">
              Support
            </Link>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 right-0 p-12 opacity-[0.03]">
        <i aria-hidden="true" className="fa-solid fa-building-columns text-[220px] leading-none text-[#1a1c1c]" />
      </div>
    </div>
  );
}

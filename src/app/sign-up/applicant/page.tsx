"use client";

import Link from "next/link";
import { useState } from "react";

const fieldClass =
  "w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] px-4 py-3 text-[#1a1c1c] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]";

const labelClass = "auth-label text-[#1a1c1c]";

export default function ApplicantSignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] px-4 pt-6 text-[#0b1c30] sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.84),rgba(0,56,168,0.54))]" />
      <main className="relative z-10 flex flex-1 items-center justify-center py-10 lg:py-12">
        <section className="grid w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-lg border border-white/40 bg-white/92 shadow-[0_24px_60px_rgba(4,15,37,0.30)] backdrop-blur-sm md:grid-cols-12">
          <aside className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(0,37,118,0.95),rgba(0,56,168,0.86))] p-6 text-white sm:p-8 md:col-span-4 lg:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <h1 className="auth-hero-title mb-4 sm:text-[2.25rem]">
                  Empowering Your Career
                </h1>
                <p className="auth-hero-copy mb-8 text-[#c7d7ff] sm:text-[1.0625rem]">
                  Register today to access specialized competency assessments and advance your professional journey
                  with TESDA certification.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <i aria-hidden="true" className="fa-solid fa-circle-check mt-1 text-[18px] text-[#dce7ff]" />
                    <div>
                      <h2 className="auth-label">Official Certification</h2>
                      <p className="auth-help-text mt-1 text-white/80">
                        Recognized standards for technical excellence and professional readiness.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <i aria-hidden="true" className="fa-solid fa-gauge-high mt-1 text-[18px] text-[#dce7ff]" />
                    <div>
                      <h2 className="auth-label">Efficient Process</h2>
                      <p className="auth-help-text mt-1 text-white/80">
                        Streamlined application details for assessment processing and monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="auth-help-text italic text-white/90">
                  &quot;The E-Assess platform made my application easier to prepare and track.&quot;
                </p>
                <p className="mt-2 text-xs font-bold leading-[1.4] text-white">Maria C., Applicant</p>
              </div>
            </div>

            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#0038a8] opacity-50" />
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#96adff] opacity-20 blur-3xl" />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center opacity-18 mix-blend-screen"
            />
          </aside>

          <div className="bg-white/92 p-6 sm:p-8 md:col-span-8 lg:p-12">
            <div className="mb-8">
              <span className="inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[12px] font-bold text-[#3056c4]">
                Applicant Registration
              </span>
              <h2 className="auth-panel-title mb-2 text-[#002576] sm:text-[1.875rem]">
                Create Applicant Account
              </h2>
              <p className="auth-panel-copy text-[#444653]">
                Fill in your details to start your assessment journey.
              </p>
            </div>

            <form action="#" className="space-y-6" method="POST">
              <section className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Basic Information</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">Provide your primary contact details for application updates.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="first-name">
                      First Name
                    </label>
                    <input
                      className={fieldClass}
                      id="first-name"
                      name="firstName"
                      placeholder="Juan"
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="surname">
                      Surname
                    </label>
                    <input
                      className={fieldClass}
                      id="surname"
                      name="surname"
                      placeholder="Dela Cruz"
                      required
                      type="text"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="middle-name">
                      Middle Name
                    </label>
                    <input
                      className={fieldClass}
                      id="middle-name"
                      name="middleName"
                      placeholder="Santos"
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="contact-number">
                      Contact Number
                    </label>
                    <div className="flex">
                      <span className="auth-help-text flex items-center justify-center rounded-l-lg border border-r-0 border-[#c4c5d5] bg-[#e5eeff] px-3 font-semibold text-[#444653]">
                        +63
                      </span>
                      <input
                        className="w-full rounded-r-lg border border-[#c4c5d5] bg-[#f9f9f9] px-4 py-3 text-[#1a1c1c] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                        id="contact-number"
                        name="contactNumber"
                        placeholder="912 345 6789"
                        required
                        type="tel"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="email">
                      Email Address
                    </label>
                    <input
                      className={fieldClass}
                      id="email"
                      name="email"
                      placeholder="juan.dc@email.com"
                      required
                      type="email"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#d9e3f7] bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Account Security</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">Create a secure password for your application account.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PasswordField
                    id="password"
                    label="Password"
                    name="password"
                    show={showPassword}
                    toggle={() => setShowPassword((value) => !value)}
                  />
                  <PasswordField
                    id="confirm-password"
                    label="Confirm Password"
                    name="confirmPassword"
                    show={showConfirmPassword}
                    toggle={() => setShowConfirmPassword((value) => !value)}
                  />
                </div>
              </section>

              <button
                className="auth-button flex w-full items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-4 text-white shadow-sm transition-all hover:bg-[#002576] hover:shadow-md active:scale-[0.98]"
                type="submit"
              >
                Create Account
              </button>

              <p className="auth-label text-center text-[#444653]">
                Already have an account?{" "}
                <Link className="font-bold text-[#002576] hover:underline" href="/">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto -mx-4 border-t border-white/15 bg-[#07245f]/78 px-6 py-6 backdrop-blur-sm sm:-mx-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center text-center">
          <span className="auth-footer-copy text-[#d9e7ff]">(c) 2024 TESDA E-Assess Eastern Samar Office. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function PasswordField({
  id,
  label,
  name,
  show,
  toggle,
}: {
  id: string;
  label: string;
  name: string;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          className={`${fieldClass} pr-10`}
          id={id}
          name={name}
          placeholder="********"
          required
          type={show ? "text" : "password"}
        />
        <button
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#747685] transition-colors hover:text-[#1a1c1c]"
          onClick={toggle}
          type="button"
        >
          <i aria-hidden="true" className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"} text-sm`} />
        </button>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const fieldClass =
  "w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[15px] leading-[1.5] text-[#1a1c1c] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]";

const labelClass = "text-[14px] font-semibold leading-[1.25] text-[#1a1c1c]";

export default function ApplicantSignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff] text-[#0b1c30]">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
        <section className="grid w-full max-w-[1000px] grid-cols-1 overflow-hidden rounded-xl border border-[#c4c5d5] bg-white shadow-[0_20px_45px_rgba(9,18,33,0.10)] md:grid-cols-12">
          <aside className="relative overflow-hidden bg-[#002576] p-6 text-white sm:p-8 md:col-span-5 lg:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <h1 className="mb-4 text-[32px] font-bold leading-[1.2] sm:text-[36px]">
                  Empowering Your Career
                </h1>
                <p className="mb-8 text-[16px] leading-[1.65] text-[#b6c4ff] sm:text-[17px]">
                  Register today to access specialized competency assessments and advance your professional journey
                  with TESDA certification.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <i aria-hidden="true" className="fa-solid fa-circle-check mt-1 text-[18px] text-[#b6c4ff]" />
                    <div>
                      <h2 className="text-[14px] font-bold leading-[1.3]">Official Certification</h2>
                      <p className="mt-1 text-[13px] leading-[1.5] text-white/80">
                        Recognized standards for technical excellence and professional readiness.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <i aria-hidden="true" className="fa-solid fa-gauge-high mt-1 text-[18px] text-[#b6c4ff]" />
                    <div>
                      <h2 className="text-[14px] font-bold leading-[1.3]">Efficient Process</h2>
                      <p className="mt-1 text-[13px] leading-[1.5] text-white/80">
                        Streamlined application details for assessment processing and monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="text-[13px] font-medium italic leading-[1.5] text-white/90">
                  &quot;The E-Assess platform made my application easier to prepare and track.&quot;
                </p>
                <p className="mt-2 text-[12px] font-bold leading-[1.4] text-white">Maria C., Applicant</p>
              </div>
            </div>

            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#0038a8] opacity-50" />
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#96adff] opacity-20 blur-3xl" />
          </aside>

          <div className="p-6 sm:p-8 md:col-span-7 lg:p-12">
            <div className="mb-8">
              <h2 className="mb-2 text-[28px] font-semibold leading-[1.25] text-[#002576] sm:text-[30px]">
                Create Applicant Account
              </h2>
              <p className="text-[15px] leading-[1.5] text-[#444653]">
                Fill in your details to start your assessment journey.
              </p>
            </div>

            <form action="#" className="space-y-6" method="POST">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="full-name">
                    Full Name
                  </label>
                  <input
                    className={fieldClass}
                    id="full-name"
                    name="fullName"
                    placeholder="Juan Dela Cruz"
                    required
                    type="text"
                  />
                </div>

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="contact-number">
                    Contact Number
                  </label>
                  <div className="flex">
                    <span className="flex items-center justify-center rounded-l-lg border border-r-0 border-[#c4c5d5] bg-[#e5eeff] px-3 text-[13px] font-semibold text-[#444653]">
                      +63
                    </span>
                    <input
                      className="w-full rounded-r-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[15px] leading-[1.5] text-[#1a1c1c] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                      id="contact-number"
                      name="contactNumber"
                      placeholder="912 345 6789"
                      required
                      type="tel"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="qualification">
                    Desired Qualification
                  </label>
                  <div className="relative">
                    <select
                      className={`${fieldClass} appearance-none pr-10`}
                      defaultValue=""
                      id="qualification"
                      name="qualification"
                      required
                    >
                      <option disabled value="">
                        Select an assessment
                      </option>
                      <option>Information Technology NC III</option>
                      <option>Cookery NC II</option>
                      <option>Electrical Installation Maintenance NC II</option>
                      <option>Visual Graphic Design NC III</option>
                      <option>Shielded Metal Arc Welding NC I</option>
                    </select>
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#747685]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass} htmlFor="address">
                  Home Address
                </label>
                <textarea
                  className={`${fieldClass} min-h-20 resize-none`}
                  id="address"
                  name="address"
                  placeholder="Street, Barangay, City/Municipality, Province"
                  required
                  rows={2}
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  className="mt-0.5 h-4 w-4 rounded border-[#c4c5d5] text-[#002576] focus:ring-[#3056c4]"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                />
                <label className="text-[12px] font-semibold leading-[1.45] text-[#444653]" htmlFor="terms">
                  I agree to the{" "}
                  <Link className="text-[#002576] hover:underline" href="#">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link className="text-[#002576] hover:underline" href="#">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-4 text-[15px] font-semibold leading-none text-white shadow-sm transition-all hover:bg-[#002576] hover:shadow-md active:scale-[0.98]"
                type="submit"
              >
                <i aria-hidden="true" className="fa-solid fa-user-plus text-[14px]" />
                Create Applicant Account
              </button>

              <p className="text-center text-[14px] font-semibold leading-[1.5] text-[#444653]">
                Already have an account?{" "}
                <Link className="font-bold text-[#002576] hover:underline" href="/">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c4c5d5] bg-[#e5eeff] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <Image
              alt="TESDA Philippines"
              className="h-8 w-auto opacity-75 grayscale"
              height={32}
              src="/tesda-logo.png"
              width={32}
            />
            <span className="text-[12px] font-semibold leading-[1.4] text-[#444653]">
              (c) 2024 Technical Education and Skills Development Authority. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link className="text-[12px] font-semibold text-[#444653] transition-colors hover:text-[#002576]" href="#">
              Privacy Statement
            </Link>
            <Link className="text-[12px] font-semibold text-[#444653] transition-colors hover:text-[#002576]" href="#">
              Accessibility
            </Link>
            <Link className="text-[12px] font-semibold text-[#444653] transition-colors hover:text-[#002576]" href="#">
              Contact Us
            </Link>
          </div>
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
          <i aria-hidden="true" className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"} text-[14px]`} />
        </button>
      </div>
    </div>
  );
}

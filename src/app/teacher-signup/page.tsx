"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationModal from "@/components/notifications/NotificationModal";
import { sanitizePhilippineMobileNumberAfterCountryCode } from "@/lib/registration";

const labelClass = "auth-label px-1 text-[#1a1c1c]";
const fieldClass =
  "auth-field";

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

export default function TeacherSignUpPage() {
  const [contactNumber, setContactNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocumentName, setSelectedDocumentName] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const institutionType =
      new URLSearchParams(window.location.search).get("institutionType")?.toLowerCase() === "private"
        ? "private"
        : "public";
    formData.set("institutionType", institutionType);

    try {
      const response = await fetch("/api/sign-up/teacher", {
        body: formData,
        method: "POST",
      });
      const result = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Unable to create the teacher account.");
        return;
      }

      setSuccessMessage(
        result.message ??
          "Teacher account created successfully. Your login will stay blocked until the admin approves your verification request.",
      );
      event.currentTarget.reset();
      setContactNumber("");
      setSelectedDocumentName("");
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] px-4 pt-6 text-[#0b1c30] sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.82),rgba(0,56,168,0.54))]" />
      <main className="auth-page-main">
        <div className="auth-split-surface flex flex-col md:flex-row">
          <div className="auth-side-pane hidden bg-[linear-gradient(180deg,rgba(0,37,118,0.95),rgba(0,56,168,0.86))] text-white md:flex md:w-4/12 md:flex-col md:justify-between">
            <div className="relative z-10">
              <div className="mb-6">
                <svg
                  aria-hidden
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Zm4 3.2V16c0 .6 2.2 2 5 2s5-1.4 5-2v-3.3"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <h1 className="auth-hero-title mb-4 text-white">Empower the Future of Skills.</h1>
              <p className="auth-hero-copy text-[#c7d7ff]">
                Join our network of certified assessors and educators in streamlining the
                technical-vocational assessment process across the Philippines.
              </p>
            </div>
            <div className="relative z-10 mt-8 rounded-lg border border-white/18 bg-white/10 p-4 backdrop-blur-sm">
              <p className="auth-help-text italic text-[#e2ebff]">
                &quot;Our mission is to ensure every trainee is assessed with integrity and precision,
                providing a clear pathway to professional certification.&quot;
              </p>
            </div>
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 1) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center opacity-22 mix-blend-screen"
            />
          </div>

          <div className="auth-form-pane max-h-[870px] w-full overflow-y-auto md:w-8/12">
            <div className="auth-panel-header">
              <span className="auth-pill inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[#3056c4]">
                Teacher Registration
              </span>
              <h2 className="auth-panel-title mb-2 text-[#002576]">Teacher Sign Up</h2>
              <p className="auth-panel-copy text-[#444653]">
                Create your professional account to begin managing assessments.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <section className="auth-section auth-section-soft">
                <div className="mb-4">
                  <h3 className="auth-section-title">Basic Information</h3>
                  <p className="auth-section-copy">Use your active professional and institutional details.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="first-name">
                      First Name
                    </label>
                    <input className={fieldClass} id="first-name" name="firstName" placeholder="Juan" required type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="surname">
                      Surname
                    </label>
                    <input className={fieldClass} id="surname" name="surname" placeholder="Dela Cruz" required type="text" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="middle-name">
                      Middle Name
                    </label>
                    <input className={fieldClass} id="middle-name" name="middleName" placeholder="Santos" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass} htmlFor="contact-number">
                      Contact Number
                    </label>
                    <div className="flex">
                      <span className="auth-field-prefix">
                        +63
                      </span>
                      <input
                        className={`${fieldClass} auth-field-suffixless`}
                        id="contact-number"
                        inputMode="numeric"
                        maxLength={10}
                        name="contactNumber"
                        onChange={(event) =>
                          setContactNumber(sanitizePhilippineMobileNumberAfterCountryCode(event.target.value))
                        }
                        pattern="9[0-9]{9}"
                        placeholder="900 000 0000"
                        required
                        type="tel"
                        value={contactNumber}
                      />
                    </div>
                    <p className="text-[12px] text-[#747685]">Enter 10 mobile digits after +63, for example `9123456789`.</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass} htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className={fieldClass}
                    id="email"
                    name="email"
                    placeholder="juan.delacruz@institution.edu.ph"
                    required
                    type="email"
                  />
                </div>
              </section>

              <section className="auth-section bg-white">
                <div className="mb-4">
                  <h3 className="auth-section-title">Institution Details</h3>
                  <p className="auth-section-copy">These details will be used during verification and dashboard setup.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="school-name">
                    School / Institution
                  </label>
                  <input
                    className={fieldClass}
                    id="school-name"
                    name="schoolName"
                    placeholder="Enter name of your school or TESDA center"
                    required
                    type="text"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass} htmlFor="position-title">
                    Position / Role
                  </label>
                  <input
                    className={fieldClass}
                    id="position-title"
                    name="positionTitle"
                    placeholder="e.g. Lead Instructor"
                    required
                    type="text"
                  />
                </div>
              </section>

              <section className="auth-section bg-white">
                <div className="mb-4">
                  <h3 className="auth-section-title">Verification Document</h3>
                  <p className="auth-section-copy">Upload a valid PRC ID or school-issued ID for account review.</p>
                </div>

                <div className="group flex flex-col gap-2 rounded-lg border-2 border-dashed border-[#c4c5d5] bg-[#f9f9f9] p-4 transition-all hover:border-[#3056c4]">
                  <label className="flex cursor-pointer flex-col items-center gap-2 py-4 text-center text-[#444653]">
                    <svg
                      aria-hidden
                      className="h-8 w-8 text-[#747685] transition group-hover:text-[#002576]"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 3H7a2 2 0 0 0-2 2v14h14V10m-5-7 5 5m-5-5v5h5M12 17v-5m0 0-2 2m2-2 2 2"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                    <span className="auth-panel-copy">Upload PRC ID or Teacher&apos;s School ID</span>
                    <span className="text-xs text-[#747685]">Supported: PDF, JPG, PNG (Max 5MB)</span>
                    <input
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      name="verificationDocument"
                      onChange={(event) => setSelectedDocumentName(event.target.files?.[0]?.name ?? "")}
                      required
                      type="file"
                    />
                    {selectedDocumentName ? (
                      <span className="mt-2 rounded-full bg-[#eef3ff] px-3 py-1 text-[12px] font-semibold text-[#3056c4]">
                        {selectedDocumentName}
                      </span>
                    ) : null}
                  </label>
                </div>
              </section>

              <section className="auth-section bg-white">
                <div className="mb-4">
                  <h3 className="auth-section-title">Account Security</h3>
                  <p className="auth-section-copy">Choose a password you can remember and keep secure.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="auth-note flex items-start gap-4">
                <span className="text-[#5d5f5f]">i</span>
                <p className="auth-help-text text-[#616363]">
                  Your teacher account request will be saved immediately, but login access stays locked until an admin
                  approves your uploaded credentials. Please ensure all uploaded documents are clear and valid.
                </p>
              </div>

              {errorMessage ? (
                <NotificationBanner compact message={errorMessage} variant="error" />
              ) : null}

              <div className="space-y-4 pt-2">
                <button
                  className="auth-primary-action auth-button flex w-full"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
                <div className="text-center">
                  <p className="auth-label text-[#444653]">
                    Already have an account?{" "}
                    <Link className="font-bold text-[#002576] hover:underline" href="/">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto -mx-4 border-t border-white/15 bg-[#07245f]/78 px-6 py-6 backdrop-blur-sm sm:-mx-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center text-center">
          <span className="auth-footer-copy text-[#d9e7ff]">(c) 2024 TESDA E-Assess Eastern Samar Office. All rights reserved.</span>
        </div>
      </footer>

      <NotificationModal
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              className="auth-secondary-action min-w-[140px]"
              onClick={() => setSuccessMessage("")}
              type="button"
            >
              Stay Here
            </button>
            <Link
              className="auth-primary-action min-w-[140px] bg-[#002576] px-4 hover:bg-[#0038a8]"
              href="/"
            >
              Back to Login
            </Link>
          </div>
        }
        description="You can return to the login page now, but access will only open after admin approval."
        message={successMessage}
        open={Boolean(successMessage)}
        onClose={() => setSuccessMessage("")}
        title="Request Submitted"
        variant="success"
      />
    </div>
  );
}

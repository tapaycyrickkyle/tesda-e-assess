"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationModal from "@/components/notifications/NotificationModal";
import { sanitizePhilippineMobileNumberAfterCountryCode } from "@/lib/registration";

const fieldClass =
  "auth-field";

const labelClass = "auth-label text-[#1a1c1c]";

export default function ApplicantSignUpPage() {
  const [contactNumber, setContactNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      contactNumber: String(formData.get("contactNumber") ?? ""),
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      middleName: String(formData.get("middleName") ?? ""),
      nameExtension: String(formData.get("nameExtension") ?? ""),
      password: String(formData.get("password") ?? ""),
      surname: String(formData.get("surname") ?? ""),
    };

    try {
      const response = await fetch("/api/sign-up/applicant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Unable to create the applicant account.");
        return;
      }

      setSuccessMessage(result.message ?? "Applicant account created successfully.");
      event.currentTarget.reset();
      setContactNumber("");
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
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.84),rgba(0,56,168,0.54))]" />
      <main className="auth-page-main">
        <section className="auth-split-surface grid grid-cols-1 md:grid-cols-12">
          <aside className="auth-side-pane bg-[linear-gradient(180deg,rgba(0,37,118,0.95),rgba(0,56,168,0.86))] text-white md:col-span-4">
            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <h1 className="auth-hero-title mb-4">
                  Empowering Your Career
                </h1>
                <p className="auth-hero-copy mb-6 text-[#c7d7ff]">
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
                <p className="mt-2 text-[12px] font-bold leading-[1.4] text-white">Maria C., Applicant</p>
              </div>
            </div>

            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#0038a8] opacity-50" />
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#96adff] opacity-20 blur-3xl" />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center opacity-18 mix-blend-screen"
            />
          </aside>

          <div className="auth-form-pane md:col-span-8">
            <div className="auth-panel-header">
              <span className="auth-pill inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[#3056c4]">
                Applicant Registration
              </span>
              <h2 className="auth-panel-title mb-2 text-[#002576]">
                Create Applicant Account
              </h2>
              <p className="auth-panel-copy text-[#444653]">
                Fill in your details to start your assessment journey.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <section className="auth-section auth-section-soft">
                <div className="mb-4">
                  <h3 className="auth-section-title">Basic Information</h3>
                  <p className="auth-section-copy">Provide your primary contact details for application updates.</p>
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

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                    <label className={labelClass} htmlFor="name-extension">
                      Name Extension
                    </label>
                    <input
                      className={fieldClass}
                      id="name-extension"
                      name="nameExtension"
                      placeholder="Jr., Sr., III"
                      type="text"
                    />
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
                        placeholder="912 345 6789"
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
                    placeholder="juan.dc@email.com"
                    required
                    type="email"
                  />
                </div>
              </section>

              <section className="auth-section bg-white">
                <div className="mb-4">
                  <h3 className="auth-section-title">Account Security</h3>
                  <p className="auth-section-copy">Create a secure password for your application account.</p>
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

              {errorMessage ? (
                <NotificationBanner compact message={errorMessage} variant="error" />
              ) : null}

              <button
                className="auth-primary-action auth-button flex w-full px-4"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
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
        description="Your applicant account is ready. You can return to the login page and sign in now."
        message={successMessage}
        open={Boolean(successMessage)}
        onClose={() => setSuccessMessage("")}
        title="Account Created"
        variant="success"
      />
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

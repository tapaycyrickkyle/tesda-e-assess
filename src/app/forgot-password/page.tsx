"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { parseApiResponse } from "@/lib/api-response";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password/recovery", {
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = await parseApiResponse<{ message?: string; success?: boolean }>(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to send the password reset email.");
      }

      setSuccessMessage(
        payload.message ??
          "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send the password reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] text-[#1a1c1c]">
      <div aria-hidden="true" className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.82),rgba(0,56,168,0.58))]" />

      <main className="auth-page-main">
        <div className="auth-surface max-w-[440px]">
          <div className="text-center">
            <h1 className="auth-panel-title text-[#24364c]">Forgot Password</h1>
            <p className="auth-panel-copy mt-2 text-[#5d5f5f]">
              Enter your account email and we&apos;ll send you a password reset link.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {errorMessage ? <NotificationBanner compact message={errorMessage} variant="error" /> : null}
            {successMessage ? <NotificationBanner compact message={successMessage} variant="success" /> : null}

            <label className="block">
              <span className="auth-label mb-2 block text-[#0b1c30]">Email Address</span>
              <input
                className="auth-field"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                required
                type="email"
                value={email}
              />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                className="auth-secondary-action px-4"
                href="/"
              >
                Back to Login
              </Link>
              <button
                className="auth-primary-action px-5"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

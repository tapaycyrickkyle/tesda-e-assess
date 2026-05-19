"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function getHashSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      setIsInitializing(true);
      setErrorMessage("");
      setInfoMessage("");

      try {
        const code = searchParams.get("code")?.trim() ?? "";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/reset-password");
          }

          if (isMounted) {
            setIsReady(true);
            setInfoMessage("Your password reset link was verified. Enter a new password below.");
          }

          return;
        }

        const hashSession = getHashSession();

        if (hashSession) {
          const { error } = await supabase.auth.setSession(hashSession);

          if (error) {
            throw error;
          }

          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/reset-password");
          }

          if (isMounted) {
            setIsReady(true);
            setInfoMessage("Your password reset link was verified. Enter a new password below.");
          }

          return;
        }

        if (isMounted) {
          setErrorMessage("This password reset link is invalid or expired. Request a new one to continue.");
        }
      } catch {
        if (isMounted) {
          setErrorMessage("This password reset link is invalid or expired. Request a new one to continue.");
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void initializeRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [searchParams, supabase.auth]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSuccessMessage("Your password was updated successfully. You can now sign in with the new password.");
      setInfoMessage("");
      setIsReady(false);
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/");
      }, 1400);
    } catch {
      setErrorMessage("Unable to update your password right now. Please request a new reset link and try again.");
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
            <h1 className="auth-hero-title text-[#0b1c30]">Reset Password</h1>
            <p className="auth-panel-copy mt-2 text-[#5d5f5f]">
              Set a new password for your TESDA E-Assess account.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {errorMessage ? <NotificationBanner compact message={errorMessage} variant="error" /> : null}
            {infoMessage ? <NotificationBanner compact message={infoMessage} variant="info" /> : null}
            {successMessage ? <NotificationBanner compact message={successMessage} variant="success" /> : null}
          </div>

          {isReady ? (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="auth-label mb-2 block text-[#0b1c30]">New Password</span>
                <input
                  className="auth-field"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter at least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </label>

              <label className="block">
                <span className="auth-label mb-2 block text-[#0b1c30]">Confirm New Password</span>
                <input
                  className="auth-field"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  required
                  type="password"
                  value={confirmPassword}
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
                  disabled={isSubmitting || isInitializing}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : "Save New Password"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                className="auth-secondary-action px-4"
                href="/forgot-password"
              >
                Request New Link
              </Link>
              <Link
                className="auth-primary-action px-5"
                href="/"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

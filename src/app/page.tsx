"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationModal from "@/components/notifications/NotificationModal";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTeacherPendingMessage = errorMessage.toLowerCase().includes("pending admin approval");
  const isTeacherRejectedMessage = errorMessage.toLowerCase().includes("rejected during verification");
  const showTeacherStatusModal = isTeacherPendingMessage || isTeacherRejectedMessage;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      const payload = (await response.json()) as { success: boolean; message?: string; redirectTo?: string };

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Login failed. Please try again.");
        return;
      }

      router.replace(payload.redirectTo ?? "/");
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] text-[#1a1c1c]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.82),rgba(0,56,168,0.58))]" />
      <main className="z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-[440px] flex-col items-center">
          <div className="mb-5 text-center sm:mb-10">
            <h1 className="auth-hero-title mb-1 text-white">
              TESDA E-Forms
            </h1>
            <p className="auth-hero-copy mx-auto max-w-[320px] text-[#e2ebff]">
              Application Form System for TESDA Eastern Samar Provincial Office
            </p>
          </div>

          <div className="w-full rounded-lg border border-white/45 bg-white/94 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.14)] backdrop-blur-sm sm:p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="auth-label text-[#1a1c1c]" htmlFor="username">
                Email Address
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-user text-sm leading-none text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                </span>
                <input
                  suppressHydrationWarning
                  className="auth-input w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                  id="username"
                  name="email"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your email address"
                  required
                  type="email"
                  value={username}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="auth-label text-[#1a1c1c]" htmlFor="password">
                  Password
                </label>
                <Link className="auth-label cursor-pointer text-[#002576] hover:underline" href="#">
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-lock text-sm leading-none text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                </span>
                <input
                  suppressHydrationWarning
                  className="auth-input w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] py-3 pl-10 pr-10 outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                  id="password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  suppressHydrationWarning
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-[#747685] transition-colors hover:text-[#1a1c1c]"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  <i
                    aria-hidden="true"
                    className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm leading-none`}
                  />
                </button>
              </div>
            </div>

            <button
              suppressHydrationWarning
              className="auth-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0038a8] py-4 tracking-[0.02em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all hover:bg-[#002576] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            {errorMessage ? (
              !showTeacherStatusModal ? (
                <div className="rounded-[10px] border border-[#f3d6d6] bg-[#fff6f6] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#93000a] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                      <i aria-hidden="true" className="fa-solid fa-circle-exclamation text-[13px]" />
                    </div>
                    <p className="text-[14px] font-medium leading-[1.45] text-[#93000a]">{errorMessage}</p>
                  </div>
                </div>
              ) : null
            ) : null}

            <div className="pt-1">
              <p className="auth-help-text mb-2 text-center text-[#5d5f5f]">
                Don&apos;t have an account?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/applicant-signup"
                className="auth-label flex w-full items-center justify-center gap-2 rounded-lg border border-[#d9e3f7] bg-white py-3 text-[#444653] transition hover:border-[#0038a8] hover:bg-[#eef3ff] hover:text-[#0038a8] active:border-[#0038a8] active:text-[#0038a8]"
              >
                <i aria-hidden="true" className="fa-solid fa-user-plus text-[0.8125rem]" />
                Sign Up as Applicant
              </Link>
              <Link
                href="/teacher-type"
                className="auth-label flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d9e3f7] bg-white py-3 text-[#444653] transition hover:border-[#0038a8] hover:bg-[#eef3ff] hover:text-[#0038a8] active:border-[#0038a8] active:text-[#0038a8]"
              >
                <i aria-hidden="true" className="fa-solid fa-chalkboard-user text-[0.8125rem]" />
                Sign Up as Teacher
              </Link>
            </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-white/15 bg-[#07245f]/78 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center text-center">
          <span className="auth-footer-copy text-[#d9e7ff]">(c) 2024 TESDA E-Assess Eastern Samar Office. All rights reserved.</span>
        </div>
      </footer>

      <AnimatedModal
        contentClassName="w-full max-w-[360px] rounded-[12px] border border-[#d9e3f7] bg-white px-6 py-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isSubmitting}
      >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[20px]" />
            </div>
            <p className="mt-4 text-[18px] font-bold text-[#0b1c30]">Signing you in</p>
            <p className="mt-2 text-[13px] leading-[1.55] text-[#5d5f5f]">
              Please wait while we verify your account and prepare your dashboard.
            </p>
      </AnimatedModal>

      <NotificationModal
        actions={
          <div className="flex justify-center">
            <button
              className="inline-flex min-h-[40px] min-w-[104px] items-center justify-center rounded-lg bg-[#002576] px-4 text-[13px] font-bold text-white transition hover:bg-[#0038a8]"
              onClick={() => setErrorMessage("")}
              type="button"
            >
              Okay
            </button>
          </div>
        }
        description={
          isTeacherPendingMessage
            ? "Please wait for the admin to review your uploaded credential file before trying again."
            : "If needed, contact the admin and prepare an updated credential file before registering again."
        }
        message={errorMessage}
        open={showTeacherStatusModal}
        onClose={() => setErrorMessage("")}
        title={isTeacherPendingMessage ? "Teacher Approval Pending" : "Teacher Approval Rejected"}
        variant={isTeacherPendingMessage ? "warning" : "error"}
      />

    </div>
  );
}

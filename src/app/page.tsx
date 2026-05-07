"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Login failed. Please try again.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your credentials"
                  required
                  type="text"
                  value={username}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-semibold leading-[1.2] text-[#1a1c1c]" htmlFor="password">
                  Password
                </label>
                <Link className="cursor-pointer text-[14px] font-semibold leading-[1.5] text-[#002576] hover:underline" href="#">
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-[#747685] transition-colors hover:text-[#1a1c1c]"
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
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#002576] py-4 text-[16px] font-semibold leading-none tracking-[0.02em] text-white shadow-sm transition-all hover:bg-[#0038a8] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            {errorMessage ? (
              <p className="rounded-lg border border-[#f0b4b4] bg-[#fff5f5] px-3 py-2 text-center text-[13px] text-[#8a1f1f]">
                {errorMessage}
              </p>
            ) : null}

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
              <Link
                href="/teacher-type"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#c4c5d5] bg-white py-3 text-[14px] font-semibold text-[#444653] transition hover:border-[#0038a8] hover:bg-[#eef3ff] hover:text-[#0038a8] active:border-[#0038a8] active:text-[#0038a8]"
              >
                <i aria-hidden="true" className="fa-solid fa-chalkboard-user text-[13px]" />
                Sign Up as Teacher
              </Link>
            </div>
          </form>

        </div>

        <div className="mt-8 space-y-1 text-center opacity-70">
          <p className="text-[14px] leading-[1.5] text-[#444653]">
            (c) 2024 TESDA E-Forms Portal. All rights reserved.
          </p>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 right-0 p-12 opacity-[0.03]">
        <i aria-hidden="true" className="fa-solid fa-building-columns text-[220px] leading-none text-[#1a1c1c]" />
      </div>
    </div>
  );
}

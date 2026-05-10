import Link from "next/link";

const labelClass = "auth-label px-1 text-[#1a1c1c]";
const fieldClass =
  "w-full rounded-lg border border-[#c4c5d5] bg-[#f9f9f9] px-4 py-3 outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]";

export default function TeacherSignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] px-4 pt-6 text-[#0b1c30] sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.82),rgba(0,56,168,0.54))]" />
      <main className="relative z-10 flex flex-1 items-center justify-center py-10 lg:py-12">
        <div className="flex w-full max-w-[1180px] flex-col overflow-hidden rounded-lg border border-white/40 bg-white/92 shadow-[0_24px_60px_rgba(4,15,37,0.28)] backdrop-blur-sm md:flex-row">
          <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,rgba(0,37,118,0.95),rgba(0,56,168,0.86))] p-8 text-white md:flex md:w-4/12 md:flex-col md:justify-between">
            <div className="relative z-10">
              <div className="mb-8">
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
              <h1 className="auth-hero-title mb-4 text-white sm:text-[2.25rem]">
                Empower the Future of Skills.
              </h1>
              <p className="auth-hero-copy text-[#c7d7ff] sm:text-[1.0625rem]">
                Join our network of certified assessors and educators in streamlining the
                technical-vocational assessment process across the Philippines.
              </p>
            </div>
            <div className="relative z-10 mt-8 rounded-lg border border-white/18 bg-white/10 p-6 backdrop-blur-sm">
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

          <div className="max-h-[870px] w-full overflow-y-auto bg-white/92 p-8 md:w-8/12">
            <div className="mb-8">
              <span className="inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[12px] font-bold text-[#3056c4]">
                Teacher Registration
              </span>
              <h2 className="auth-panel-title mb-2 text-[#002576] sm:text-[1.875rem]">
                Teacher Sign Up
              </h2>
              <p className="auth-panel-copy text-[#444653]">
                Create your professional account to begin managing assessments.
              </p>
            </div>

            <form className="space-y-6">
              <section className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Basic Information</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">Use your active professional and institutional details.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>First Name</label>
                    <input className={fieldClass} placeholder="Juan" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Surname</label>
                    <input className={fieldClass} placeholder="Dela Cruz" type="text" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Middle Name</label>
                    <input className={fieldClass} placeholder="Santos" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Contact Number</label>
                    <div className="flex">
                      <span className="auth-help-text flex items-center justify-center rounded-l-lg border border-r-0 border-[#c4c5d5] bg-[#e5eeff] px-3 font-semibold text-[#444653]">
                        +63
                      </span>
                      <input
                        className="w-full rounded-r-lg border border-[#c4c5d5] bg-[#f9f9f9] px-4 py-3 text-[#1a1c1c] outline-none transition-all placeholder:text-[#747685] focus:border-[#3056c4] focus:ring-1 focus:ring-[#3056c4]"
                        placeholder="900 000 0000"
                        type="tel"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass}>Email Address</label>
                  <input className={fieldClass} placeholder="juan.delacruz@institution.edu.ph" type="email" />
                </div>
              </section>

              <section className="rounded-lg border border-[#d9e3f7] bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Institution Details</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">These details will be used during verification and dashboard setup.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>School / Institution</label>
                  <input className={fieldClass} placeholder="Enter name of your school or TESDA center" type="text" />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass}>Position / Role</label>
                  <input className={fieldClass} placeholder="e.g. Lead Instructor" type="text" />
                </div>
              </section>

              <section className="rounded-lg border border-[#d9e3f7] bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Verification Document</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">Upload a valid PRC ID or school-issued ID for account review.</p>
                </div>

                <div className="group flex flex-col gap-2 rounded-lg border-2 border-dashed border-[#c4c5d5] bg-[#f9f9f9] p-6 transition-all hover:border-[#3056c4]">
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
                  <input className="hidden" type="file" />
                  </label>
                </div>
              </section>

              <section className="rounded-lg border border-[#d9e3f7] bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-[16px] font-bold text-[#0b1c30]">Account Security</h3>
                  <p className="mt-1 text-[13px] text-[#5d5f5f]">Choose a password you can remember and keep secure.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Password</label>
                    <input className={fieldClass} placeholder="********" type="password" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Confirm Password</label>
                    <input className={fieldClass} placeholder="********" type="password" />
                  </div>
                </div>
              </section>

              <div className="flex items-start gap-4 rounded-lg border border-[#dfe0e0] bg-[#dfe0e0]/30 p-4">
                <span className="text-[#5d5f5f]">i</span>
                <p className="auth-help-text text-[#616363]">
                  Your teacher account will be reviewed by the admin before you can access the
                  Teacher Dashboard. Please ensure all uploaded documents are clear and valid.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  className="auth-button flex w-full items-center justify-center gap-2 rounded-lg bg-[#0038a8] py-4 text-white shadow-sm transition-all hover:bg-[#002576] hover:shadow-md active:scale-[0.98]"
                  type="submit"
                >
                  Create Account
                </button>
                <div className="text-center">
                  <p className="auth-panel-copy text-[#444653]">
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
    </div>
  );
}

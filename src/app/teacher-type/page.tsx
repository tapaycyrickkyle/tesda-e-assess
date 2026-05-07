import Link from "next/link";

function BuildingPublicIcon() {
  return (
    <svg aria-hidden className="h-10 w-10" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 20h16M6 20V7h12v13M9 10h1M9 13h1M9 16h1M12 10h1M12 13h1M12 16h1M15 10h1M15 13h1M15 16h1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BuildingPrivateIcon() {
  return (
    <svg aria-hidden className="h-10 w-10" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 20h16M7 20V5h10v15M10 8h1M10 11h1M10 14h1M13 8h1M13 11h1M13 14h1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function TeacherTypePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] text-[#0b1c30]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.84),rgba(0,56,168,0.54))]" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-12 sm:px-6">
        <h1 className="auth-hero-title mb-2 text-center text-white sm:text-[3rem]">
          Choose Teacher Type
        </h1>
        <p className="auth-hero-copy mx-auto mb-10 max-w-2xl text-center text-[#d9e7ff] sm:text-[1.125rem]">
          Please select your institutional affiliation to customize your assessment dashboard and
          streamline your verification process.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            className="group relative flex min-h-[320px] flex-col items-center rounded-2xl border border-white/35 bg-white/14 p-8 text-center shadow-[0_18px_45px_rgba(4,15,37,0.24)] backdrop-blur-md transition hover:-translate-y-1 hover:border-white/55 hover:bg-white/20 hover:shadow-[0_22px_55px_rgba(4,15,37,0.30)]"
            href="/teacher-signup"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/20">
              <BuildingPublicIcon />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-white">Public Teacher</h2>
            <p className="mb-6 text-base leading-[1.6] text-[#e2ebff]">
              Instructors employed by government-funded institutions and public schools.
            </p>
            <div className="auth-pill mt-auto rounded-full border border-white/20 bg-white/16 px-4 py-2 text-white">
              Requires PRC ID verification
            </div>
          </Link>

          <Link
            className="group relative flex min-h-[320px] flex-col items-center rounded-2xl border border-white/35 bg-white/14 p-8 text-center shadow-[0_18px_45px_rgba(4,15,37,0.24)] backdrop-blur-md transition hover:-translate-y-1 hover:border-white/55 hover:bg-white/20 hover:shadow-[0_22px_55px_rgba(4,15,37,0.30)]"
            href="/teacher-signup"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/20">
              <BuildingPrivateIcon />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-white">Private Teacher</h2>
            <p className="mb-6 text-base leading-[1.6] text-[#e2ebff]">
              Instructors serving in private academic institutions or technical training centers.
            </p>
            <div className="auth-pill mt-auto rounded-full border border-white/20 bg-white/16 px-4 py-2 text-white">
              Requires School ID verification
            </div>
          </Link>
        </div>

        <div className="mt-8 mb-12 text-center">
          <Link
            className="auth-label inline-flex items-center rounded-full border border-white/25 bg-white/14 px-4 py-2 text-white shadow-[0_12px_30px_rgba(4,15,37,0.18)] backdrop-blur-sm transition hover:bg-white/22"
            href="/"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left mr-1" />
            Back to Login
          </Link>
        </div>
      </div>

      <footer className="relative z-10 w-full border-t border-white/15 bg-[#07245f]/78 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center text-center">
          <span className="auth-footer-copy text-[#d9e7ff]">(c) 2024 TESDA E-Assess Eastern Samar Office. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}

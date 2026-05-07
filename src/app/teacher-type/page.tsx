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
    <main className="min-h-screen bg-[#f3f4fa] px-4 py-12 text-[#0b1c30] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-[#0d2f86] sm:text-5xl">
          Choose Teacher Type
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-[1.6] text-[#444653] sm:text-lg">
          Please select your institutional affiliation to customize your assessment dashboard and
          streamline your verification process.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            className="group relative flex min-h-[320px] flex-col items-center rounded-xl border border-[#c4c5d5] bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,56,168,0.05)] transition hover:-translate-y-1 hover:border-[#0038a8] hover:shadow-[0_4px_20px_rgba(0,56,168,0.08)]"
            href="/teacher-signup"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#dce9ff] text-[#0d2f86]">
              <BuildingPublicIcon />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-[#0d2f86]">Public Teacher</h2>
            <p className="mb-6 text-base leading-[1.6] text-[#444653]">
              Instructors employed by government-funded institutions and public schools.
            </p>
            <div className="mt-auto rounded-full bg-[#eff4ff] px-4 py-2 text-sm font-medium text-[#444653]">
              Requires PRC ID verification
            </div>
          </Link>

          <Link
            className="group relative flex min-h-[320px] flex-col items-center rounded-xl border border-[#c4c5d5] bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,56,168,0.05)] transition hover:-translate-y-1 hover:border-[#0038a8] hover:shadow-[0_4px_20px_rgba(0,56,168,0.08)]"
            href="/teacher-signup"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#dce9ff] text-[#0d2f86]">
              <BuildingPrivateIcon />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-[#0d2f86]">Private Teacher</h2>
            <p className="mb-6 text-base leading-[1.6] text-[#444653]">
              Instructors serving in private academic institutions or technical training centers.
            </p>
            <div className="mt-auto rounded-full bg-[#eff4ff] px-4 py-2 text-sm font-medium text-[#444653]">
              Requires School ID verification
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link className="text-sm font-semibold text-[#0d2f86] hover:underline" href="/">
            <i aria-hidden="true" className="fa-solid fa-arrow-left mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

function BuildingPublicIcon() {
  return (
    <svg aria-hidden className="h-8 w-8" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden className="h-8 w-8" fill="none" viewBox="0 0 24 24">
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

type TeacherTypeCardProps = {
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
};

function TeacherTypeCard({
  description,
  href,
  icon,
  title,
}: TeacherTypeCardProps) {
  return (
    <Link
      className="group relative flex min-h-[228px] flex-col items-center justify-center overflow-hidden rounded-lg border border-[#c4c5d5] bg-white px-6 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#8eacf0] hover:bg-[#f8fbff] hover:shadow-md"
      href={href}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#002576]" />
      <div className="absolute right-4 top-4 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-bold text-[#3056c4] transition group-hover:bg-[#dfe9ff]">
        Select
      </div>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576] transition group-hover:bg-[#dfe9ff]">
        {icon}
      </div>

      <div className="mt-4">
        <h2 className="text-[30px] font-bold leading-[1.15] text-[#0038a8] sm:text-[34px]">{title}</h2>
        <p className="mt-2 max-w-[30ch] text-[14px] leading-[1.6] text-[#5d5f5f]">{description}</p>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-[#002576]">
        <span>Continue</span>
        <i aria-hidden="true" className="fa-solid fa-arrow-right text-[11px] transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function TeacherTypePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a2f7a] text-[#0b1c30]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/TESDA_Backgound.png')] bg-cover bg-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,74,0.82),rgba(0,56,168,0.58))]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 pt-6 pb-8 sm:px-6 lg:pt-8 lg:pb-10">
        <div className="mb-5">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#ffffff14] px-4 py-2 text-[14px] font-bold text-white transition hover:bg-[#ffffff22]"
            href="/"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
            Back to Login
          </Link>
        </div>

        <section className="flex flex-1 items-start justify-center">
          <div className="flex w-full flex-col items-center">
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-[2rem] font-bold leading-[1.1] text-white">
                Choose Teacher Type
              </h1>
              <p className="mt-2 text-[15px] leading-[1.6] text-[#d9e7ff]">
                Select the affiliation that matches your institution.
              </p>
            </div>

            <div className="mx-auto mt-5 grid w-full max-w-[920px] grid-cols-1 gap-5 lg:grid-cols-2">
              <TeacherTypeCard
                description="For TESDA centers, public schools, and government-funded institutions."
                href="/teacher-signup"
                icon={<BuildingPublicIcon />}
                title="Public Teacher"
              />

              <TeacherTypeCard
                description="For private schools, academic institutions, and technical training centers."
                href="/teacher-signup"
                icon={<BuildingPrivateIcon />}
                title="Private Teacher"
              />
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 w-full border-t border-white/15 bg-[#07245f]/78 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center text-center">
          <span className="auth-footer-copy text-[#d9e7ff]">(c) 2024 TESDA E-Assess Eastern Samar Office. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}

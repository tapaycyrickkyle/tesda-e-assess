"use client";

import Link from "next/link";

const cardClass = "rounded-xl border border-[#c4c5d5] bg-white p-5 shadow-sm";

export default function StudentDashboardPage() {
  return (
    <main className="px-4 pb-8 pt-8 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
          <section className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Welcome back, Maria Dela Cruz</h1>
              <p className="mt-2 text-[17px] leading-[1.5] text-[#444653]">
                Your assessment journey is 65% complete. You&apos;re doing great!
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 rounded-lg bg-[#002576] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0038a8]" type="button">
                <i aria-hidden="true" className="fa-solid fa-rocket text-[12px]" />
                Apply for Assessment
              </button>
              <button className="rounded-lg border border-[#747685] px-5 py-3 text-[14px] font-semibold text-[#002576] transition hover:bg-[#e5eeff]" type="button">
                View Profile
              </button>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <article className="relative overflow-hidden rounded-xl border border-[#c4c5d5] bg-white p-5 shadow-sm md:col-span-2">
              <span className="mb-3 inline-block rounded-full bg-[#dce1ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#093cab]">
                Current Status
              </span>
              <h2 className="text-[28px] font-semibold leading-[1.2] text-[#0b1c30]">Pending Verification</h2>
              <p className="mt-1 text-[15px] text-[#444653]">Technical Education and Skills Development Specialist NC II</p>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#5d5f5f]">
                  <i aria-hidden="true" className="fa-regular fa-clock text-[13px] text-[#3056c4]" />
                  Updated 2 hours ago
                </div>
                <button className="text-[14px] font-bold text-[#002576] hover:underline" type="button">
                  Track Process
                </button>
              </div>
              <i
                aria-hidden="true"
                className="fa-solid fa-certificate pointer-events-none absolute right-4 top-4 text-[72px] text-[#0038a8]/10"
              />
            </article>

            <article className={cardClass}>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[#dce1ff] text-[#093cab]">
                  <i aria-hidden="true" className="fa-regular fa-calendar text-[13px]" />
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5d5f5f]">Assessment Schedule</span>
              </div>
              <p className="text-[23px] font-semibold leading-[1.3]">Oct 24, 2023</p>
              <p className="text-[14px] font-semibold text-[#002576]">09:00 AM - 04:00 PM</p>
              <p className="mt-2 text-[14px] text-[#444653]">Eastern Samar PTC, Borongan City</p>
              <button className="mt-4 text-[14px] font-semibold text-[#002576] hover:underline" type="button">
                Add to Calendar
              </button>
            </article>

            <article className={cardClass}>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[#dfe0e0] text-[#454747]">
                  <i aria-hidden="true" className="fa-regular fa-folder-open text-[13px]" />
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5d5f5f]">Requirements</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#1a1c1c]">Submission Status</span>
                <span className="text-[14px] font-bold text-[#002576]">3/4</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#dfe0e0]">
                <div className="h-full w-3/4 bg-[#002576]" />
              </div>
              <p className="mt-2 text-[12px] font-semibold text-[#5d5f5f]">Missing: National ID Clearance</p>
              <button className="mt-4 text-[14px] font-semibold text-[#002576] hover:underline" type="button">
                Upload Missing File
              </button>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <article className={cardClass}>
                <h3 className="mb-5 text-[24px] font-semibold text-[#0b1c30]">Application Progress</h3>
                <div className="relative space-y-5">
                  <div className="absolute left-6 top-4 h-[calc(100%-2rem)] w-px bg-[#c4c5d5]" />
                  <ProgressRow
                    description="Received on Oct 12, 2023 at 14:30"
                    icon="fa-check"
                    state="COMPLETED"
                    stateClass="bg-[#dce1ff] text-[#093cab]"
                    title="Application Submitted"
                  />
                  <ProgressRow
                    description="Administrator is currently reviewing your uploaded IDs and certificates."
                    icon="fa-hourglass-half"
                    state="IN PROGRESS"
                    stateClass="bg-[#e5eeff] text-[#002576]"
                    title="Document Verification"
                  />
                  <ProgressRow
                    description="Waiting for qualified assessor availability."
                    icon="fa-user-clock"
                    muted
                    state="PENDING"
                    stateClass="bg-[#eff4ff] text-[#5d5f5f]"
                    title="Assessor Assignment"
                  />
                </div>
              </article>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <QuickAction icon="fa-eye" label="View Application" />
                <QuickAction icon="fa-upload" label="Upload Files" />
                <QuickAction icon="fa-calendar-days" label="Check Schedule" />
                <QuickAction icon="fa-headset" label="Get Support" />
              </div>
            </div>

            <aside className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-[24px] font-semibold text-[#0b1c30]">Announcements</h3>
                <i aria-hidden="true" className="fa-solid fa-bullhorn text-[15px] text-[#002576]" />
              </div>

              <div className="space-y-4">
                <Announcement
                  badge="Important"
                  badgeClass="text-[#591400]"
                  date="Oct 18"
                  text="Please review the updated safety protocols for all onsite technical assessments beginning November 1st."
                  title="New Assessment Guidelines for NC III released"
                />
                <Announcement
                  badge="Update"
                  badgeClass="rounded bg-[#dce1ff] px-2 py-1 text-[#093cab]"
                  date="Oct 15"
                  text="The E-Assess portal will be offline for routine maintenance this coming Sunday from 2 AM to 6 AM."
                  title="System Maintenance Schedule"
                />
                <Announcement
                  badge="General"
                  badgeClass="rounded bg-[#dfe0e0] px-2 py-1 text-[#454747]"
                  date="Oct 12"
                  text="Check out the latest TWSP slots available for the upcoming quarter in Eastern Samar district office."
                  title="Scholarship Opportunities for Tech-Voc"
                />
              </div>

              <button className="mt-5 w-full rounded-lg border border-[#747685] py-2 text-[14px] font-semibold text-[#002576] transition hover:bg-[#eff4ff]" type="button">
                View All Announcements
              </button>

              <div className="mt-6 border-t border-[#c4c5d5] pt-5">
                <h4 className="mb-3 text-[13px] font-bold uppercase tracking-[0.03em] text-[#5d5f5f]">Evaluation Center</h4>
                <div className="h-32 rounded-lg border border-[#c4c5d5] bg-[linear-gradient(135deg,#eaf1ff_0%,#d3e4fe_100%)] p-4">
                  <div className="flex h-full items-end justify-between">
                    <i aria-hidden="true" className="fa-solid fa-industry text-[34px] text-[#3056c4]/65" />
                    <i aria-hidden="true" className="fa-solid fa-graduation-cap text-[30px] text-[#3056c4]/65" />
                  </div>
                </div>
                <p className="mt-3 text-[12px] italic leading-[1.45] text-[#5d5f5f]">
                  &quot;Commitment to quality technical-vocational education for every Filipino.&quot;
                </p>
              </div>
            </aside>
          </section>
      </div>

      <div className="fixed bottom-6 right-6 lg:hidden">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#002576] text-white shadow-lg transition active:scale-95" type="button">
          <i aria-hidden="true" className="fa-solid fa-plus text-[16px]" />
        </button>
      </div>

      <div className="fixed bottom-4 left-4 lg:hidden">
        <Link
          className="rounded-full border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-semibold text-[#002576] shadow-sm"
          href="/"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}

function ProgressRow({
  title,
  description,
  icon,
  state,
  stateClass,
  muted,
}: {
  title: string;
  description: string;
  icon: string;
  state: string;
  stateClass: string;
  muted?: boolean;
}) {
  return (
    <div className={`relative z-10 flex gap-4 ${muted ? "opacity-55" : ""}`}>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          muted ? "border border-[#c4c5d5] bg-[#eff4ff] text-[#5d5f5f]" : "bg-[#002576] text-white"
        }`}
      >
        <i aria-hidden="true" className={`fa-solid ${icon} text-[14px]`} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[14px] font-bold text-[#1a1c1c]">{title}</h4>
        <p className="mt-1 text-[14px] leading-[1.45] text-[#444653]">{description}</p>
      </div>
      <span className={`h-fit rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.04em] ${stateClass}`}>{state}</span>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      className="group flex flex-col items-center justify-center rounded-xl border border-[#c4c5d5] bg-[#eff4ff] p-4 text-[#1a1c1c] transition hover:bg-[#0038a8] hover:text-white"
      type="button"
    >
      <i aria-hidden="true" className={`fa-solid ${icon} mb-2 text-[16px] transition group-hover:scale-110`} />
      <span className="text-[13px] font-semibold">{label}</span>
    </button>
  );
}

function Announcement({
  badge,
  badgeClass,
  date,
  title,
  text,
}: {
  badge: string;
  badgeClass: string;
  date: string;
  title: string;
  text: string;
}) {
  return (
    <article className="border-b border-[#c4c5d5] pb-4 last:border-b-0">
      <div className="mb-1 flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${badgeClass}`}>{badge}</span>
        <span className="text-[11px] font-semibold text-[#747685]">{date}</span>
      </div>
      <h4 className="text-[14px] font-bold leading-[1.35] text-[#1a1c1c]">{title}</h4>
      <p className="mt-1 text-[13px] leading-[1.4] text-[#5d5f5f]">{text}</p>
    </article>
  );
}

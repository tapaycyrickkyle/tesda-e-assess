"use client";

const summaryCards = [
  {
    label: "Assigned Applicants",
    value: "42",
    tag: "+12%",
    tagClass: "bg-[#dce1ff] text-[#093cab]",
    icon: "fa-solid fa-users",
    iconClass: "bg-[#dce1ff] text-[#002576]",
  },
  {
    label: "Pending Evaluations",
    value: "18",
    tag: "Action Required",
    tagClass: "bg-[#ffdbd1] text-[#591400]",
    icon: "fa-solid fa-list-check",
    iconClass: "bg-[#ffdbd1] text-[#591400]",
  },
  {
    label: "Approved Assessments",
    value: "156",
    tag: "Last 30 days",
    tagClass: "bg-[#dfe0e0] text-[#454747]",
    icon: "fa-solid fa-circle-check",
    iconClass: "bg-[#dfe0e0] text-[#454747]",
  },
  {
    label: "Today's Schedule",
    value: "09:00 AM",
    tag: "5 Events",
    tagClass: "bg-[#d3e4fe] text-[#444653]",
    icon: "fa-regular fa-calendar-days",
    iconClass: "bg-[#dce9ff] text-[#0b1c30]",
  },
];

const applicants = [
  {
    initials: "JD",
    name: "John Dela Cruz",
    qualification: "Computer Systems NC II",
    schedule: "09:30 AM",
    status: "Pending",
    statusClass: "bg-[#dce1ff] text-[#093cab]",
    action: "Assess Now",
    actionClass: "text-[#002576]",
    accentClass: "bg-[#dce1ff] text-[#093cab]",
  },
  {
    initials: "AM",
    name: "Ana Magpale",
    qualification: "Cookery NC II",
    schedule: "11:00 AM",
    status: "Evaluating",
    statusClass: "bg-[#ffdbd1] text-[#591400]",
    action: "Continue",
    actionClass: "text-[#002576]",
    accentClass: "bg-[#ffdbd1] text-[#591400]",
  },
  {
    initials: "RS",
    name: "Roberto Santos",
    qualification: "Bread and Pastry NC II",
    schedule: "01:30 PM",
    status: "Scheduled",
    statusClass: "bg-[#dfe0e0] text-[#616363]",
    action: "View Details",
    actionClass: "text-[#444653]",
    accentClass: "bg-[#dfe0e0] text-[#1a1c1c]",
  },
  {
    initials: "LL",
    name: "Liza Lopez",
    qualification: "Visual Graphic NC III",
    schedule: "03:00 PM",
    status: "Pending",
    statusClass: "bg-[#dce1ff] text-[#093cab]",
    action: "Assess Now",
    actionClass: "text-[#002576]",
    accentClass: "bg-[#dce1ff] text-[#093cab]",
  },
];

const notes = [
  {
    title: "Ana Magpale",
    time: "10:45 AM",
    body: "Competency in kitchen safety demonstrated well. Practical module 3 pending for review of temperature logs.",
  },
  {
    title: "System Alert",
    time: "Yesterday",
    body: "3 assessment results from last week require final electronic signature to be dispatched to central office.",
  },
];

const announcements = [
  {
    title: "New NC III Standards",
    body: "Please review the updated assessment guidelines for Information Technology NC III by Friday.",
  },
  {
    title: "Regional Audit",
    body: "Region VIII audit team will visit the Eastern Samar office on Oct 30. Ensure all physical logs are updated.",
  },
];

export default function TeacherDashboardPage() {
  return (
    <main className="min-h-screen px-4 pb-8 pt-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[2rem] font-bold leading-[1.15] text-[#0b1c30] sm:text-[2.25rem]">Welcome, Maria Clara</h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#444653] sm:text-[1.0625rem]">
              Here is your assessment overview for today, October 24, 2023.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SecondaryButton icon="fa-regular fa-calendar-days" label="Schedule" />
            <SecondaryButton icon="fa-solid fa-download" label="Export Data" />
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-[#c4c5d5] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconClass}`}>
                  <i aria-hidden="true" className={`${card.icon} text-[18px]`} />
                </div>
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${card.tagClass}`}>{card.tag}</span>
              </div>
              <p className="mb-1 text-[14px] font-medium text-[#444653]">{card.label}</p>
              <p className="text-[2rem] font-bold leading-none text-[#0b1c30]">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-[#c4c5d5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#c4c5d5] bg-[#eff4ff] px-6 py-4">
                <h2 className="text-[1.125rem] font-bold text-[#0b1c30]">Assigned Applicants</h2>
                <div className="flex items-center gap-2">
                  <IconButton icon="fa-solid fa-filter" small />
                  <IconButton icon="fa-solid fa-ellipsis-vertical" small />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#c4c5d5] bg-[#e5eeff] text-[#444653]">
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em]">Applicant Name</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em]">Qualification</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em]">Schedule</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em]">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c5d5]">
                    {applicants.map((applicant) => (
                      <tr key={applicant.name} className="transition hover:bg-[#f8fbff]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${applicant.accentClass}`}
                            >
                              {applicant.initials}
                            </div>
                            <span className="text-[15px] font-medium text-[#0b1c30]">{applicant.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#444653]">{applicant.qualification}</td>
                        <td className="px-6 py-4 text-[14px] text-[#444653]">{applicant.schedule}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${applicant.statusClass}`}
                          >
                            {applicant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className={`text-[14px] font-bold hover:underline ${applicant.actionClass}`} type="button">
                            {applicant.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center border-t border-[#c4c5d5] bg-[#eff4ff] p-4">
                <button
                  className="flex items-center gap-2 text-[14px] font-bold text-[#002576] transition hover:gap-3"
                  type="button"
                >
                  View All Applicants
                  <i aria-hidden="true" className="fa-solid fa-arrow-right text-[13px]" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <aside className="overflow-hidden rounded-2xl border border-[#c4c5d5] bg-white shadow-sm">
              <div className="border-b border-[#c4c5d5] bg-[#eff4ff] px-6 py-4">
                <h2 className="text-[1.125rem] font-bold text-[#0b1c30]">Evaluation Notes</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {notes.map((note) => (
                    <article key={`${note.title}-${note.time}`} className="rounded-xl border border-[#c4c5d5] bg-[#f8f9ff] p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[14px] font-bold text-[#002576]">{note.title}</p>
                        <span className="text-[11px] text-[#747685]">{note.time}</span>
                      </div>
                      <p className="text-[14px] leading-[1.55] text-[#0b1c30]">{note.body}</p>
                    </article>
                  ))}
                </div>

                <button
                  className="mt-4 w-full rounded-xl border border-[#002576] py-2.5 text-[14px] font-bold text-[#002576] transition hover:bg-[#dce1ff]"
                  type="button"
                >
                  Add New Note
                </button>
              </div>
            </aside>

            <aside className="relative overflow-hidden rounded-2xl bg-[#002576] text-white shadow-lg">
              <div className="relative z-10 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#002576]">
                    <i aria-hidden="true" className="fa-solid fa-bullhorn text-[14px]" />
                  </span>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#dce1ff]">
                    Office Announcements
                  </h2>
                </div>

                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <article key={announcement.title} className="border-l-2 border-[#96adff] pl-3">
                      <p className="text-[15px] font-bold">{announcement.title}</p>
                      <p className="mt-1 text-[12px] leading-[1.55] text-[#eaf1ff]">{announcement.body}</p>
                    </article>
                  ))}
                </div>

                <button
                  className="mt-6 w-full rounded-xl bg-white py-2.5 text-[14px] font-bold text-[#002576] transition hover:opacity-90"
                  type="button"
                >
                  Open Dashboard Notice
                </button>
              </div>

              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#96adff] opacity-20 transition-transform duration-300 hover:scale-110" />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function IconButton({ icon, small }: { icon: string; small?: boolean }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border border-[#c4c5d5] bg-white text-[#5d5f5f] transition hover:bg-[#eff4ff] hover:text-[#0b1c30] ${
        small ? "h-9 w-9 text-[13px]" : "h-10 w-10 text-[14px]"
      }`}
      type="button"
    >
      <i aria-hidden="true" className={icon} />
    </button>
  );
}

function SecondaryButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      className="flex items-center gap-2 rounded-xl border border-[#c4c5d5] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0b1c30] transition hover:bg-[#eff4ff]"
      type="button"
    >
      <i aria-hidden="true" className={`${icon} text-[14px] text-[#444653]`} />
      {label}
    </button>
  );
}

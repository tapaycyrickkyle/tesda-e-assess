"use client";

import { useState } from "react";

const applicants = [
  {
    course: "Computer Systems Servicing NC II",
    date: "Oct 24, 2023",
    id: "TES-2023-0045",
    initials: "JS",
    level: "Level 2 Qualification",
    name: "John Santos",
    room: "LAB-IT-04",
    time: "02:30 PM",
    toneClass: "bg-[#dce1ff] text-[#093cab]",
  },
];

const bulkSubmission = {
  batchCode: "BULK-2023-01",
  date: "Oct 24, 2023",
  name: "Eastern Samar CSS NC II Batch",
  room: "LAB-IT-04",
  submittedBy: "Admin Coordinator",
  time: "03:00 PM",
};

const bulkApplicants = [
  { id: "TES-2023-0045", name: "John Santos" },
  { id: "TES-2023-0112", name: "Maria Rivera" },
  { id: "TES-2023-0098", name: "Antonio Dela Cruz" },
  { id: "TES-2023-0156", name: "Elena Garcia" },
];

const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";

export default function AdminApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const applicantCount = activeTab === "individual" ? applicants.length : bulkApplicants.length;
  const filteredBulkApplicants = bulkApplicants.filter((applicant) =>
    applicant.name.toLowerCase().includes(bulkSearch.trim().toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <nav className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#747685]">
                <span>Applicants</span>
                <i aria-hidden="true" className="fa-solid fa-chevron-right text-[10px]" />
                <span className="font-bold text-[#002576]">Submitted Applicants</span>
              </nav>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Submitted Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Manage and review candidates who have completed their portfolio submissions.
              </p>
            </div>

            <div className="flex justify-end">
              <span className="text-[40px] font-bold leading-none text-[#002576]">{applicantCount}</span>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-[#c4c5d5] bg-white p-1 shadow-sm">
              <button
                className={`w-[112px] rounded-full px-5 py-2 text-[13px] transition ${
                  activeTab === "individual"
                    ? "bg-[#002576] font-bold text-white"
                    : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                }`}
                onClick={() => setActiveTab("individual")}
                type="button"
              >
                Individual
              </button>
              <button
                className={`w-[112px] rounded-full px-5 py-2 text-[13px] transition ${
                  activeTab === "bulk"
                    ? "bg-[#002576] font-bold text-white"
                    : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                }`}
                onClick={() => setActiveTab("bulk")}
                type="button"
              >
                Bulk
              </button>
            </div>
          </div>
        </section>

        <section>
          {activeTab === "individual" ? (
            <div className="grid grid-cols-1 gap-4">
              {applicants.map((applicant) => (
                <article key={applicant.id} className="rounded-2xl border border-[#c4c5d5] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className={cardTitleClass}>{applicant.name}</p>
                      <p className="mt-2 text-[14px] font-medium text-[#444653]">{applicant.course}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                      <button
                        className="inline-flex min-w-[108px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        type="button"
                      >
                        View PDF
                      </button>
                      <button
                        className="inline-flex min-w-[108px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        type="button"
                      >
                        Download
                      </button>
                      <button
                        className="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                        type="button"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="rounded-2xl border border-[#c4c5d5] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <button
                    className={`${cardTitleClass} text-left transition hover:text-[#002576] hover:underline`}
                    onClick={() => setIsBulkModalOpen(true)}
                    type="button"
                  >
                    {bulkSubmission.name}
                  </button>
                  <p className="mt-2 text-[14px] font-medium text-[#444653]">Computer Systems Servicing NC II</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <button
                    className="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                    type="button"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </article>
          )}
        </section>
      </div>

      {isBulkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4">
          <div className="w-full max-w-[560px] rounded-[24px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">{bulkSubmission.name}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Applicant list for this school submission batch.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => setIsBulkModalOpen(false)}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#0b1c30]">Applicants</span>
                <span className="text-[12px] font-medium text-[#747685]">{filteredBulkApplicants.length} total</span>
              </div>

              <div className="mb-4">
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-2xl border border-[#c4c5d5] bg-white py-3 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setBulkSearch(event.target.value)}
                    placeholder="Search applicants..."
                    type="text"
                    value={bulkSearch}
                  />
                </div>
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {filteredBulkApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex flex-col gap-3 rounded-2xl border border-[#d9e3f7] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0b1c30]">{applicant.name}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        type="button"
                      >
                        View PDF
                      </button>
                      <button
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        type="button"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}

                {filteredBulkApplicants.length === 0 ? (
                  <div className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-6 text-center text-[13px] text-[#747685]">
                    No applicants found.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

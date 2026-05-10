"use client";

import { useMemo, useState } from "react";

type ApprovalStatus = "Awaiting Evaluation" | "Pending Verification";
type InstitutionType = "Private" | "Public";

type ApprovalRecord = {
  email: string;
  id: string;
  initials: string;
  institution: string;
  institutionType: InstitutionType;
  name: string;
  registeredAt: string;
  status: ApprovalStatus;
};

const approvalRecords: ApprovalRecord[] = [
  {
    email: "julianne.s@edu.ph",
    id: "TA-1024",
    initials: "JS",
    institution: "Eastern Samar State University",
    institutionType: "Public",
    name: "Julianne Santiago",
    registeredAt: "Oct 24, 2023",
    status: "Pending Verification",
  },
  {
    email: "m.rivera@private.school",
    id: "TA-1025",
    initials: "MR",
    institution: "St. Mary's Academy Borongan",
    institutionType: "Private",
    name: "Marcus Rivera",
    registeredAt: "Oct 25, 2023",
    status: "Awaiting Evaluation",
  },
  {
    email: "elena.dc@deped.gov.ph",
    id: "TA-1026",
    initials: "ED",
    institution: "Balangiga National High School",
    institutionType: "Public",
    name: "Elena Dela Cruz",
    registeredAt: "Oct 26, 2023",
    status: "Pending Verification",
  },
  {
    email: "a.torres@private.edu",
    id: "TA-1027",
    initials: "AT",
    institution: "Eastern Visayas Tech Academy",
    institutionType: "Private",
    name: "Angela Torres",
    registeredAt: "Oct 27, 2023",
    status: "Awaiting Evaluation",
  },
  {
    email: "roberto.l@deped.gov.ph",
    id: "TA-1028",
    initials: "RL",
    institution: "Guiuan National Vocational School",
    institutionType: "Public",
    name: "Roberto Lim",
    registeredAt: "Oct 28, 2023",
    status: "Pending Verification",
  },
  {
    email: "c.mendoza@skillshub.ph",
    id: "TA-1029",
    initials: "CM",
    institution: "Borongan Skills Hub",
    institutionType: "Private",
    name: "Carla Mendoza",
    registeredAt: "Oct 29, 2023",
    status: "Pending Verification",
  },
];

const itemsPerPage = 3;
const pageLabels = ["1", "2", "3"];
const formatInstitutionPill = (institutionType: InstitutionType) =>
  institutionType === "Public" ? "bg-[#dce1ff] text-[#093cab]" : "bg-[#e3e5e8] text-[#454747]";

export default function AdminTeacherApprovalsPage() {
  const [activeInstitutionFilter, setActiveInstitutionFilter] = useState<"all" | InstitutionType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredApprovals = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return approvalRecords.filter((record) => {
      const matchesInstitution =
        activeInstitutionFilter === "all" || record.institutionType === activeInstitutionFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        record.name.toLowerCase().includes(normalizedQuery) ||
        record.email.toLowerCase().includes(normalizedQuery) ||
        record.institution.toLowerCase().includes(normalizedQuery);

      return matchesInstitution && matchesQuery;
    });
  }, [activeInstitutionFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredApprovals.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedApprovals = filteredApprovals.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const publicInstitutionCount = approvalRecords.filter((record) => record.institutionType === "Public").length;
  const privateInstitutionCount = approvalRecords.filter((record) => record.institutionType === "Private").length;
  const pendingVerificationCount = approvalRecords.filter((record) => record.status === "Pending Verification").length;
  const paginationStart = filteredApprovals.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const paginationEnd = Math.min(safeCurrentPage * itemsPerPage, filteredApprovals.length);
  const hasActiveFilters = activeInstitutionFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <nav className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#747685]">
                <span>Admin</span>
                <i aria-hidden="true" className="fa-solid fa-chevron-right text-[10px]" />
                <span className="font-bold text-[#002576]">Teacher Approvals</span>
              </nav>

              <h1 className="text-[34px] font-bold leading-[1.1] text-[#002576]">Pending Approvals</h1>
              <p className="mt-3 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Review and manage teacher account verifications. Ensure submitted credentials align with TESDA
                institutional standards before granting access.
              </p>
            </div>

            <div className="w-full max-w-[240px] rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-5 py-4 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Pending Verification</p>
              <p className="mt-2 text-[30px] font-bold leading-none text-[#0b1c30]">{pendingVerificationCount}</p>
              <p className="mt-1 text-[12px] text-[#4563a5]">Accounts waiting for verification</p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[20px] border border-[#cfd8ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#dce1ff]/75 blur-2xl transition group-hover:bg-[#d0dbff]/90" />
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#dce1ff] text-[#002576] shadow-[inset_0_0_0_1px_rgba(9,60,171,0.06)]">
                <i aria-hidden="true" className="fa-solid fa-school text-[22px]" />
              </div>
              <div className="mt-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">Public Institutions</p>
                <p className="mt-2 text-[36px] font-bold leading-none text-[#0b1c30]">{publicInstitutionCount}</p>
                <p className="mt-2 text-[13px] text-[#5d5f5f]">Schools under public education review</p>
              </div>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[20px] border border-[#cfd8ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#e5eeff]/85 blur-2xl transition group-hover:bg-[#d9e5ff]/95" />
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#e5eeff] text-[#002576] shadow-[inset_0_0_0_1px_rgba(9,60,171,0.06)]">
                <i aria-hidden="true" className="fa-solid fa-building-columns text-[22px]" />
              </div>
              <div className="mt-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">Private Institutions</p>
                <p className="mt-2 text-[36px] font-bold leading-none text-[#0b1c30]">{privateInstitutionCount}</p>
                <p className="mt-2 text-[13px] text-[#5d5f5f]">Independent and partner institutions in queue</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mb-8 overflow-hidden rounded-[20px] border border-[#c4c5d5] bg-white shadow-sm">
          <div className="border-b border-[#d9e3f7] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-[24px] font-semibold text-[#0b1c30]">Verification Queue</h2>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                  Use search and institution filters to focus on the current verification batch.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#c4c5d5] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15 sm:w-[280px]"
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search approvals..."
                    type="text"
                    value={searchQuery}
                  />
                </div>

                <div className="inline-flex items-center rounded-xl border border-[#c4c5d5] bg-white p-1 shadow-sm">
                  {[
                    { label: "All", value: "all" as const },
                    { label: "Public", value: "Public" as const },
                    { label: "Private", value: "Private" as const },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`rounded-lg px-4 py-2 text-[12px] font-bold transition ${
                        activeInstitutionFilter === option.value
                          ? "bg-[#002576] text-white"
                          : "text-[#5d5f5f] hover:bg-[#eff4ff]"
                      }`}
                      onClick={() => {
                        setActiveInstitutionFilter(option.value);
                        setCurrentPage(1);
                      }}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {hasActiveFilters ? (
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4def2] bg-[#eef4ff] px-4 py-2.5 text-[13px] font-bold text-[#093cab] transition hover:bg-[#e3edff]"
                      onClick={() => {
                        setActiveInstitutionFilter("all");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      type="button"
                    >
                      <i aria-hidden="true" className="fa-solid fa-rotate-left text-[12px]" />
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#d9e3f7] bg-white px-5 py-3 sm:px-6">
            <div className="flex flex-col gap-2 text-[13px] text-[#5d5f5f] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing <span className="font-semibold text-[#0b1c30]">{filteredApprovals.length}</span> approval
                {filteredApprovals.length === 1 ? "" : "s"} in the current view
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#093cab]">
                  Public: {filteredApprovals.filter((record) => record.institutionType === "Public").length}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#f1f3f5] px-3 py-1 text-[11px] font-semibold text-[#454747]">
                  Private: {filteredApprovals.filter((record) => record.institutionType === "Private").length}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <div className="space-y-3 px-4 py-4 sm:px-6">
              {paginatedApprovals.map((record) => (
                <article key={record.id} className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] p-4 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[#0b1c30]">{record.name}</p>
                    <p className="truncate text-[11px] text-[#747685]">{record.email}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-[14px] border border-[#e4ebf7] bg-white p-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Institution</p>
                      <p className="mt-1 text-[13px] font-medium leading-[1.5] text-[#0b1c30]">{record.institution}</p>
                      <span
                        className={`mt-2 inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatInstitutionPill(record.institutionType)}`}
                      >
                        {record.institutionType}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Registered</p>
                      <p className="mt-1 text-[13px] font-medium text-[#444653]">{record.registeredAt}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      type="button"
                    >
                      Review Credentials
                    </button>
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                      type="button"
                    >
                      Approve
                    </button>
                  </div>
                </article>
              ))}

              {paginatedApprovals.length === 0 ? (
                <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center text-[14px] text-[#747685]">
                  No teacher approvals match the current filters.
                </div>
              ) : null}
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#d9e3f7] bg-[#f8fbff]">
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685] sm:px-6">
                    Teacher Name
                  </th>
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685] sm:px-6">
                    Institution
                  </th>
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685] sm:px-6">
                    Registration Date
                  </th>
                  <th className="px-5 py-4 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685] sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e3f7]">
              {paginatedApprovals.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-[#f8fbff]">
                    <td className="px-5 py-4 sm:px-6">
                      <div>
                        <p className="text-[14px] font-bold text-[#0b1c30]">{record.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#747685]">{record.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[14px] font-medium text-[#0b1c30]">{record.institution}</span>
                        <span
                          className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatInstitutionPill(record.institutionType)}`}
                        >
                          {record.institutionType}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#444653] sm:px-6">{record.registeredAt}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          type="button"
                        >
                          Review Credentials
                        </button>
                        <button
                          className="inline-flex items-center justify-center rounded-lg bg-[#002576] px-4 py-2 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                          type="button"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedApprovals.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-[14px] text-[#747685] sm:px-6" colSpan={4}>
                      No teacher approvals match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#d9e3f7] bg-[#f8fbff] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[13px] text-[#747685]">
              Showing {paginationStart} to {paginationEnd} of {filteredApprovals.length} applicants
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#c4c5d5] bg-white text-[#5d5f5f] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-chevron-left text-[11px]" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-[12px] font-bold transition ${
                    pageNumber === safeCurrentPage
                      ? "bg-[#002576] text-white"
                      : "bg-white text-[#0b1c30] hover:bg-[#eff4ff]"
                  } ${pageNumber === safeCurrentPage ? "" : "border border-[#c4c5d5]"}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  type="button"
                >
                  {pageLabels[pageNumber - 1] ?? pageNumber}
                </button>
              ))}

              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#c4c5d5] bg-white text-[#5d5f5f] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

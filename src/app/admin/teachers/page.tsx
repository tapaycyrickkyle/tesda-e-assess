"use client";

import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { useEffect, useMemo, useState } from "react";

type ApprovalStatus = "approved" | "pending_review" | "rejected";
type InstitutionType = "private" | "public";

type TeacherApprovalRecord = {
  approval_status: ApprovalStatus;
  auth_user_id: string;
  contact_number: string;
  created_at: string;
  email: string;
  first_name: string;
  full_name: string;
  id: string;
  institution_name: string;
  institution_type: InstitutionType;
  last_name: string;
  middle_name: string | null;
  position_title: string;
  verification_document_mime_type: string | null;
  verification_document_name: string;
  verification_document_path: string;
  verification_document_url: string | null;
};

function formatInstitutionPill(institutionType: InstitutionType) {
  return institutionType === "public" ? "bg-[#dce1ff] text-[#093cab]" : "bg-[#e3e5e8] text-[#454747]";
}

function formatApprovalStatusPill(status: ApprovalStatus) {
  if (status === "approved") {
    return "bg-[#edf9f1] text-[#1f7a45]";
  }

  if (status === "rejected") {
    return "bg-[#fff4f4] text-[#93000a]";
  }

  return "bg-[#fff8e8] text-[#7f5b00]";
}

function formatApprovalStatusLabel(status: ApprovalStatus) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Pending Review";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatInstitutionLabel(value: InstitutionType) {
  return value === "public" ? "Public" : "Private";
}

function isImageDocument(record: TeacherApprovalRecord) {
  return record.verification_document_mime_type?.startsWith("image/") ?? false;
}

function isPdfDocument(record: TeacherApprovalRecord) {
  return record.verification_document_mime_type === "application/pdf";
}

export default function AdminTeacherApprovalsPage() {
  const [activeInstitutionFilter, setActiveInstitutionFilter] = useState<"all" | InstitutionType>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"all" | ApprovalStatus>("pending_review");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<TeacherApprovalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadApprovalRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/teacher-approvals", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          message?: string;
          requests?: TeacherApprovalRecord[];
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load teacher approval requests.");
        }

        if (!cancelled) {
          setRecords(payload.requests ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load teacher approval requests.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadApprovalRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredApprovals = useMemo(
    () =>
      records.filter((record) => {
        const matchesInstitution =
          activeInstitutionFilter === "all" || record.institution_type === activeInstitutionFilter;
        const matchesStatus = activeStatusFilter === "all" || record.approval_status === activeStatusFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          record.full_name.toLowerCase().includes(normalizedSearchQuery) ||
          record.email.toLowerCase().includes(normalizedSearchQuery) ||
          record.institution_name.toLowerCase().includes(normalizedSearchQuery) ||
          record.position_title.toLowerCase().includes(normalizedSearchQuery);

        return matchesInstitution && matchesStatus && matchesSearch;
      }),
    [activeInstitutionFilter, activeStatusFilter, normalizedSearchQuery, records],
  );
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;

  function renderApprovalButtons(record: TeacherApprovalRecord, compact = false) {
    const buttonClass = compact
      ? "inline-flex min-h-[40px] items-center justify-center rounded-lg px-3.5 text-[12px] font-bold transition"
      : "inline-flex min-h-[42px] items-center justify-center rounded-lg px-4 text-[13px] font-bold transition";

    return (
      <div className={`flex ${compact ? "flex-wrap" : "flex-wrap justify-end"} gap-2`}>
        {record.approval_status === "pending_review" ? (
          <>
            <button
              className={`${buttonClass} bg-[#002576] text-white hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={updatingRequestId === record.id}
              onClick={() => void handleUpdateStatus(record, "approve")}
              type="button"
            >
              {updatingRequestId === record.id ? "Saving..." : "Approve"}
            </button>
            <button
              className={`${buttonClass} border border-[#f0b4b4] bg-[#fff5f5] text-[#93000a] hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={updatingRequestId === record.id}
              onClick={() => void handleUpdateStatus(record, "reject")}
              type="button"
            >
              {updatingRequestId === record.id ? "Saving..." : "Reject"}
            </button>
          </>
        ) : null}
      </div>
    );
  }

  async function handleUpdateStatus(record: TeacherApprovalRecord, action: "approve" | "reject") {
    if (updatingRequestId) {
      return;
    }

    setUpdatingRequestId(record.id);
    setError("");

    try {
      const response = await fetch("/api/admin/teacher-approvals", {
        body: JSON.stringify({
          action,
          requestId: record.id,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as {
        message?: string;
        request?: TeacherApprovalRecord;
        success?: boolean;
      };

      if (!response.ok || !payload.success || !payload.request) {
        throw new Error(payload.message ?? "Unable to update the teacher approval.");
      }

      setRecords((currentRecords) =>
        currentRecords.map((currentRecord) => (currentRecord.id === payload.request!.id ? payload.request! : currentRecord)),
      );
      setSelectedRecordId(payload.request.id);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update the teacher approval.");
    } finally {
      setUpdatingRequestId(null);
    }
  }

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Teachers</h1>
          <p className="ui-page-description">
            Review teacher verification requests and update their access decisions.
          </p>
        </section>

        <section className="mb-5">
          <div className="overflow-hidden rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] xl:gap-3">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Search
                </span>
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="min-h-[40px] w-full rounded-lg border border-[#d9e3f7] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search teacher, email, institution..."
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Institution
                </span>
                <div className="relative">
                  <select
                    className="min-h-[40px] w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 pr-11 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setActiveInstitutionFilter(event.target.value as "all" | InstitutionType)}
                    value={activeInstitutionFilter}
                  >
                    <option value="all">All Institutions</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                    <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                  </span>
                </div>
              </label>

              <label className="block min-w-0 md:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Status
                </span>
                <div className="relative">
                  <select
                    className="min-h-[40px] w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 pr-11 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setActiveStatusFilter(event.target.value as "all" | ApprovalStatus)}
                    value={activeStatusFilter}
                  >
                    <option value="pending_review">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All Statuses</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                    <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                  </span>
                </div>
              </label>
            </div>
          </div>

          {error ? (
            <NotificationBanner className="mt-3 rounded-xl sm:px-6" compact message={error} variant="error" />
          ) : null}

          {isLoading ? (
            <div className="mt-3 rounded-xl border border-[#d9e3f7] bg-white px-4 py-8 text-center text-[14px] text-[#747685] shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-6">
              Loading teacher approval requests...
            </div>
          ) : (
            <>
              <div className="mt-3 lg:hidden">
                <div className="space-y-2.5 px-4 py-4 sm:px-6">
                  {filteredApprovals.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-[#bfd0f2] hover:bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#0b1c30]">{record.full_name}</p>
                          <p className="truncate text-[12px] text-[#747685]">{record.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatInstitutionPill(record.institution_type)}`}
                          >
                            {formatInstitutionLabel(record.institution_type)}
                          </span>
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatApprovalStatusPill(record.approval_status)}`}
                          >
                            {formatApprovalStatusLabel(record.approval_status)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-[#e4ebf7] bg-white p-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Institution</p>
                          <p className="mt-1 text-[13px] font-medium leading-[1.5] text-[#0b1c30]">{record.institution_name}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Registered</p>
                          <p className="mt-1 text-[13px] font-medium text-[#444653]">{formatDate(record.created_at)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Role</p>
                          <p className="mt-1 text-[13px] font-medium text-[#444653]">{record.position_title}</p>
                        </div>
                      </div>

                      <button
                        className="mt-4 inline-flex w-full items-center justify-between rounded-md border border-[#d9e3f7] bg-white px-3.5 py-3 text-left transition hover:border-[#bfd0f2] hover:bg-[#f8fbff]"
                        onClick={() => setSelectedRecordId(record.id)}
                        type="button"
                      >
                        <div>
                          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Open Request</p>
                          <p className="mt-1 text-[13px] text-[#5d5f5f]">View full details and credential preview.</p>
                        </div>
                        <i aria-hidden="true" className="fa-solid fa-chevron-right text-[12px] text-[#4563a5]" />
                      </button>
                    </article>
                  ))}

                  {filteredApprovals.length === 0 ? (
                    <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center text-[14px] text-[#747685]">
                      No teacher approvals match the current filters.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 hidden lg:block">
                {filteredApprovals.length > 0 ? (
                  <div className="ui-data-table-shell">
                    <table className="ui-data-table">
                      <thead>
                        <tr>
                          <th className="text-left">
                            Teacher
                          </th>
                          <th className="text-left">
                            Institution
                          </th>
                          <th className="text-left">
                            Submitted
                          </th>
                          <th className="text-left">
                            Status
                          </th>
                          <th className="text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApprovals.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <div className="ui-data-table-stack">
                                <p className="ui-data-table-title">{record.full_name}</p>
                                <p className="ui-data-table-meta truncate">{record.email}</p>
                              </div>
                            </td>
                            <td>
                              <div className="ui-data-table-stack">
                                <p className="ui-data-table-copy max-w-[260px] truncate font-semibold text-[#0b1c30]">
                                  {record.institution_name}
                                </p>
                                <span
                                  className={`ui-data-table-chip ${formatInstitutionPill(record.institution_type)}`}
                                >
                                  {formatInstitutionLabel(record.institution_type)}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="ui-data-table-stack">
                                <p className="ui-data-table-copy font-semibold text-[#0b1c30]">{formatDate(record.created_at)}</p>
                                <p className="ui-data-table-meta">{record.position_title}</p>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`ui-data-table-chip ${formatApprovalStatusPill(record.approval_status)}`}
                              >
                                {formatApprovalStatusLabel(record.approval_status)}
                              </span>
                            </td>
                            <td className="text-right">
                              <button
                                className="ui-data-table-action"
                                onClick={() => setSelectedRecordId(record.id)}
                                type="button"
                              >
                                <span>View Details</span>
                                <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center text-[14px] text-[#747685]">
                    No teacher approvals match the current filters.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <AnimatedModal
        contentClassName="w-full max-w-[920px] overflow-hidden rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(selectedRecord)}
      >
        {selectedRecord ? (
          <div className="max-h-[calc(100vh-32px)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatInstitutionPill(selectedRecord.institution_type)}`}
                  >
                    {formatInstitutionLabel(selectedRecord.institution_type)}
                  </span>
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${formatApprovalStatusPill(selectedRecord.approval_status)}`}
                  >
                    {formatApprovalStatusLabel(selectedRecord.approval_status)}
                  </span>
                </div>
                <h2 className="ui-section-title mt-3 text-[#0b1c30]">{selectedRecord.full_name}</h2>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                  Full request details and uploaded credential preview.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => setSelectedRecordId(null)}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 bg-[#f8fbff] px-6 py-5 sm:px-7 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <div className="ui-list-row">
                    <div className="min-w-0">
                      <p className="ui-meta-label">Email</p>
                      <p className="ui-meta-value break-words">{selectedRecord.email}</p>
                    </div>
                  </div>
                  <div className="ui-list-row">
                    <div className="min-w-0">
                      <p className="ui-meta-label">Contact Number</p>
                      <p className="ui-meta-value">{selectedRecord.contact_number}</p>
                    </div>
                  </div>
                  <div className="ui-list-row">
                    <div className="min-w-0">
                      <p className="ui-meta-label">Institution</p>
                      <p className="ui-meta-value">{selectedRecord.institution_name}</p>
                    </div>
                  </div>
                  <div className="ui-list-row">
                    <div className="min-w-0">
                      <p className="ui-meta-label">Position / Role</p>
                      <p className="ui-meta-value">{selectedRecord.position_title}</p>
                    </div>
                  </div>
                  <div className="ui-list-row sm:col-span-2">
                    <div className="min-w-0">
                      <p className="ui-meta-label">Submitted</p>
                      <p className="ui-meta-value">{formatDate(selectedRecord.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e8eef8] pt-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Review Decision</p>
                  <p className="mt-2 max-w-[44rem] text-[14px] leading-[1.6] text-[#5d5f5f]">
                    Open the uploaded credential preview, confirm the teacher details, then approve or reject this request.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedRecord.approval_status === "pending_review" ? (
                      renderApprovalButtons(selectedRecord)
                    ) : (
                      <span
                        className={`inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 text-[12px] font-bold ${formatApprovalStatusPill(selectedRecord.approval_status)}`}
                      >
                        {formatApprovalStatusLabel(selectedRecord.approval_status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(217,227,247,0.72)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Credential Preview</p>
                      <p className="mt-1 text-[13px] text-[#5d5f5f]">Uploaded by the teacher during signup.</p>
                    </div>
                    {selectedRecord.verification_document_url ? (
                      <a
                        className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d9e3f7] bg-white px-4 text-[12px] font-bold whitespace-nowrap text-[#002576] transition hover:bg-[#eff4ff]"
                        href={selectedRecord.verification_document_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <i aria-hidden="true" className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                        Open File
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg bg-[#fbfdff] shadow-[inset_0_0_0_1px_rgba(227,235,251,0.9)]">
                    {selectedRecord.verification_document_url ? (
                      isImageDocument(selectedRecord) ? (
                        // Signed storage URLs are short-lived and remote, so a plain img preview is the safer fit here.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={`${selectedRecord.full_name} uploaded credential`}
                          className="h-auto max-h-[520px] w-full object-contain bg-white"
                          src={selectedRecord.verification_document_url}
                        />
                      ) : isPdfDocument(selectedRecord) ? (
                        <iframe
                          className="h-[520px] w-full bg-white"
                          src={selectedRecord.verification_document_url}
                          title={`${selectedRecord.full_name} uploaded credential`}
                        />
                      ) : (
                        <div className="flex min-h-[260px] items-center justify-center px-6 py-8 text-center text-[13px] text-[#747685]">
                          This file type cannot be previewed here. Use the open file button above to inspect it.
                        </div>
                      )
                    ) : (
                      <div className="flex min-h-[260px] items-center justify-center px-6 py-8 text-center text-[13px] text-[#747685]">
                        The uploaded credential file is not available right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </AnimatedModal>
    </main>
  );
}

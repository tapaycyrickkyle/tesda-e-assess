"use client";

import AnimatedModal from "@/components/AnimatedModal";
import { useEffect, useMemo, useState } from "react";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";

type AssignedApplicant = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
  assignment_title?: string | null;
  assessment_center_id: string;
  center_name: string;
  id: string;
  qualification: string;
};

type BulkAssignment = {
  assignmentIds: string[];
  applicantCount: number;
  assignedAt: string;
  batchCode: string;
  centerName: string;
  id: string;
  qualification: string;
  title: string;
};

type RemovalTarget =
  | {
      assignmentIds: string[];
      centerName: string;
      count: 1;
      description: string;
      title: string;
      type: "individual";
    }
  | {
      assignmentIds: string[];
      centerName: string;
      count: number;
      description: string;
      title: string;
      type: "bulk";
    };

const formatAssignedDate = (value: string) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });

const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";

export default function AdminAssignedApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [applicants, setApplicants] = useState<AssignedApplicant[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");
  const [error, setError] = useState("");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [removalError, setRemovalError] = useState("");
  const [removalSuccess, setRemovalSuccess] = useState("");
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [selectedBulkAssignment, setSelectedBulkAssignment] = useState<BulkAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");

  useEffect(() => {
    if (!removalSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRemovalSuccess("");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [removalSuccess]);

  useEffect(() => {
    let cancelled = false;

    const loadApplicants = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/assessment-center-assignments", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          applicants?: AssignedApplicant[];
          message?: string;
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load assigned applicants.");
        }

        if (!cancelled) {
          setApplicants(payload.applicants ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load assigned applicants.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadApplicants();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const individualApplicants = useMemo(
    () => applicants.filter((applicant) => !applicant.assignment_batch),
    [applicants],
  );

  const bulkAssignments = useMemo(() => {
    const batchMap = new Map<string, BulkAssignment>();

    applicants
      .filter((applicant) => applicant.assignment_batch)
      .forEach((applicant) => {
        const batchCode = applicant.assignment_batch ?? "";
        const assignmentTitle = applicant.assignment_title?.trim() || batchCode;
        const groupingKey = `${batchCode}:${assignmentTitle}:${applicant.center_name}`;
        const existing = batchMap.get(groupingKey);

        if (existing) {
          existing.applicantCount += 1;
          existing.assignmentIds.push(applicant.id);
          if (new Date(applicant.assigned_at).getTime() > new Date(existing.assignedAt).getTime()) {
            existing.assignedAt = applicant.assigned_at;
          }
          return;
        }

        batchMap.set(groupingKey, {
          assignmentIds: [applicant.id],
          applicantCount: 1,
          assignedAt: applicant.assigned_at,
          batchCode,
          centerName: applicant.center_name,
          id: applicant.id,
          qualification: applicant.qualification,
          title: assignmentTitle,
        });
      });

    return Array.from(batchMap.values()).sort(
      (left, right) => new Date(right.assignedAt).getTime() - new Date(left.assignedAt).getTime(),
    );
  }, [applicants]);

  const individualCourseOptions = useMemo(
    () => ["all", ...new Set(individualApplicants.map((applicant) => applicant.qualification))],
    [individualApplicants],
  );

  const bulkProgramOptions = useMemo(
    () => ["all", ...new Set(bulkAssignments.map((assignment) => assignment.qualification))],
    [bulkAssignments],
  );

  const filteredIndividualApplicants = useMemo(
    () =>
      individualApplicants.filter((applicant) => {
        const matchesCourse = individualCourseFilter === "all" || applicant.qualification === individualCourseFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          applicant.applicant_name.toLowerCase().includes(normalizedSearchQuery) ||
          applicant.qualification.toLowerCase().includes(normalizedSearchQuery) ||
          applicant.center_name.toLowerCase().includes(normalizedSearchQuery);

        return matchesCourse && matchesSearch;
      }),
    [individualApplicants, individualCourseFilter, normalizedSearchQuery],
  );

  const filteredBulkAssignments = useMemo(
    () =>
      bulkAssignments.filter((assignment) => {
        const matchesProgram = bulkProgramFilter === "all" || assignment.qualification === bulkProgramFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          assignment.batchCode.toLowerCase().includes(normalizedSearchQuery) ||
          assignment.title.toLowerCase().includes(normalizedSearchQuery) ||
          assignment.qualification.toLowerCase().includes(normalizedSearchQuery) ||
          assignment.centerName.toLowerCase().includes(normalizedSearchQuery);

        return matchesProgram && matchesSearch;
      }),
    [bulkAssignments, bulkProgramFilter, normalizedSearchQuery],
  );

  const topRightCount = activeTab === "individual" ? filteredIndividualApplicants.length : filteredBulkAssignments.length;
  const topRightLabel = activeTab === "individual" ? "Applicants" : "Batches";
  const selectedBulkApplicants = useMemo(
    () =>
      selectedBulkAssignment
        ? applicants
            .filter((applicant) => selectedBulkAssignment.assignmentIds.includes(applicant.id))
            .sort((left, right) => left.applicant_name.localeCompare(right.applicant_name))
        : [],
    [applicants, selectedBulkAssignment],
  );
  const filteredSelectedBulkApplicants = useMemo(
    () =>
      selectedBulkApplicants.filter((applicant) =>
        applicant.applicant_name.toLowerCase().includes(bulkSearch.trim().toLowerCase()),
      ),
    [bulkSearch, selectedBulkApplicants],
  );

  const closeRemovalFlow = () => {
    if (isRemovingAssignment) {
      return;
    }

    setRemovalTarget(null);
    setRemovalError("");
  };

  const handleRemoveAssignment = async () => {
    if (!removalTarget) {
      return;
    }

    setIsRemovingAssignment(true);
    setRemovalError("");

    try {
      const response = await fetch("/api/admin/assessment-center-assignments", {
        body: JSON.stringify({ assignmentIds: removalTarget.assignmentIds }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to remove assignment.");
      }

      setApplicants((currentApplicants) =>
        currentApplicants.filter((applicant) => !removalTarget.assignmentIds.includes(applicant.id)),
      );
      if (removalTarget.type === "bulk") {
        setIsBulkModalOpen(false);
        setSelectedBulkAssignment(null);
        setBulkSearch("");
      }
      setRemovalSuccess(
        removalTarget.type === "individual"
          ? `${removalTarget.title} was returned to the submitted queue.`
          : `${removalTarget.count} applicants from ${removalTarget.title} were returned to the submitted queue.`,
      );
      setRemovalTarget(null);
    } catch (removeError) {
      setRemovalError(removeError instanceof Error ? removeError.message : "Unable to remove assignment.");
    } finally {
      setIsRemovingAssignment(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Assigned Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Review applicants and school batches that have already been routed to assessment centers.
              </p>
            </div>

            <div className="flex min-h-[112px] w-full max-w-[196px] flex-col justify-center rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{topRightLabel}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none text-[#0b1c30]">{topRightCount}</p>
              <p className="mt-1 text-[11px] text-[#4563a5]">
                {activeTab === "individual" ? "Already assigned to centers" : "Bulk batches already routed"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#d9e3f7] bg-white px-4 py-3 shadow-sm sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-fit items-center rounded-full border border-[#c4c5d5] bg-white p-1 shadow-sm">
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

              <div className="flex flex-col gap-2 lg:min-w-[720px] lg:flex-row lg:items-center lg:justify-end">
                <label className="block flex-1 lg:max-w-[280px]">
                  <span className="sr-only">
                    {activeTab === "individual" ? "Search assigned applicants" : "Search assigned batches"}
                  </span>
                  <div className="group relative">
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                    />
                    <input
                      className="w-full rounded-lg border border-[#c4c5d5] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={activeTab === "individual" ? "Search assigned applicants..." : "Search assigned batches..."}
                      type="text"
                      value={searchQuery}
                    />
                  </div>
                </label>

                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-fit">
                  {activeTab === "individual" ? "Course Filter" : "Program Filter"}
                </p>
                <label className="block flex-1">
                  <span className="sr-only">{activeTab === "individual" ? "Filter by course" : "Filter by program"}</span>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                      onChange={(event) =>
                        activeTab === "individual"
                          ? setIndividualCourseFilter(event.target.value)
                          : setBulkProgramFilter(event.target.value)
                      }
                      value={activeTab === "individual" ? individualCourseFilter : bulkProgramFilter}
                    >
                      {(activeTab === "individual" ? individualCourseOptions : bulkProgramOptions).map((option) => (
                        <option key={option} value={option}>
                          {option === "all" ? `All ${activeTab === "individual" ? "Courses" : "Programs"}` : option}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                      <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                    </span>
                  </div>
                </label>

                {((activeTab === "individual" && individualCourseFilter !== "all") ||
                  (activeTab === "bulk" && bulkProgramFilter !== "all") ||
                  searchQuery.trim().length > 0) ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4def2] bg-[#eef4ff] px-4 py-2.5 text-[13px] font-bold text-[#093cab] transition hover:bg-[#e3edff]"
                    onClick={() => {
                      setSearchQuery("");
                      if (activeTab === "individual") {
                        setIndividualCourseFilter("all");
                        return;
                      }

                      setBulkProgramFilter("all");
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
        </section>

        {error ? (
          <div className="mb-4 rounded-[18px] border border-[#f3d6d6] bg-[#fff4f4] px-5 py-4 text-[13px] text-[#93000a]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading assigned applicants...</p>
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest routing history from assessment centers.</p>
          </div>
        ) : (
          <section>
            {activeTab === "individual" ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredIndividualApplicants.map((applicant) => (
                  <article key={applicant.id} className="rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{applicant.applicant_name}</p>
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{applicant.qualification}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Center</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">{applicant.center_name}</p>
                        </div>
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">
                            {formatAssignedDate(applicant.assigned_at)}
                          </p>
                        </div>
                        <a
                          className="inline-flex min-h-[38px] min-w-[104px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View PDF
                        </a>
                        <a
                          className="inline-flex min-h-[38px] min-w-[104px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                        >
                          Download
                        </a>
                        <button
                          className="inline-flex min-h-[38px] min-w-[104px] items-center justify-center rounded-lg border border-[#e4bcbc] bg-[#fff5f5] px-4 text-[12px] font-bold text-[#b24c4c] transition hover:bg-[#ffeaea]"
                          onClick={() =>
                            setRemovalTarget({
                              assignmentIds: [applicant.id],
                              centerName: applicant.center_name,
                              count: 1,
                              description: applicant.qualification,
                              title: applicant.applicant_name,
                              type: "individual",
                            })
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredIndividualApplicants.length === 0 ? (
                  <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                      <i
                        aria-hidden="true"
                        className={`fa-solid ${individualApplicants.length === 0 ? "fa-user-group" : "fa-filter-circle-xmark"} text-[18px]`}
                      />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                      {individualApplicants.length === 0
                        ? "No individual applicants have been assigned yet"
                        : "No assigned applicants match the current filters"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {individualApplicants.length === 0
                        ? "Individual applicant assignments will appear here after the admin routes them to a center."
                        : "Try another search or clear the filters to view all individual assignments."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBulkAssignments.map((assignment) => (
                  <article
                    key={`${assignment.batchCode}-${assignment.title}-${assignment.centerName}`}
                    className="cursor-pointer rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm transition hover:border-[#002576] hover:shadow-md"
                    onClick={() => {
                      setSelectedBulkAssignment(assignment);
                      setBulkSearch("");
                      setIsBulkModalOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedBulkAssignment(assignment);
                        setBulkSearch("");
                        setIsBulkModalOpen(true);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{assignment.title}</p>
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{assignment.qualification}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Center</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">{assignment.centerName}</p>
                        </div>
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Applicants</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">
                            {assignment.applicantCount} assigned
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">
                            {formatAssignedDate(assignment.assignedAt)}
                          </p>
                        </div>
                        <button
                          className="inline-flex min-h-[38px] min-w-[104px] items-center justify-center rounded-lg border border-[#e4bcbc] bg-[#fff5f5] px-4 text-[12px] font-bold text-[#b24c4c] transition hover:bg-[#ffeaea]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRemovalTarget({
                              assignmentIds: assignment.assignmentIds,
                              centerName: assignment.centerName,
                              count: assignment.applicantCount,
                              description: assignment.qualification,
                              title: assignment.title,
                              type: "bulk",
                            });
                          }}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredBulkAssignments.length === 0 ? (
                  <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                      <i
                        aria-hidden="true"
                        className={`fa-solid ${bulkAssignments.length === 0 ? "fa-layer-group" : "fa-filter-circle-xmark"} text-[18px]`}
                      />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                      {bulkAssignments.length === 0
                        ? "No bulk batches have been assigned yet"
                        : "No assigned batch submissions match the current filters"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {bulkAssignments.length === 0
                        ? "Bulk school assignments will appear here after the admin routes them to a center."
                        : "Try another search or clear the filters to view all assigned batch submissions."}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(isBulkModalOpen && selectedBulkAssignment)}
      >
        {selectedBulkAssignment ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">{selectedBulkAssignment.title}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Assigned applicants in this batch routed to {selectedBulkAssignment.centerName}.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setSelectedBulkAssignment(null);
                  setBulkSearch("");
                }}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#0b1c30]">Applicants</span>
                <span className="text-[12px] font-medium text-[#747685]">{selectedBulkApplicants.length} total</span>
              </div>

              <div className="mb-4">
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#c4c5d5] bg-white py-3 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setBulkSearch(event.target.value)}
                    placeholder="Search applicants..."
                    type="text"
                    value={bulkSearch}
                  />
                </div>
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {filteredSelectedBulkApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="flex flex-col gap-3 rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View PDF
                      </a>
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}

                {filteredSelectedBulkApplicants.length === 0 ? (
                  <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-6 text-center text-[13px] text-[#747685]">
                    No applicants found.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(removalTarget)}
        zIndexClassName="z-[60]"
      >
        {removalTarget ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Remove Assignment</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                This will return the assignment to the submitted queue so it can be routed again.
              </p>
            </div>

            <div className="space-y-4 rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              {removalError ? (
                <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#93000a]">
                  {removalError}
                </div>
              ) : null}

              <div className="rounded-lg border border-[#f7d9d9] bg-[#fff6f6] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#b24c4c]">Removing</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{removalTarget.title}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#5d4a4a]">{removalTarget.description}</p>
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#b24c4c]">
                  {removalTarget.count} {removalTarget.count === 1 ? "Applicant" : "Applicants"}
                </p>
              </div>

              <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Current Center</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{removalTarget.centerName}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                  {removalTarget.type === "individual"
                    ? "This applicant will be removed from the current center and shown again on the Submitted Applicants page."
                    : "This batch will be removed from the current center and all applicants in it will be shown again on the Submitted Applicants page."}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isRemovingAssignment}
                  onClick={closeRemovalFlow}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[136px] items-center justify-center rounded-lg bg-[#c65a5a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#b84d4d] disabled:cursor-not-allowed disabled:bg-[#d2a3a3]"
                  disabled={isRemovingAssignment}
                  onClick={handleRemoveAssignment}
                  type="button"
                >
                  {isRemovingAssignment ? "Removing..." : "Remove Assignment"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      {removalSuccess ? (
        <div className="pointer-events-none fixed inset-x-4 top-6 z-[70] flex justify-center lg:left-64 lg:right-8 lg:justify-end">
          <div className="ui-modal-pop pointer-events-auto w-full max-w-[360px] rounded-[18px] border border-[#bfe3cc] bg-[#edf9f1] px-5 py-4 shadow-[0_20px_40px_rgba(31,122,69,0.16)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f0e1] text-[#1f7a45]">
                <i aria-hidden="true" className="fa-solid fa-check text-[14px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#1f7a45]">Assignment Removed</p>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#215c36]">{removalSuccess}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

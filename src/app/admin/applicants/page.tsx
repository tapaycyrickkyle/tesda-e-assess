"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";

type SubmittedApplicant = {
  applicant_email: string;
  applicant_id: string;
  applicant_name: string;
  contact_number: string | null;
  form_data: {
    qualificationTitle: string;
  };
  id: string;
  qualification_title: string;
  qualification_type: string;
  room:
    | {
        id: string;
        join_code: string;
        name: string;
        qualification: string;
      }
    | null;
  room_id: string | null;
  submission_source: "individual" | "room";
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: "submitted_to_admin";
};

type AssessmentCenterOption = {
  address: string;
  id: string;
  name: string;
};

type AssignmentTarget =
  | {
      applicants: { id: string; name: string; qualification: string }[];
      applicantCount: number;
      assignmentBatch: string | null;
      assignmentTitle: string | null;
      description: string;
      title: string;
      type: "individual";
    }
  | {
      applicants: { id: string; name: string; qualification: string }[];
      applicantCount: number;
      assignmentBatch: string;
      assignmentTitle: string;
      description: string;
      title: string;
      type: "bulk";
    };

type BulkSubmissionGroup = {
  applicants: SubmittedApplicant[];
  applicantCount: number;
  batchCode: string;
  id: string;
  qualification: string;
  submittedAt: string;
  title: string;
};

const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";

export default function AdminApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [assessmentCenters, setAssessmentCenters] = useState<AssessmentCenterOption[]>([]);
  const [centersError, setCentersError] = useState("");
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedBulkSubmission, setSelectedBulkSubmission] = useState<BulkSubmissionGroup | null>(null);
  const [submissions, setSubmissions] = useState<SubmittedApplicant[]>([]);
  const [submissionsError, setSubmissionsError] = useState("");
  const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [isAssignmentConfirmOpen, setIsAssignmentConfirmOpen] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");

  useEffect(() => {
    if (!assignmentSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAssignmentSuccess("");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [assignmentSuccess]);

  useEffect(() => {
    let cancelled = false;

    const loadAssessmentCenters = async () => {
      setIsLoadingCenters(true);
      setCentersError("");

      try {
        const response = await fetch("/api/admin/assessment-centers", { credentials: "same-origin" });
        const payload = (await response.json()) as {
          centers?: AssessmentCenterOption[];
          message?: string;
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load assessment centers.");
        }

        if (!cancelled) {
          setAssessmentCenters(payload.centers ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setCentersError(error instanceof Error ? error.message : "Unable to load assessment centers.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCenters(false);
        }
      }
    };

    void loadAssessmentCenters();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSubmittedApplicants = async () => {
      setIsLoadingSubmissions(true);
      setSubmissionsError("");

      try {
        const response = await fetch("/api/admin/submitted-applicants", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          message?: string;
          submissions?: SubmittedApplicant[];
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load submitted applicants.");
        }

        if (!cancelled) {
          setSubmissions(payload.submissions ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSubmissionsError(error instanceof Error ? error.message : "Unable to load submitted applicants.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSubmissions(false);
        }
      }
    };

    void loadSubmittedApplicants();

    return () => {
      cancelled = true;
    };
  }, []);

  const individualApplicants = useMemo(
    () => submissions.filter((submission) => submission.submission_source === "individual" || !submission.room_id),
    [submissions],
  );

  const bulkSubmissions = useMemo(() => {
    const groupMap = new Map<string, BulkSubmissionGroup>();

    submissions
      .filter((submission) => submission.submission_source === "room" && submission.room)
      .forEach((submission) => {
        const room = submission.room!;
        const existing = groupMap.get(room.id);

        if (existing) {
          existing.applicants.push(submission);
          existing.applicantCount += 1;
          if (new Date(submission.teacher_forwarded_at ?? submission.submitted_at).getTime() > new Date(existing.submittedAt).getTime()) {
            existing.submittedAt = submission.teacher_forwarded_at ?? submission.submitted_at;
          }
          return;
        }

        groupMap.set(room.id, {
          applicants: [submission],
          applicantCount: 1,
          batchCode: room.join_code,
          id: room.id,
          qualification: room.qualification || submission.qualification_title,
          submittedAt: submission.teacher_forwarded_at ?? submission.submitted_at,
          title: room.name,
        });
      });

    return Array.from(groupMap.values()).sort(
      (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    );
  }, [submissions]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const individualCourseOptions = useMemo(
    () => ["all", ...new Set(individualApplicants.map((applicant) => applicant.qualification_title))],
    [individualApplicants],
  );
  const bulkProgramOptions = useMemo(
    () => ["all", ...new Set(bulkSubmissions.map((submission) => submission.qualification))],
    [bulkSubmissions],
  );

  const filteredIndividualApplicants = useMemo(
    () =>
      individualApplicants.filter((applicant) => {
        const matchesCourse = individualCourseFilter === "all" || applicant.qualification_title === individualCourseFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          applicant.applicant_name.toLowerCase().includes(normalizedSearchQuery) ||
          applicant.qualification_title.toLowerCase().includes(normalizedSearchQuery) ||
          applicant.applicant_email.toLowerCase().includes(normalizedSearchQuery);

        return matchesCourse && matchesSearch;
      }),
    [individualApplicants, individualCourseFilter, normalizedSearchQuery],
  );

  const filteredBulkSubmissions = useMemo(
    () =>
      bulkSubmissions.filter((submission) => {
        const matchesProgram = bulkProgramFilter === "all" || submission.qualification === bulkProgramFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          submission.title.toLowerCase().includes(normalizedSearchQuery) ||
          submission.batchCode.toLowerCase().includes(normalizedSearchQuery) ||
          submission.qualification.toLowerCase().includes(normalizedSearchQuery);

        return matchesProgram && matchesSearch;
      }),
    [bulkProgramFilter, bulkSubmissions, normalizedSearchQuery],
  );

  const filteredBulkApplicants = useMemo(
    () =>
      selectedBulkSubmission
        ? selectedBulkSubmission.applicants.filter((applicant) =>
            applicant.applicant_name.toLowerCase().includes(bulkSearch.trim().toLowerCase()),
          )
        : [],
    [bulkSearch, selectedBulkSubmission],
  );

  const topRightCount = activeTab === "individual" ? filteredIndividualApplicants.length : filteredBulkSubmissions.length;
  const topRightLabel = activeTab === "individual" ? "Applicants" : "Schools";
  const selectedCenter = assessmentCenters.find((center) => center.id === selectedCenterId) ?? null;

  const openAssignmentModal = (target: AssignmentTarget) => {
    setAssignmentTarget(target);
    setSelectedCenterId(null);
    setIsAssignmentConfirmOpen(false);
    setAssignmentError("");
    setAssignmentSuccess("");
  };

  const closeAssignmentFlow = () => {
    setAssignmentTarget(null);
    setSelectedCenterId(null);
    setIsAssignmentConfirmOpen(false);
    setAssignmentError("");
  };

  const handleConfirmAssignment = async () => {
    if (!assignmentTarget || !selectedCenter) {
      return;
    }

    setIsSavingAssignment(true);
    setAssignmentError("");

    try {
      const response = await fetch("/api/admin/assessment-center-assignments", {
        body: JSON.stringify({
          applicants: assignmentTarget.applicants.map((applicant) => ({
            applicantName: applicant.name,
            applicantReference: applicant.id,
            assignmentBatch: assignmentTarget.assignmentBatch,
            assignmentTitle: assignmentTarget.assignmentTitle,
            qualification: applicant.qualification,
          })),
          assessmentCenterId: selectedCenter.id,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to assign applicants.");
      }

      const assignedApplicantIds = new Set(assignmentTarget.applicants.map((applicant) => applicant.id));
      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter((submission) => !assignedApplicantIds.has(submission.id)),
      );

      if (assignmentTarget.type === "bulk") {
        setSelectedBulkSubmission(null);
        setIsBulkModalOpen(false);
        setBulkSearch("");
      }

      setAssignmentSuccess(
        assignmentTarget.type === "individual"
          ? `${assignmentTarget.title} assigned to ${selectedCenter.name}.`
          : `${assignmentTarget.applicantCount} applicants assigned to ${selectedCenter.name}.`,
      );
      closeAssignmentFlow();
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to assign applicants.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Submitted Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Manage and review real applicant submissions coming from the new individual and teacher-batched form flows.
              </p>
            </div>

            <div className="flex min-h-[112px] w-full max-w-[196px] flex-col justify-center rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{topRightLabel}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none text-[#0b1c30]">{topRightCount}</p>
              <p className="mt-1 text-[11px] text-[#4563a5]">
                {activeTab === "individual" ? "Ready for assessment assignment" : "Submitted school batches"}
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
                    {activeTab === "individual" ? "Search submitted applicants" : "Search submitted batches"}
                  </span>
                  <div className="group relative">
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                    />
                    <input
                      className="w-full rounded-lg border border-[#c4c5d5] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={activeTab === "individual" ? "Search applicants..." : "Search batches..."}
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

        {submissionsError ? (
          <div className="mb-4 rounded-[18px] border border-[#f3dfb2] bg-[#fff8e8] px-5 py-4 text-[13px] text-[#7f5b00]">
            {submissionsError}
          </div>
        ) : null}

        {isLoadingSubmissions ? (
          <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading submitted applicants...</p>
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest individual and bulk submissions.</p>
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
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{applicant.qualification_title}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                        <a
                          className="inline-flex min-w-[108px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          href={buildApplicationSubmissionPdfUrl(applicant.id)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View PDF
                        </a>
                        <a
                          className="inline-flex min-w-[108px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          href={buildApplicationSubmissionPdfUrl(applicant.id, { download: true })}
                        >
                          Download
                        </a>
                        <button
                          className="inline-flex min-w-[128px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                          onClick={() =>
                            openAssignmentModal({
                              applicants: [
                                {
                                  id: applicant.id,
                                  name: applicant.applicant_name,
                                  qualification: applicant.qualification_title,
                                },
                              ],
                              applicantCount: 1,
                              assignmentBatch: null,
                              assignmentTitle: null,
                              description: applicant.qualification_title,
                              title: applicant.applicant_name,
                              type: "individual",
                            })
                          }
                          type="button"
                        >
                          Assign Center
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredIndividualApplicants.length === 0 ? (
                  <EmptyState
                    body={
                      individualApplicants.length === 0
                        ? "New individual website submissions will appear here as soon as applicants send them directly to admin."
                        : "Try another search or clear the filters to view all submitted applicants."
                    }
                    icon={individualApplicants.length === 0 ? "fa-circle-check" : "fa-filter-circle-xmark"}
                    title={
                      individualApplicants.length === 0
                        ? "No individual applicants are waiting right now"
                        : "No applicants match the current filters"
                    }
                  />
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBulkSubmissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="cursor-pointer rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm transition hover:border-[#002576] hover:shadow-md"
                    onClick={() => {
                      setSelectedBulkSubmission(submission);
                      setBulkSearch("");
                      setIsBulkModalOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedBulkSubmission(submission);
                        setBulkSearch("");
                        setIsBulkModalOpen(true);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{submission.title}</p>
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{submission.qualification}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-4 py-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Applicants</p>
                          <p className="mt-1 text-[13px] font-medium text-[#0b1c30]">{submission.applicantCount} ready</p>
                        </div>
                        <button
                          className="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAssignmentModal({
                              applicants: submission.applicants.map((applicant) => ({
                                id: applicant.id,
                                name: applicant.applicant_name,
                                qualification: applicant.qualification_title,
                              })),
                              applicantCount: submission.applicantCount,
                              assignmentBatch: submission.batchCode,
                              assignmentTitle: submission.title,
                              description: submission.qualification,
                              title: submission.title,
                              type: "bulk",
                            });
                          }}
                          type="button"
                        >
                          Assign Center
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredBulkSubmissions.length === 0 ? (
                  <EmptyState
                    body={
                      bulkSubmissions.length === 0
                        ? "Teacher-forwarded room batches will appear here after all room applicants complete the new web form."
                        : "Try another search or clear the filters to view all submitted school batches."
                    }
                    icon={bulkSubmissions.length === 0 ? "fa-layer-group" : "fa-filter-circle-xmark"}
                    title={
                      bulkSubmissions.length === 0
                        ? "No bulk submissions are waiting right now"
                        : "No batch submissions match the current filters"
                    }
                  />
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(isBulkModalOpen && selectedBulkSubmission)}
      >
        {selectedBulkSubmission ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">{selectedBulkSubmission.title}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Applicants who completed the room-based web application and were forwarded by the teacher.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setSelectedBulkSubmission(null);
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
                <span className="text-[12px] font-medium text-[#747685]">{selectedBulkSubmission.applicantCount} total</span>
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
                {filteredBulkApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="flex flex-col gap-3 rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                      <p className="mt-1 truncate text-[13px] text-[#5d5f5f]">{applicant.qualification_title}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={buildApplicationSubmissionPdfUrl(applicant.id)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View PDF
                      </a>
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={buildApplicationSubmissionPdfUrl(applicant.id, { download: true })}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}

                {filteredBulkApplicants.length === 0 ? (
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(assignmentTarget && !isAssignmentConfirmOpen)}
      >
        {assignmentTarget ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-4 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Assign Assessment Center</h2>
                <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">
                  Choose an assessment center for {assignmentTarget.title}.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={closeAssignmentFlow}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="space-y-3 rounded-b-[24px] bg-[#f8fbff] px-6 py-4 sm:px-7">
              {assignmentError ? (
                <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#93000a]">
                  {assignmentError}
                </div>
              ) : null}

              <div className="rounded-lg border border-[#cfe0ff] bg-[#eef4ff] px-4 py-3.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Assigning</p>
                <div className="mt-2.5 min-w-0">
                  <p className="text-[15px] font-bold text-[#0b1c30]">{assignmentTarget.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[#44506a]">{assignmentTarget.description}</p>
                  <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4563a5]">
                    {assignmentTarget.applicantCount} {assignmentTarget.applicantCount === 1 ? "Applicant" : "Applicants"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#0b1c30]">Choose Assessment Center</p>
                    <p className="mt-0.5 text-[12px] leading-[1.45] text-[#747685]">
                      Select one destination from the list for this assignment.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#747685] shadow-sm">
                    {isLoadingCenters ? "Loading..." : `${assessmentCenters.length} options`}
                  </span>
                </div>

                {centersError ? <p className="mb-2.5 text-[12px] text-[#93000a]">{centersError}</p> : null}

                <div className="space-y-2.5">
                  <label className="block">
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                        disabled={isLoadingCenters || assessmentCenters.length === 0}
                        onChange={(event) => setSelectedCenterId(event.target.value || null)}
                        value={selectedCenterId ?? ""}
                      >
                        <option value="">Select assessment center</option>
                        {assessmentCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                        <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                      </span>
                    </div>
                  </label>

                  {selectedCenter ? (
                    <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Selected Center</p>
                      <p className="mt-2.5 text-[15px] font-bold text-[#0b1c30]">{selectedCenter.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{selectedCenter.address}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={closeAssignmentFlow}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                  disabled={!selectedCenter || isLoadingCenters || assessmentCenters.length === 0}
                  onClick={() => setIsAssignmentConfirmOpen(true)}
                  type="button"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(assignmentTarget && selectedCenter && isAssignmentConfirmOpen)}
        zIndexClassName="z-[60]"
      >
        {assignmentTarget && selectedCenter ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Confirm Assignment</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                Please confirm the assessment center assignment below.
              </p>
            </div>

            <div className="space-y-4 rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              {assignmentError ? (
                <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#93000a]">
                  {assignmentError}
                </div>
              ) : null}

              <div className="rounded-lg border border-[#cfe0ff] bg-[#eef4ff] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Assigning</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{assignmentTarget.title}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#44506a]">{assignmentTarget.description}</p>
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4563a5]">
                  {assignmentTarget.applicantCount} {assignmentTarget.applicantCount === 1 ? "Applicant" : "Applicants"}
                </p>
              </div>

              <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Selected Center</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{selectedCenter.name}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{selectedCenter.address}</p>
              </div>

              <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-4">
                <p className="text-[13px] leading-[1.6] text-[#0b1c30]">
                  {assignmentTarget.type === "individual"
                    ? `Assign this applicant to ${selectedCenter.name}?`
                    : `Assign these ${assignmentTarget.applicantCount} applicants to ${selectedCenter.name}?`}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isSavingAssignment}
                  onClick={() => setIsAssignmentConfirmOpen(false)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                  disabled={isSavingAssignment}
                  onClick={handleConfirmAssignment}
                  type="button"
                >
                  {isSavingAssignment ? "Assigning..." : "Confirm"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      {assignmentSuccess ? (
        <div className="pointer-events-none fixed inset-x-4 top-6 z-[70] flex justify-center lg:left-64 lg:right-8 lg:justify-end">
          <div className="ui-modal-pop pointer-events-auto w-full max-w-[360px] rounded-[18px] border border-[#bfe3cc] bg-[#edf9f1] px-5 py-4 shadow-[0_20px_40px_rgba(31,122,69,0.16)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f0e1] text-[#1f7a45]">
                <i aria-hidden="true" className="fa-solid fa-check text-[14px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#1f7a45]">Assignment Complete</p>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#215c36]">{assignmentSuccess}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EmptyState({ body, icon, title }: { body: string; icon: string; title: string }) {
  return (
    <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
        <i aria-hidden="true" className={`fa-solid ${icon} text-[18px]`} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">{title}</p>
      <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">{body}</p>
    </div>
  );
}

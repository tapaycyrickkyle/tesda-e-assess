"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import PdfActionsMenu from "@/components/PdfActionsMenu";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationToast from "@/components/notifications/NotificationToast";
import { parseApiResponse } from "@/lib/api-response";

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

type AssignmentApplicant = {
  assignmentGroupKey: string | null;
  assignmentGroupNumber: number | null;
  id: string;
  name: string;
  qualification: string;
};

type AssignmentTarget =
  | {
      applicants: AssignmentApplicant[];
      applicantCount: number;
      assignmentBatch: string | null;
      assignmentGroupKey: string | null;
      assignmentGroupNumber: number | null;
      assignmentTitle: string | null;
      description: string;
      title: string;
      type: "individual";
    }
  | {
      applicants: AssignmentApplicant[];
      applicantCount: number;
      assignmentBatch: string;
      assignmentGroupKey: string;
      assignmentGroupNumber: number;
      assignmentTitle: string;
      description: string;
      title: string;
      type: "bulk";
    };

type BulkSubmissionGroup = {
  applicants: SubmittedApplicant[];
  applicantCount: number;
  batchCode: string;
  groupKey: string;
  groupNumber: number;
  id: string;
  qualification: string;
  submittedAt: string;
  title: string;
};

type CorrectionRequestTarget = {
  applicantCount: number;
  submissionIds: string[];
  title: string;
};

const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";
const secondaryActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff] sm:min-w-[128px] sm:w-auto";
const assignCenterButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg bg-[#002576] px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] sm:min-w-[128px] sm:w-auto";
const warningActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg bg-[#002576] px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] sm:min-w-[128px] sm:w-auto";
const tabInlineCountClass =
  "pointer-events-none absolute -right-1 -top-0.5 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#d92d20] text-[9px] font-bold leading-none text-white shadow-[0_6px_16px_rgba(217,45,32,0.22)]";
const summaryCardClass =
  "flex min-h-[120px] flex-col rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
const summaryIconClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e3f7] bg-white text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function chunkSubmissions<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [assessmentCenters, setAssessmentCenters] = useState<AssessmentCenterOption[]>([]);
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessor, setAssessor] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget | null>(null);
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");
  const [bulkSearch, setBulkSearch] = useState("");
  const [centersError, setCentersError] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionTarget, setCorrectionTarget] = useState<CorrectionRequestTarget | null>(null);
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [isAssignmentConfirmOpen, setIsAssignmentConfirmOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isRequestingCorrection, setIsRequestingCorrection] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBulkSubmission, setSelectedBulkSubmission] = useState<BulkSubmissionGroup | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmittedApplicant[]>([]);
  const [submissionsError, setSubmissionsError] = useState("");

  useEffect(() => {
    if (!assignmentSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAssignmentSuccess("");
    }, 4500);

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
        const payload = await parseApiResponse<{
          centers?: AssessmentCenterOption[];
          message?: string;
          success?: boolean;
        }>(response);

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
        const payload = await parseApiResponse<{
          message?: string;
          submissions?: SubmittedApplicant[];
          success?: boolean;
        }>(response);

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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const selectedCenter = assessmentCenters.find((center) => center.id === selectedCenterId) ?? null;

  const individualApplicants = useMemo(
    () => submissions.filter((submission) => submission.submission_source === "individual" || !submission.room_id),
    [submissions],
  );

  const bulkSubmissions = useMemo(() => {
    const roomMap = new Map<
      string,
      {
        applicants: SubmittedApplicant[];
        batchCode: string;
        qualification: string;
        title: string;
      }
    >();

    submissions
      .filter((submission) => submission.submission_source === "room" && submission.room)
      .forEach((submission) => {
        const room = submission.room!;
        const existing = roomMap.get(room.id);

        if (existing) {
          existing.applicants.push(submission);
          return;
        }

        roomMap.set(room.id, {
          applicants: [submission],
          batchCode: room.join_code,
          qualification: room.qualification || submission.qualification_title,
          title: room.name,
        });
      });

    return Array.from(roomMap.entries())
      .flatMap(([roomId, roomGroup]) => {
        const sortedApplicants = [...roomGroup.applicants].sort(
          (left, right) =>
            new Date(left.teacher_forwarded_at ?? left.submitted_at).getTime() -
            new Date(right.teacher_forwarded_at ?? right.submitted_at).getTime(),
        );

        return chunkSubmissions(sortedApplicants, 10).map((chunk, index) => {
          const submittedAt = chunk.reduce((latest, applicant) => {
            const currentValue = applicant.teacher_forwarded_at ?? applicant.submitted_at;
            return new Date(currentValue).getTime() > new Date(latest).getTime() ? currentValue : latest;
          }, chunk[0]?.teacher_forwarded_at ?? chunk[0]?.submitted_at ?? new Date().toISOString());
          const groupNumber = index + 1;

          return {
            applicants: chunk,
            applicantCount: chunk.length,
            batchCode: roomGroup.batchCode,
            groupKey: `${roomId}:group:${groupNumber}`,
            groupNumber,
            id: `${roomId}:group:${groupNumber}`,
            qualification: roomGroup.qualification,
            submittedAt,
            title: roomGroup.title,
          } satisfies BulkSubmissionGroup;
        });
      })
      .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
  }, [submissions]);

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

  const openAssignmentModal = (target: AssignmentTarget) => {
    setAssignmentTarget(target);
    setSelectedCenterId(null);
    setAssessmentDate("");
    setAssessor("");
    setIsAssignmentConfirmOpen(false);
    setAssignmentError("");
  };

  const closeAssignmentFlow = () => {
    setAssignmentTarget(null);
    setSelectedCenterId(null);
    setAssessmentDate("");
    setAssessor("");
    setIsAssignmentConfirmOpen(false);
    setAssignmentError("");
  };

  const openCorrectionModal = (target: CorrectionRequestTarget) => {
    setCorrectionTarget(target);
    setCorrectionReason("");
    setAssignmentError("");
  };

  const handleConfirmAssignment = async () => {
    if (!assignmentTarget || !selectedCenter || !assessmentDate || !assessor.trim()) {
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
            assignmentGroupKey: applicant.assignmentGroupKey,
            assignmentGroupNumber: applicant.assignmentGroupNumber,
            assignmentTitle: assignmentTarget.assignmentTitle,
            qualification: applicant.qualification,
          })),
          assessmentCenterId: selectedCenter.id,
          assessmentDate,
          assessor: assessor.trim(),
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = await parseApiResponse<{ message?: string; success?: boolean }>(response);

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
          ? `${assignmentTarget.title} assigned to ${selectedCenter.name} on ${assessmentDate}.`
          : `${assignmentTarget.applicantCount} applicants assigned to ${selectedCenter.name} on ${assessmentDate}.`,
      );
      closeAssignmentFlow();
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to assign applicants.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!correctionTarget || !correctionReason.trim()) {
      return;
    }

    setIsRequestingCorrection(true);
    setAssignmentError("");

    try {
      const response = await fetch("/api/admin/application-submissions", {
        body: JSON.stringify({
          action: "request_update",
          reason: correctionReason.trim(),
          submissionIds: correctionTarget.submissionIds,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = await parseApiResponse<{ message?: string; success?: boolean }>(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to return the submission for applicant correction.");
      }

      const returnedSubmissionIds = new Set(correctionTarget.submissionIds);
      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter((submission) => !returnedSubmissionIds.has(submission.id)),
      );

      if (selectedBulkSubmission?.applicants.some((applicant) => returnedSubmissionIds.has(applicant.id))) {
        const remainingApplicants = selectedBulkSubmission.applicants.filter((applicant) => !returnedSubmissionIds.has(applicant.id));
        if (remainingApplicants.length === 0) {
          setIsBulkModalOpen(false);
          setSelectedBulkSubmission(null);
          setBulkSearch("");
        } else {
          setSelectedBulkSubmission({
            ...selectedBulkSubmission,
            applicants: remainingApplicants,
            applicantCount: remainingApplicants.length,
          });
        }
      }

      setCorrectionTarget(null);
      setCorrectionReason("");
      setAssignmentSuccess(payload.message ?? "Submission returned to the applicant for correction.");
    } catch (error) {
      setAssignmentError(
        error instanceof Error ? error.message : "Unable to return the submission for applicant correction.",
      );
    } finally {
      setIsRequestingCorrection(false);
    }
  };

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-2.5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="ui-page-title text-[#002576]">Queue</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Review incoming individual and bulk submissions, return corrections to applicants, and route ready applicants to assessment centers.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className={summaryCardClass}>
                <div className="flex min-h-[44px] items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Individual</p>
                    <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">Direct submissions</p>
                  </div>
                  <span aria-hidden="true" className={`${summaryIconClass} text-[#002576]`}>
                    <i className="fa-solid fa-user" />
                  </span>
                </div>
                <div className="mt-auto flex min-h-[48px] items-center justify-center pt-3 text-center">
                  <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0b1c30] tabular-nums">
                    {individualApplicants.length.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={summaryCardClass}>
                <div className="flex min-h-[44px] items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Bulk Groups</p>
                    <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">Room batches split by 10</p>
                  </div>
                  <span aria-hidden="true" className={`${summaryIconClass} text-[#3056c4]`}>
                    <i className="fa-solid fa-layer-group" />
                  </span>
                </div>
                <div className="mt-auto flex min-h-[48px] items-center justify-center pt-3 text-center">
                  <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0b1c30] tabular-nums">
                    {bulkSubmissions.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-3">
          <div className="flex justify-center">
            <div className="inline-flex w-[240px] max-w-full items-center rounded-full border border-[#d9e3f7] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              {(["individual", "bulk"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`relative min-w-0 flex-1 rounded-full px-3.5 py-2 text-[13px] transition sm:px-4 ${
                    activeTab === tab ? "bg-[#002576] font-bold text-white" : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  <span className="flex items-center justify-center">{tab === "individual" ? "Individual" : "Bulk"}</span>
                  {(tab === "individual" ? filteredIndividualApplicants.length : filteredBulkSubmissions.length) > 0 ? (
                    <span className={tabInlineCountClass}>
                      {tab === "individual" ? filteredIndividualApplicants.length : filteredBulkSubmissions.length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 border-t border-[#e7edf4] px-4 pb-2 pt-3 sm:px-0">
            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
              <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 xl:w-full xl:max-w-[520px]">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[64px]">Search</span>
                <div className="group relative min-w-0 flex-1">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={activeTab === "individual" ? "Search applicants..." : "Search batch groups..."}
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </label>

              <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 xl:ml-auto xl:w-full xl:max-w-[360px]">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[108px]">Program Filter</span>
                <div className="relative min-w-0 flex-1">
                  <select
                    className="w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
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
            </div>
          </div>
        </section>

        {submissionsError ? <NotificationBanner className="mb-4" message={submissionsError} variant="warning" /> : null}

        {isLoadingSubmissions ? (
          <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading submitted applicants...</p>
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest individual and bulk submissions.</p>
          </div>
        ) : (
          <section>
            {activeTab === "individual" ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredIndividualApplicants.map((applicant) => (
                  <article
                    className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fcfdff] sm:px-5"
                    key={applicant.id}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{applicant.applicant_name}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#444653]">{applicant.qualification_title}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                        <PdfActionsMenu submissionId={applicant.id} />
                        <button
                          className={warningActionButtonClass}
                          onClick={() =>
                            openCorrectionModal({
                              applicantCount: 1,
                              submissionIds: [applicant.id],
                              title: applicant.applicant_name,
                            })
                          }
                          type="button"
                        >
                          Request Update
                        </button>
                        <button
                          className={assignCenterButtonClass}
                          onClick={() =>
                            openAssignmentModal({
                              applicants: [
                                {
                                  assignmentGroupKey: null,
                                  assignmentGroupNumber: null,
                                  id: applicant.id,
                                  name: applicant.applicant_name,
                                  qualification: applicant.qualification_title,
                                },
                              ],
                              applicantCount: 1,
                              assignmentBatch: null,
                              assignmentGroupKey: null,
                              assignmentGroupNumber: null,
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
              <div className="grid grid-cols-1 gap-2.5">
                {filteredBulkSubmissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fcfdff] sm:px-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{submission.title}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#444653]">{submission.qualification}</p>
                        <p className="mt-1 text-[12px] text-[#747685]">
                          {submission.applicantCount} applicants | Forwarded {formatSubmittedAt(submission.submittedAt)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                        <button
                          className={secondaryActionButtonClass}
                          onClick={() => {
                            setSelectedBulkSubmission(submission);
                            setBulkSearch("");
                            setIsBulkModalOpen(true);
                          }}
                          type="button"
                        >
                          Open
                        </button>
                        <button
                          className={assignCenterButtonClass}
                          onClick={() =>
                            openAssignmentModal({
                              applicants: submission.applicants.map((applicant) => ({
                                assignmentGroupKey: submission.groupKey,
                                assignmentGroupNumber: submission.groupNumber,
                                id: applicant.id,
                                name: applicant.applicant_name,
                                qualification: applicant.qualification_title,
                              })),
                              applicantCount: submission.applicantCount,
                              assignmentBatch: submission.batchCode,
                              assignmentGroupKey: submission.groupKey,
                              assignmentGroupNumber: submission.groupNumber,
                              assignmentTitle: submission.title,
                              description: `${submission.qualification} | ${submission.batchCode}`,
                              title: submission.title,
                              type: "bulk",
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

                {filteredBulkSubmissions.length === 0 ? (
                  <EmptyState
                    body={
                      bulkSubmissions.length === 0
                        ? "Teacher-forwarded room batches will appear here after all room applicants complete the web form."
                        : "Try another search or clear the filters to view all submitted room groups."
                    }
                    icon={bulkSubmissions.length === 0 ? "fa-layer-group" : "fa-filter-circle-xmark"}
                    title={
                      bulkSubmissions.length === 0
                        ? "No bulk groups are waiting right now"
                        : "No batch groups match the current filters"
                    }
                  />
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[760px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(isBulkModalOpen && selectedBulkSubmission)}
      >
        {selectedBulkSubmission ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-5 py-4 sm:px-6">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">{selectedBulkSubmission.title}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Applicants who completed the room-based web application and are ready for routing from this batch.
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

            <div className="ui-modal-section px-5 py-4 sm:px-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#0b1c30]">Applicants</span>
                <span className="text-[12px] font-medium text-[#747685]">{selectedBulkSubmission.applicantCount} total</span>
              </div>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Search Applicants</span>
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white py-3 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setBulkSearch(event.target.value)}
                    placeholder="Search applicants..."
                    type="text"
                    value={bulkSearch}
                  />
                </div>
              </label>

              <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
                {filteredBulkApplicants.map((applicant) => (
                  <div
                    className="grid gap-3 border-t border-[#e7edf4] px-1 py-3 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    key={applicant.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                      <p className="mt-1 truncate text-[13px] text-[#5d5f5f]">{applicant.qualification_title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <PdfActionsMenu submissionId={applicant.id} />
                      <button
                        className={warningActionButtonClass}
                        onClick={() =>
                          openCorrectionModal({
                            applicantCount: 1,
                            submissionIds: [applicant.id],
                            title: applicant.applicant_name,
                          })
                        }
                        type="button"
                      >
                        Request Update
                      </button>
                    </div>
                  </div>
                ))}

                {filteredBulkApplicants.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[13px] text-[#747685]">No applicants found.</div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(assignmentTarget && !isAssignmentConfirmOpen)}
      >
        {assignmentTarget ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-4 sm:px-7">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">Assign Assessment Center</h2>
                <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">
                  Choose an assessment center, assessment date, and assessor for {assignmentTarget.title}.
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

            <div className="ui-modal-section space-y-4 px-6 py-4 sm:px-7">
              {assignmentError ? <NotificationBanner compact message={assignmentError} variant="error" /> : null}

              <div className="border-t border-[#dbe6fb] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Assigning</p>
                <div className="mt-2.5 min-w-0">
                  <p className="text-[15px] font-bold text-[#0b1c30]">{assignmentTarget.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[#44506a]">{assignmentTarget.description}</p>
                  <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4563a5]">
                    {assignmentTarget.applicantCount} {assignmentTarget.applicantCount === 1 ? "Applicant" : "Applicants"}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Choose Assessment Center</span>
                {centersError ? <p className="mb-2.5 text-[12px] text-[#93000a]">{centersError}</p> : null}
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
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

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Assessment Date</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setAssessmentDate(event.target.value)}
                  type="date"
                  value={assessmentDate}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Assessor</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setAssessor(event.target.value)}
                  placeholder="Enter assessor name"
                  type="text"
                  value={assessor}
                />
              </label>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={closeAssignmentFlow}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                  disabled={!selectedCenter || !assessmentDate || !assessor.trim()}
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(assignmentTarget && selectedCenter && isAssignmentConfirmOpen)}
        zIndexClassName="z-[60]"
      >
        {assignmentTarget && selectedCenter ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Confirm Assignment</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                Please confirm the assessment center assignment below.
              </p>
            </div>

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              {assignmentError ? <NotificationBanner compact message={assignmentError} variant="error" /> : null}

              <div className="border-t border-[#dbe6fb] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Assigning</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{assignmentTarget.title}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#44506a]">{assignmentTarget.description}</p>
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4563a5]">
                  {assignmentTarget.applicantCount} {assignmentTarget.applicantCount === 1 ? "Applicant" : "Applicants"}
                </p>
              </div>

              <div className="border-t border-[#e7edf4] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Selected Center</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{selectedCenter.name}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{selectedCenter.address}</p>
              </div>

              <div className="border-t border-[#e7edf4] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Schedule</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{assessmentDate}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">Assessor: {assessor.trim()}</p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
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

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(correctionTarget)}
        zIndexClassName="z-[60]"
      >
        {correctionTarget ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Request Applicant Update</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                Return this submission to the applicant with clear correction instructions.
              </p>
            </div>

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              {assignmentError ? <NotificationBanner compact message={assignmentError} variant="error" /> : null}

              <div className="border-t border-[#f1d8bf] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a5200]">Returning</p>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{correctionTarget.title}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                  {correctionTarget.applicantCount === 1
                    ? "The applicant will be able to edit and resubmit the same submission record."
                    : `${correctionTarget.applicantCount} applicants will be able to edit and resubmit their submissions.`}
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Correction Instructions</span>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  placeholder="Explain what the applicant needs to correct before resubmitting."
                  value={correctionReason}
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isRequestingCorrection}
                  onClick={() => {
                    setCorrectionTarget(null);
                    setCorrectionReason("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[148px] items-center justify-center rounded-lg bg-[#8a5200] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#734400] disabled:cursor-not-allowed disabled:bg-[#c39a67]"
                  disabled={isRequestingCorrection || !correctionReason.trim()}
                  onClick={handleRequestCorrection}
                  type="button"
                >
                  {isRequestingCorrection ? "Sending..." : "Send Update Request"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <NotificationToast
        message={assignmentSuccess}
        onClose={() => setAssignmentSuccess("")}
        open={Boolean(assignmentSuccess)}
        title="Queue Updated"
        variant="success"
      />
    </main>
  );
}
function EmptyState({ body, icon, title }: { body: string; icon: string; title: string }) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
        <i aria-hidden="true" className={`fa-solid ${icon} text-[18px]`} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">{title}</p>
      <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">{body}</p>
    </div>
  );
}

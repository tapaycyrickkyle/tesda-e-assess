"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationToast from "@/components/notifications/NotificationToast";
import { formatAssessmentDate } from "@/lib/assessment-date";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";

type AssignedApplicant = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assessment_date: string | null;
  assessment_center_id: string;
  assessor: string | null;
  assignment_batch: string | null;
  assignment_group_key: string | null;
  assignment_group_number: number | null;
  assignment_title: string | null;
  center_name: string;
  id: string;
  qualification: string;
  workflow_status: ApplicationSubmissionStatus;
};

type QueueTab = "active" | "closed";

type BulkAssignment = {
  applicantCount: number;
  applicants: AssignedApplicant[];
  assignedAt: string;
  assessmentDate: string | null;
  assessor: string | null;
  batchCode: string;
  centerName: string;
  groupKey: string;
  groupNumber: number | null;
  id: string;
  qualification: string;
  title: string;
};

type AssessmentCenterSummary = {
  applicantCount: number;
  batchCount: number;
  id: string;
  latestAssignedAt: string;
  name: string;
  pendingCount: number;
  processedCount: number;
};

type RemovalTarget = {
  assignmentIds: string[];
  centerName: string;
  description: string;
  title: string;
};

type ScheduleTarget = {
  assessmentDate: string;
  assessor: string;
  assignmentIds: string[];
  title: string;
};

const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";
const secondaryActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff] sm:min-w-[96px] sm:w-auto";
const primaryActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg bg-[#002576] px-3.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] sm:min-w-[108px] sm:w-auto";
const destructiveActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#e4bcbc] bg-[#fff5f5] px-3.5 text-[12px] font-bold text-[#b24c4c] transition hover:bg-[#ffeaea] sm:min-w-[96px] sm:w-auto";
const summaryCardClass =
  "flex min-h-[120px] flex-col rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
const summaryIconClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e3f7] bg-white text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

const activeStatuses: ApplicationSubmissionStatus[] = ["assigned", "under_review"];
const closedStatuses: ApplicationSubmissionStatus[] = ["passed", "not_passed", "completed"];

function isActiveStatus(status: ApplicationSubmissionStatus) {
  return activeStatuses.includes(status);
}

function isClosedStatus(status: ApplicationSubmissionStatus) {
  return closedStatuses.includes(status);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusBadgeClass(status: ApplicationSubmissionStatus) {
  if (status === "passed" || status === "completed") {
    return "bg-[#e8f7ee] text-[#166534]";
  }

  if (status === "not_passed" || status === "rejected" || status === "cancelled" || status === "withdrawn") {
    return "bg-[#fff1f1] text-[#b42318]";
  }

  return "bg-[#eef4ff] text-[#3056c4]";
}

export default function AdminAssignedApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [applicants, setApplicants] = useState<AssignedApplicant[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");
  const [error, setError] = useState("");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [queueTab, setQueueTab] = useState<QueueTab>("active");
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleAssessor, setScheduleAssessor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBulkAssignment, setSelectedBulkAssignment] = useState<BulkAssignment | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedbackMessage(""), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

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

  const centerSummaries = useMemo(() => {
    const centerMap = new Map<string, AssessmentCenterSummary & { groupKeys: Set<string> }>();

    applicants.forEach((applicant) => {
      const existing = centerMap.get(applicant.assessment_center_id);
      const groupKey = applicant.assignment_group_key ?? applicant.assignment_batch ?? "";

      if (existing) {
        existing.applicantCount += 1;
        existing.pendingCount += isActiveStatus(applicant.workflow_status) ? 1 : 0;
        existing.processedCount += isClosedStatus(applicant.workflow_status) ? 1 : 0;
        if (groupKey) {
          existing.groupKeys.add(groupKey);
        }
        if (new Date(applicant.assigned_at).getTime() > new Date(existing.latestAssignedAt).getTime()) {
          existing.latestAssignedAt = applicant.assigned_at;
        }
        return;
      }

      centerMap.set(applicant.assessment_center_id, {
        applicantCount: 1,
        batchCount: 0,
        groupKeys: new Set(groupKey ? [groupKey] : []),
        id: applicant.assessment_center_id,
        latestAssignedAt: applicant.assigned_at,
        name: applicant.center_name,
        pendingCount: isActiveStatus(applicant.workflow_status) ? 1 : 0,
        processedCount: isClosedStatus(applicant.workflow_status) ? 1 : 0,
      });
    });

    return Array.from(centerMap.values())
      .map(({ groupKeys, ...center }) => ({
        ...center,
        batchCount: groupKeys.size,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [applicants]);

  const selectedCenterSummary = useMemo(
    () => centerSummaries.find((center) => center.id === selectedCenterId) ?? null,
    [centerSummaries, selectedCenterId],
  );

  const selectedCenterApplicants = useMemo(
    () => applicants.filter((applicant) => applicant.assessment_center_id === selectedCenterId),
    [applicants, selectedCenterId],
  );

  const individualApplicants = useMemo(
    () => selectedCenterApplicants.filter((applicant) => !applicant.assignment_group_key),
    [selectedCenterApplicants],
  );

  const bulkAssignments = useMemo(() => {
    const assignmentMap = new Map<string, BulkAssignment>();

    selectedCenterApplicants
      .filter((applicant) => Boolean(applicant.assignment_group_key))
      .forEach((applicant) => {
        const groupKey = applicant.assignment_group_key ?? applicant.id;
        const existing = assignmentMap.get(groupKey);

        if (existing) {
          existing.applicants.push(applicant);
          existing.applicantCount += 1;
          if (new Date(applicant.assigned_at).getTime() > new Date(existing.assignedAt).getTime()) {
            existing.assignedAt = applicant.assigned_at;
          }
          return;
        }

        assignmentMap.set(groupKey, {
          applicantCount: 1,
          applicants: [applicant],
          assignedAt: applicant.assigned_at,
          assessmentDate: applicant.assessment_date,
          assessor: applicant.assessor,
          batchCode: applicant.assignment_batch ?? "Batch",
          centerName: applicant.center_name,
          groupKey,
          groupNumber: applicant.assignment_group_number,
          id: groupKey,
          qualification: applicant.qualification,
          title: applicant.assignment_title ?? applicant.assignment_batch ?? "Batch Assignment",
        });
      });

    return Array.from(assignmentMap.values()).sort(
      (left, right) => new Date(right.assignedAt).getTime() - new Date(left.assignedAt).getTime(),
    );
  }, [selectedCenterApplicants]);

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
          applicant.qualification.toLowerCase().includes(normalizedSearchQuery);
        const matchesQueue = queueTab === "active" ? isActiveStatus(applicant.workflow_status) : isClosedStatus(applicant.workflow_status);

        return matchesCourse && matchesSearch && matchesQueue;
      }),
    [individualApplicants, individualCourseFilter, normalizedSearchQuery, queueTab],
  );

  const filteredBulkAssignments = useMemo(
    () =>
      bulkAssignments.filter((assignment) => {
        const matchesProgram = bulkProgramFilter === "all" || assignment.qualification === bulkProgramFilter;
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          assignment.title.toLowerCase().includes(normalizedSearchQuery) ||
          assignment.batchCode.toLowerCase().includes(normalizedSearchQuery) ||
          assignment.qualification.toLowerCase().includes(normalizedSearchQuery);
        const matchesQueue =
          queueTab === "active"
            ? assignment.applicants.some((applicant) => isActiveStatus(applicant.workflow_status))
            : assignment.applicants.some((applicant) => isClosedStatus(applicant.workflow_status));

        return matchesProgram && matchesSearch && matchesQueue;
      }),
    [bulkAssignments, bulkProgramFilter, normalizedSearchQuery, queueTab],
  );

  const selectedBulkApplicants = useMemo(() => selectedBulkAssignment?.applicants ?? [], [selectedBulkAssignment]);

  const filteredSelectedBulkApplicants = useMemo(
    () =>
      selectedBulkApplicants.filter((applicant) => {
        const matchesSearch = applicant.applicant_name.toLowerCase().includes(bulkSearch.trim().toLowerCase());
        const matchesQueue = queueTab === "active" ? isActiveStatus(applicant.workflow_status) : isClosedStatus(applicant.workflow_status);
        return matchesSearch && matchesQueue;
      }),
    [bulkSearch, queueTab, selectedBulkApplicants],
  );

  const openCenterView = (centerId: string) => {
    setSelectedCenterId(centerId);
    setActiveTab("individual");
    setQueueTab("active");
    setSearchQuery("");
    setBulkSearch("");
    setIndividualCourseFilter("all");
    setBulkProgramFilter("all");
  };

  const returnToCenterDirectory = () => {
    setSelectedCenterId(null);
    setSelectedBulkAssignment(null);
    setIsBulkModalOpen(false);
    setSearchQuery("");
    setBulkSearch("");
    setIndividualCourseFilter("all");
    setBulkProgramFilter("all");
    setQueueTab("active");
  };

  const handleRemoveAssignment = async () => {
    if (!removalTarget) {
      return;
    }

    setIsRemovingAssignment(true);
    setError("");

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

      const removedIds = new Set(removalTarget.assignmentIds);
      setApplicants((currentApplicants) => currentApplicants.filter((applicant) => !removedIds.has(applicant.id)));
      setRemovalTarget(null);
      setFeedbackMessage(payload.message ?? "Assignment removed successfully.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove assignment.");
    } finally {
      setIsRemovingAssignment(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleTarget || !scheduleDate || !scheduleAssessor.trim()) {
      return;
    }

    setIsSavingSchedule(true);
    setError("");

    try {
      const response = await fetch("/api/admin/assessment-center-assignments", {
        body: JSON.stringify({
          action: "update_schedule",
          assessmentDate: scheduleDate,
          assessor: scheduleAssessor.trim(),
          assignmentIds: scheduleTarget.assignmentIds,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update the assignment schedule.");
      }

      const updatedIds = new Set(scheduleTarget.assignmentIds);
      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          updatedIds.has(applicant.id)
            ? {
                ...applicant,
                assessment_date: scheduleDate,
                assessor: scheduleAssessor.trim(),
              }
            : applicant,
        ),
      );
      setScheduleTarget(null);
      setFeedbackMessage(payload.message ?? "Assignment schedule updated successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the assignment schedule.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-2.5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="ui-page-title text-[#002576]">Assignments</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                {selectedCenterSummary
                  ? `Review schedules, reschedule assignments, and manage correction requests for ${selectedCenterSummary.name}.`
                  : "Open an assessment center to review its individual and grouped bulk assignments."}
              </p>
            </div>

            {selectedCenterSummary ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                <div className={summaryCardClass}>
                  <div className="flex min-h-[44px] items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Active</p>
                      <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">Still in progress</p>
                    </div>
                    <span aria-hidden="true" className={`${summaryIconClass} text-[#002576]`}>
                      <i className="fa-solid fa-calendar-check" />
                    </span>
                  </div>
                  <div className="mt-auto flex min-h-[48px] items-center justify-center pt-3 text-center">
                    <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0b1c30] tabular-nums">
                      {selectedCenterSummary.pendingCount}
                    </p>
                  </div>
                </div>

                <div className={summaryCardClass}>
                  <div className="flex min-h-[44px] items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Groups</p>
                      <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">Grouped bulk batches</p>
                    </div>
                    <span aria-hidden="true" className={`${summaryIconClass} text-[#3056c4]`}>
                      <i className="fa-solid fa-layer-group" />
                    </span>
                  </div>
                  <div className="mt-auto flex min-h-[48px] items-center justify-center pt-3 text-center">
                    <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0b1c30] tabular-nums">
                      {selectedCenterSummary.batchCount}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {error ? <NotificationBanner className="mb-4" message={error} variant="error" /> : null}

        {isLoading ? (
          <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading assigned applicants...</p>
          </div>
        ) : !selectedCenterSummary ? (
          centerSummaries.length === 0 ? (
            <section className="rounded-xl border border-dashed border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                <i aria-hidden="true" className="fa-solid fa-calendar-check text-[18px]" />
              </div>
              <p className="mt-4 text-[16px] font-semibold text-[#0b1c30]">No assignments yet</p>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#5d5f5f]">
                Assigned applicants will appear here after the admin queue routes them to an assessment center.
              </p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {centerSummaries.map((center) => (
                <button
                  key={center.id}
                  className="rounded-xl border border-[#d9e3f7] bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fcfdff]"
                  onClick={() => openCenterView(center.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cardTitleClass}>{center.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {center.applicantCount} assigned applicants | {center.batchCount} bulk groups
                      </p>
                      <p className="mt-1 text-[12px] text-[#747685]">Latest assignment {formatDateTime(center.latestAssignedAt)}</p>
                    </div>
                    <span className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-[#eef4ff] px-3 text-[12px] font-bold text-[#093cab]">
                      Open
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex min-h-[30px] items-center justify-center rounded-full bg-[#f8fbff] px-3 text-[11px] font-bold text-[#3056c4]">
                      {center.pendingCount} Active
                    </span>
                    <span className="inline-flex min-h-[30px] items-center justify-center rounded-full bg-[#eef4ff] px-3 text-[11px] font-bold text-[#3056c4]">
                      {center.processedCount} Closed
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )
        ) : (
          <>
            <section className="mb-3 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
              <button
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#eff4ff]"
                onClick={returnToCenterDirectory}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
                Back to Centers
              </button>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {(["active", "closed"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`inline-flex min-h-[36px] items-center justify-center rounded-full border px-4 text-[12px] font-bold transition ${
                      queueTab === tab ? "border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]" : "border-[#d9e3f7] bg-white text-[#5d5f5f] hover:bg-[#f8fbff]"
                    }`}
                    onClick={() => setQueueTab(tab)}
                    type="button"
                  >
                    {tab === "active" ? "Under Review" : "Completed"}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-3">
              <div className="flex justify-center">
                <div className="inline-flex w-[240px] max-w-full items-center rounded-full border border-[#d9e3f7] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  {(["individual", "bulk"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`min-w-0 flex-1 rounded-full px-3.5 py-2 text-[13px] transition sm:px-4 ${
                        activeTab === tab ? "bg-[#002576] font-bold text-white" : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                      }`}
                      onClick={() => setActiveTab(tab)}
                      type="button"
                    >
                      {tab === "individual" ? "Individual" : "Bulk"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
                <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 xl:w-full xl:max-w-[520px]">
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[64px]">Search</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={activeTab === "individual" ? "Search assigned applicants..." : "Search assigned groups..."}
                    type="text"
                    value={searchQuery}
                  />
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
                  </div>
                </label>
              </div>
            </section>

            <section>
              {activeTab === "individual" ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredIndividualApplicants.map((applicant) => (
                    <article
                      key={applicant.id}
                      className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fcfdff]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <p className={cardTitleClass}>{applicant.applicant_name}</p>
                            <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{applicant.qualification}</p>
                            <p className="mt-1 text-[12px] text-[#747685]">
                              Assigned {formatDateTime(applicant.assigned_at)} | Assessment {formatAssessmentDate(applicant.assessment_date)} | Assessor {applicant.assessor ?? "Not set"}
                            </p>
                          </div>
                          {applicant.workflow_status !== "under_review" && applicant.workflow_status !== "completed" ? (
                            <span
                              className={`inline-flex min-h-[34px] items-center justify-center rounded-lg px-3 text-[12px] font-bold ${getStatusBadgeClass(applicant.workflow_status)}`}
                            >
                              {getApplicationSubmissionStatusLabel(applicant.workflow_status)}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <a
                            className={secondaryActionButtonClass}
                            href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View PDF
                          </a>
                          <a
                            className={secondaryActionButtonClass}
                            href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                          >
                            Download
                          </a>
                          {isActiveStatus(applicant.workflow_status) ? (
                            <>
                              <button
                                className={primaryActionButtonClass}
                                onClick={() => {
                                  setScheduleTarget({
                                    assessmentDate: applicant.assessment_date ?? "",
                                    assessor: applicant.assessor ?? "",
                                    assignmentIds: [applicant.id],
                                    title: applicant.applicant_name,
                                  });
                                  setScheduleDate(applicant.assessment_date ?? "");
                                  setScheduleAssessor(applicant.assessor ?? "");
                                }}
                                type="button"
                              >
                                Edit Schedule
                              </button>
                            </>
                          ) : null}
                          {applicant.workflow_status === "assigned" ? (
                            <button
                              className={destructiveActionButtonClass}
                              onClick={() =>
                                setRemovalTarget({
                                  assignmentIds: [applicant.id],
                                  centerName: applicant.center_name,
                                  description: applicant.qualification,
                                  title: applicant.applicant_name,
                                })
                              }
                              type="button"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredBulkAssignments.map((assignment) => (
                    <article
                      key={assignment.id}
                      className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fcfdff]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <p className={cardTitleClass}>{assignment.title}</p>
                            <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{assignment.qualification}</p>
                            <p className="mt-1 text-[12px] text-[#747685]">
                              Assigned {formatDateTime(assignment.assignedAt)} | Assessment {formatAssessmentDate(assignment.assessmentDate)} | Assessor {assignment.assessor ?? "Not set"}
                            </p>
                          </div>
                          <button
                            className={secondaryActionButtonClass}
                            onClick={() => {
                              setSelectedBulkAssignment(assignment);
                              setBulkSearch("");
                              setIsBulkModalOpen(true);
                            }}
                            type="button"
                          >
                            Open
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {assignment.applicants.some((applicant) => isActiveStatus(applicant.workflow_status)) ? (
                            <button
                              className={primaryActionButtonClass}
                              onClick={() => {
                                setScheduleTarget({
                                  assessmentDate: assignment.assessmentDate ?? "",
                                  assessor: assignment.assessor ?? "",
                                  assignmentIds: assignment.applicants.map((applicant) => applicant.id),
                                  title: assignment.title,
                                });
                                setScheduleDate(assignment.assessmentDate ?? "");
                                setScheduleAssessor(assignment.assessor ?? "");
                              }}
                              type="button"
                            >
                              Edit Schedule
                            </button>
                          ) : null}
                          {assignment.applicants.every((applicant) => applicant.workflow_status === "assigned") ? (
                            <button
                              className={destructiveActionButtonClass}
                              onClick={() =>
                                setRemovalTarget({
                                  assignmentIds: assignment.applicants.map((applicant) => applicant.id),
                                  centerName: assignment.centerName,
                                  description: assignment.qualification,
                                  title: assignment.title,
                                })
                              }
                              type="button"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[720px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(isBulkModalOpen && selectedBulkAssignment)}
      >
        {selectedBulkAssignment ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-5 py-4 sm:px-6">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">{selectedBulkAssignment.title}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Assigned applicants in this grouped batch routed to {selectedBulkAssignment.centerName}.
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

            <div className="ui-modal-section px-5 py-4 sm:px-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#0b1c30]">Applicants</span>
                <span className="text-[12px] font-medium text-[#747685]">{selectedBulkApplicants.length} total</span>
              </div>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Search Applicants</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setBulkSearch(event.target.value)}
                  placeholder="Search applicants..."
                  type="text"
                  value={bulkSearch}
                />
              </label>

              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {filteredSelectedBulkApplicants.map((applicant) => (
                  <div
                    className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                    key={applicant.id}
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                        <p className="mt-1 truncate text-[13px] text-[#5d5f5f]">{applicant.qualification}</p>
                        <p className="mt-1 text-[12px] text-[#747685]">
                          Assessment {formatAssessmentDate(applicant.assessment_date)} | Assessor {applicant.assessor ?? "Not set"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <a
                          className={secondaryActionButtonClass}
                          href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View PDF
                        </a>
                        <a
                          className={secondaryActionButtonClass}
                          href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(removalTarget)}
        zIndexClassName="z-[60]"
      >
        {removalTarget ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Remove Assignment</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                This will return the assignment to the submitted queue so it can be routed again.
              </p>
            </div>
            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              <p className="text-[15px] font-bold text-[#0b1c30]">{removalTarget.title}</p>
              <p className="text-[13px] leading-[1.55] text-[#444653]">{removalTarget.description}</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className={secondaryActionButtonClass}
                  disabled={isRemovingAssignment}
                  onClick={() => setRemovalTarget(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[136px] items-center justify-center rounded-lg bg-[#d97a7a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#c96a6a] disabled:cursor-not-allowed disabled:bg-[#e6b8b8]"
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

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(scheduleTarget)}
        zIndexClassName="z-[60]"
      >
        {scheduleTarget ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Edit Schedule</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                Update the assessment date or assessor for this assignment.
              </p>
            </div>
            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              <p className="text-[15px] font-bold text-[#0b1c30]">{scheduleTarget.title}</p>
              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Assessment Date</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setScheduleDate(event.target.value)}
                  type="date"
                  value={scheduleDate}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Assessor</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setScheduleAssessor(event.target.value)}
                  type="text"
                  value={scheduleAssessor}
                />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className={secondaryActionButtonClass}
                  disabled={isSavingSchedule}
                  onClick={() => setScheduleTarget(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={primaryActionButtonClass}
                  disabled={isSavingSchedule || !scheduleDate || !scheduleAssessor.trim()}
                  onClick={handleSaveSchedule}
                  type="button"
                >
                  {isSavingSchedule ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <NotificationToast
        message={feedbackMessage}
        onClose={() => setFeedbackMessage("")}
        open={Boolean(feedbackMessage)}
        title="Assignments Updated"
        variant="success"
      />
    </main>
  );
}

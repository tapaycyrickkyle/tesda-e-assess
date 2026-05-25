"use client";

import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationToast from "@/components/notifications/NotificationToast";
import { useEffect, useMemo, useState } from "react";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";

type AssignedApplicant = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
  assignment_title?: string | null;
  id: string;
  latest_status_reason?: string | null;
  qualification: string;
  workflow_status: ApplicationSubmissionStatus;
};

type BulkAssignment = {
  applicantCount: number;
  assignedAt: string;
  batchCode: string;
  closedCount: number;
  id: string;
  qualification: string;
  submissionIds: string[];
  title: string;
  underReviewCount: number;
};

type QueueTab = "closed" | "under_review";
type DateFilter = "all" | "this_month" | "this_week" | "today";
type StatusAction = "cancel" | "complete" | "reject";
type PendingStatusUpdate =
  | {
      action: StatusAction;
      applicantReference: string;
      assignmentId?: never;
      count: 1;
      title: string;
      type: "individual";
    }
  | {
      action: StatusAction;
      applicantReference?: never;
      assignmentId: string;
      count: number;
      title: string;
      type: "bulk";
    };

const closedStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];

function isClosedStatus(status: ApplicationSubmissionStatus) {
  return closedStatuses.includes(status);
}

function isActionableCenterStatus(status: ApplicationSubmissionStatus) {
  return status === "assigned" || status === "under_review";
}

function matchesQueueStatus(status: ApplicationSubmissionStatus, queueTab: QueueTab) {
  if (queueTab === "under_review") {
    return isActionableCenterStatus(status);
  }

  return isClosedStatus(status);
}

function matchesAssignedDateFilter(value: string, dateFilter: DateFilter) {
  if (dateFilter === "all") {
    return true;
  }

  const assignedAt = new Date(value);

  if (Number.isNaN(assignedAt.getTime())) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateFilter === "today") {
    return assignedAt >= startOfToday;
  }

  if (dateFilter === "this_week") {
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    return assignedAt >= startOfWeek;
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return assignedAt >= startOfMonth;
}

const formatAssignedDate = (value: string) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });

const reviewTabInlineCountClass =
  "pointer-events-none absolute -right-1 -top-0.5 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#d92d20] text-[9px] font-bold leading-none text-white shadow-[0_6px_16px_rgba(217,45,32,0.22)]";
const closedTabInlineCountClass =
  "pointer-events-none absolute -right-1 -top-0.5 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[#cfe0ff] bg-[#eef4ff] text-[9px] font-bold leading-none text-[#0038a8] shadow-[0_4px_12px_rgba(0,56,168,0.12)]";
const secondaryActionButtonClass =
  "inline-flex min-h-[36px] min-w-[96px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]";
const summaryCardClass =
  "flex min-h-[120px] flex-col rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const summaryIconClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e3f7] bg-white text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function getStatusBadge(status: ApplicationSubmissionStatus) {
  if (status === "completed") {
    return {
      className: "border border-[#cce9d8] bg-[#edf9f1] text-[#166534]",
      iconClassName: "fa-solid fa-circle-check",
      label: "Completed",
    };
  }

  if (status === "rejected") {
    return {
      className: "border border-[#f2d1d1] bg-[#fff4f4] text-[#b42318]",
      iconClassName: "fa-solid fa-circle-xmark",
      label: "Rejected",
    };
  }

  if (status === "cancelled" || status === "withdrawn") {
    return {
      className: "border border-[#f2d1d1] bg-[#fff8f8] text-[#b42318]",
      iconClassName: "fa-solid fa-ban",
      label: getApplicationSubmissionStatusLabel(status),
    };
  }

  if (status === "assigned" || status === "under_review") {
    return {
      className: "border border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]",
      iconClassName: "fa-solid fa-clipboard-check",
      label: "Under Review",
    };
  }

  return {
    className: "border border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]",
    iconClassName: "fa-solid fa-file-circle-check",
    label: getApplicationSubmissionStatusLabel(status),
  };
}

function getStatusDescription(status: ApplicationSubmissionStatus) {
  if (status === "assigned" || status === "under_review") {
    return "Your center has started reviewing this submission. Record the final outcome when the assessment is finished.";
  }

  if (status === "completed") {
    return "Assessment has been completed and the applicant record is now read-only on the applicant side.";
  }

  if (status === "rejected") {
    return "The applicant was reviewed and marked as rejected by this center.";
  }

  if (status === "cancelled") {
    return "This application was cancelled after it reached the assessment center.";
  }

  return "This application is no longer active for further assessment-center action.";
}

function getActionButtonLabel(action: StatusAction) {
  if (action === "complete") {
    return "Complete";
  }

  if (action === "reject") {
    return "Reject";
  }

  return "Cancel";
}

function isReasonRequired(action: StatusAction) {
  return action === "cancel" || action === "reject";
}

function shouldShowReasonField(action: StatusAction) {
  return action !== "complete";
}

function getActionTheme(action: StatusAction) {
  if (action === "complete") {
    return {
      badgeClassName: "border-[#cce9d8] bg-[#edf9f1] text-[#166534]",
      buttonClassName: "bg-[#2f8f5b] text-white hover:bg-[#27794d]",
      helperText: "Use this when the center finished the assessment successfully.",
    };
  }

  if (action === "reject") {
    return {
      badgeClassName: "border-[#f2d1d1] bg-[#fff4f4] text-[#b42318]",
      buttonClassName: "bg-[#b42318] text-white hover:bg-[#991b1b]",
      helperText: "A reason is required so the applicant understands why the submission was rejected.",
    };
  }

  return {
    badgeClassName: "border-[#f1d8bf] bg-[#fff8e8] text-[#8a5200]",
    buttonClassName: "bg-[#8a5200] text-white hover:bg-[#734400]",
    helperText: "A reason is required so the cancellation is documented clearly.",
  };
}

export default function AssessmentCenterApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"bulk" | "individual">("individual");
  const [applicants, setApplicants] = useState<AssignedApplicant[]>([]);
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");
  const [bulkSearch, setBulkSearch] = useState("");
  const [centerName, setCenterName] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [error, setError] = useState("");
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
  const [queueTab, setQueueTab] = useState<QueueTab>("under_review");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBulkAssignment, setSelectedBulkAssignment] = useState<BulkAssignment | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [updatingAction, setUpdatingAction] = useState<StatusAction | null>(null);
  const [updatingBulkAssignmentId, setUpdatingBulkAssignmentId] = useState<string | null>(null);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);
  const tabInlineCountClass = queueTab === "under_review" ? reviewTabInlineCountClass : closedTabInlineCountClass;

  useEffect(() => {
    let cancelled = false;

    const loadApplicants = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/assessment-center/applicants", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          applicants?: AssignedApplicant[];
          centerName?: string;
          message?: string;
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load assigned applicants.");
        }

        if (!cancelled) {
          setApplicants(payload.applicants ?? []);
          setCenterName(payload.centerName ?? "");
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

  useEffect(() => {
    if (!statusSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusSuccess("");
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusSuccess]);

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
        const title = applicant.assignment_title?.trim() || batchCode;
        const key = `${batchCode}:${title}`;
        const existing = batchMap.get(key);

        if (existing) {
          existing.submissionIds.push(applicant.applicant_reference);
          existing.applicantCount += 1;
          existing.underReviewCount += isActionableCenterStatus(applicant.workflow_status) ? 1 : 0;
          existing.closedCount += isClosedStatus(applicant.workflow_status) ? 1 : 0;
          if (new Date(applicant.assigned_at).getTime() > new Date(existing.assignedAt).getTime()) {
            existing.assignedAt = applicant.assigned_at;
          }
          return;
        }

        batchMap.set(key, {
          applicantCount: 1,
          assignedAt: applicant.assigned_at,
          batchCode,
          closedCount: isClosedStatus(applicant.workflow_status) ? 1 : 0,
          id: key,
          qualification: applicant.qualification,
          submissionIds: [applicant.applicant_reference],
          title,
          underReviewCount: isActionableCenterStatus(applicant.workflow_status) ? 1 : 0,
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
          applicant.qualification.toLowerCase().includes(normalizedSearchQuery);
        const matchesQueue = matchesQueueStatus(applicant.workflow_status, queueTab);
        const matchesDate = matchesAssignedDateFilter(applicant.assigned_at, dateFilter);

        return matchesCourse && matchesSearch && matchesQueue && matchesDate;
      }),
    [individualApplicants, individualCourseFilter, normalizedSearchQuery, queueTab, dateFilter],
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
          (queueTab === "under_review" && assignment.underReviewCount > 0) ||
          (queueTab === "closed" && assignment.closedCount > 0);
        const matchesDate = matchesAssignedDateFilter(assignment.assignedAt, dateFilter);

        return matchesProgram && matchesSearch && matchesQueue && matchesDate;
      }),
    [bulkAssignments, bulkProgramFilter, normalizedSearchQuery, queueTab, dateFilter],
  );

  const selectedBulkApplicants = useMemo(
    () =>
      selectedBulkAssignment
        ? applicants
            .filter((applicant) => selectedBulkAssignment.submissionIds.includes(applicant.applicant_reference))
            .sort((left, right) => left.applicant_name.localeCompare(right.applicant_name))
        : [],
    [applicants, selectedBulkAssignment],
  );

  const filteredSelectedBulkApplicants = useMemo(
    () =>
      selectedBulkApplicants.filter((applicant) => {
        const normalizedBulkSearch = bulkSearch.trim().toLowerCase();
        const matchesQueue = matchesQueueStatus(applicant.workflow_status, queueTab);
        const matchesSearch =
          normalizedBulkSearch.length === 0 ||
          applicant.applicant_name.toLowerCase().includes(normalizedBulkSearch) ||
          applicant.qualification.toLowerCase().includes(normalizedBulkSearch);

        return matchesQueue && matchesSearch;
      }),
    [bulkSearch, queueTab, selectedBulkApplicants],
  );

  async function handleStatusUpdate(applicant: AssignedApplicant, action: StatusAction, reason = "") {
    if (updatingSubmissionId || updatingBulkAssignmentId) {
      return false;
    }

    setUpdatingSubmissionId(applicant.applicant_reference);
    setUpdatingAction(action);
    setError("");

    try {
      const response = await fetch("/api/assessment-center/applicants", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason,
          submissionId: applicant.applicant_reference,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        reason?: string | null;
        success?: boolean;
        workflowStatus?: ApplicationSubmissionStatus;
      };

      if (!response.ok || !payload.success || !payload.workflowStatus) {
        throw new Error(payload.message ?? "Unable to update submission status.");
      }

      setApplicants((currentApplicants) =>
        currentApplicants.map((currentApplicant) =>
          currentApplicant.applicant_reference === applicant.applicant_reference
            ? {
                ...currentApplicant,
                latest_status_reason: payload.reason ?? null,
                workflow_status: payload.workflowStatus!,
              }
            : currentApplicant,
        ),
      );
      setStatusSuccess(
        `${applicant.applicant_name} marked as ${getApplicationSubmissionStatusLabel(payload.workflowStatus).toLowerCase()}.`,
      );
      return true;
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update submission status.");
      return false;
    } finally {
      setUpdatingSubmissionId(null);
      setUpdatingAction(null);
    }
  }

  function openIndividualStatusAction(applicant: AssignedApplicant, action: StatusAction) {
    setPendingStatusUpdate({
      action,
      applicantReference: applicant.applicant_reference,
      count: 1,
      title: applicant.applicant_name,
      type: "individual",
    });
    setStatusReason("");
    setError("");
  }

  const renderStatusActions = (applicant: AssignedApplicant, compact = false) => {
    if (isClosedStatus(applicant.workflow_status)) {
      return (
        <div className={`rounded-md border border-[#d9e3f7] bg-[#fbfdff] ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Recorded Outcome</p>
          <p className={`${compact ? "mt-1.5 text-[12px] leading-[1.5]" : "mt-2 text-[13px] leading-[1.55]"} text-[#444653]`}>
            {getStatusDescription(applicant.workflow_status)}
          </p>
          {applicant.workflow_status !== "completed" && applicant.latest_status_reason ? (
            <p className={`${compact ? "mt-1.5 text-[12px] leading-[1.5]" : "mt-2 text-[13px] leading-[1.55]"} text-[#30435f]`}>
              Reason: {applicant.latest_status_reason}
            </p>
          ) : null}
        </div>
      );
    }

    const baseButtonClass = compact
      ? "inline-flex min-h-[40px] min-w-[112px] items-center justify-center rounded-lg px-4 text-[12px] font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
      : "inline-flex min-h-[44px] min-w-[132px] items-center justify-center rounded-lg px-4 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-70";
    const isUpdatingThisSubmission = updatingSubmissionId === applicant.applicant_reference;
    const availableActions: StatusAction[] = ["complete", "reject", "cancel"];

    return (
      <div className={compact ? "space-y-2.5" : "space-y-3"}>
        <div className={`rounded-md border border-[#dbe6fb] bg-[#f7faff] ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Next Step</p>
          <p className={`${compact ? "mt-1.5 text-[12px] leading-[1.5]" : "mt-2 text-[13px] leading-[1.55]"} text-[#30435f]`}>
            This applicant is already under review. Record the final outcome once the center finishes the assessment.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {availableActions.map((action) => {
            const isUpdatingThisAction = isUpdatingThisSubmission && updatingAction === action;

            return (
              <button
                key={action}
                className={`${baseButtonClass} ${
                  action === "complete"
                    ? "bg-[#2f8f5b] text-white hover:bg-[#27794d]"
                    : action === "reject"
                      ? "border border-[#f3c9c9] bg-[#fff7f7] text-[#b42318] hover:bg-[#fff1f1]"
                      : "border border-[#f1d8bf] bg-white text-[#8a5200] hover:bg-[#fff8e8]"
                }`}
                disabled={Boolean(updatingSubmissionId || updatingBulkAssignmentId)}
                onClick={() => openIndividualStatusAction(applicant, action)}
                type="button"
              >
                {isUpdatingThisAction ? "Saving..." : getActionButtonLabel(action)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  async function handleBulkStatusUpdate(assignment: BulkAssignment, action: StatusAction, reason = "") {
    if (updatingSubmissionId || updatingBulkAssignmentId) {
      return false;
    }

    const actionableApplicants = applicants.filter(
      (applicant) =>
        assignment.submissionIds.includes(applicant.applicant_reference) &&
        isActionableCenterStatus(applicant.workflow_status),
    );

    if (actionableApplicants.length === 0) {
      setError("No under-review applicants remain in this batch.");
      return;
    }

    setUpdatingBulkAssignmentId(assignment.id);
    setUpdatingAction(action);
    setError("");

    try {
      let nextStatus: ApplicationSubmissionStatus | null = null;

      for (const applicant of actionableApplicants) {
        const response = await fetch("/api/assessment-center/applicants", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason,
            submissionId: applicant.applicant_reference,
          }),
        });

        const payload = (await response.json()) as {
          message?: string;
          reason?: string | null;
          success?: boolean;
          workflowStatus?: ApplicationSubmissionStatus;
        };

        if (!response.ok || !payload.success || !payload.workflowStatus) {
          throw new Error(payload.message ?? "Unable to update batch submission statuses.");
        }

        nextStatus = payload.workflowStatus;
      }

      if (!nextStatus) {
        throw new Error("Unable to determine the updated batch status.");
      }

      const actionableSubmissionIds = new Set(actionableApplicants.map((applicant) => applicant.applicant_reference));

      setApplicants((currentApplicants) =>
        currentApplicants.map((currentApplicant) =>
          actionableSubmissionIds.has(currentApplicant.applicant_reference)
            ? {
                ...currentApplicant,
                latest_status_reason: reason || null,
                workflow_status: nextStatus!,
              }
            : currentApplicant,
        ),
      );
      setStatusSuccess(
        `${actionableApplicants.length} applicants from ${assignment.title} marked as ${getApplicationSubmissionStatusLabel(nextStatus).toLowerCase()}.`,
      );
      return true;
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update batch submission statuses.");
      return false;
    } finally {
      setUpdatingBulkAssignmentId(null);
      setUpdatingAction(null);
    }
  }

  function openBulkStatusAction(assignment: BulkAssignment, action: StatusAction) {
    const actionableApplicants = applicants.filter(
      (applicant) =>
        assignment.submissionIds.includes(applicant.applicant_reference) &&
        isActionableCenterStatus(applicant.workflow_status),
    );

    if (actionableApplicants.length === 0) {
      setError("No under-review applicants remain in this batch.");
      return false;
    }

    setPendingStatusUpdate({
      action,
      assignmentId: assignment.id,
      count: actionableApplicants.length,
      title: assignment.title,
      type: "bulk",
    });
    setStatusReason("");
    setError("");
  }

  async function handleConfirmStatusUpdate() {
    if (!pendingStatusUpdate) {
      return;
    }

    if (isReasonRequired(pendingStatusUpdate.action) && !statusReason.trim()) {
      setError("Please provide a reason before saving this outcome.");
      return;
    }

    if (pendingStatusUpdate.type === "individual") {
      const applicant = applicants.find(
        (entry) => entry.applicant_reference === pendingStatusUpdate.applicantReference,
      );

      if (!applicant) {
        setError("Unable to find the selected applicant record.");
        return;
      }

      const wasSaved = await handleStatusUpdate(applicant, pendingStatusUpdate.action, statusReason.trim());

      if (!wasSaved) {
        return;
      }
    } else {
      const assignment = bulkAssignments.find((entry) => entry.id === pendingStatusUpdate.assignmentId);

      if (!assignment) {
        setError("Unable to find the selected batch record.");
        return;
      }

      const wasSaved = await handleBulkStatusUpdate(assignment, pendingStatusUpdate.action, statusReason.trim());

      if (!wasSaved) {
        return;
      }
    }

    setPendingStatusUpdate(null);
    setStatusReason("");
  }

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-2.5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="ui-page-title text-[#002576]">Reviews</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Review applicant records assigned to {centerName || "your center"} and update their final outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className={summaryCardClass}>
                <div className="flex min-h-[44px] items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Individual</p>
                    <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">
                      Center assignments
                    </p>
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
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Bulk</p>
                    <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">
                      Batch assignments
                    </p>
                  </div>
                  <span aria-hidden="true" className={`${summaryIconClass} text-[#3056c4]`}>
                    <i className="fa-solid fa-layer-group" />
                  </span>
                </div>

                <div className="mt-auto flex min-h-[48px] items-center justify-center pt-3 text-center">
                  <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0b1c30] tabular-nums">
                    {bulkAssignments.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="flex justify-center">
            <div className="inline-flex w-[240px] max-w-full items-center rounded-full border border-[#d9e3f7] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <button
                className={`relative min-w-0 flex-1 rounded-full px-3.5 py-2 text-[13px] transition sm:px-4 ${
                  activeTab === "individual"
                    ? "bg-[#002576] font-bold text-white"
                    : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                }`}
                onClick={() => setActiveTab("individual")}
                type="button"
                >
                  <span className="flex items-center justify-center">
                    <span>Individual</span>
                  </span>
                  {filteredIndividualApplicants.length > 0 ? (
                    <span className={tabInlineCountClass}>{filteredIndividualApplicants.length}</span>
                  ) : null}
                </button>
                <button
                className={`relative min-w-0 flex-1 rounded-full px-3.5 py-2 text-[13px] transition sm:px-4 ${
                  activeTab === "bulk"
                    ? "bg-[#002576] font-bold text-white"
                    : "font-semibold text-[#5d5f5f] hover:bg-[#eff4ff]"
                }`}
                onClick={() => setActiveTab("bulk")}
                type="button"
                >
                  <span className="flex items-center justify-center">
                    <span>Bulk</span>
                  </span>
                  {filteredBulkAssignments.length > 0 ? (
                    <span className={tabInlineCountClass}>{filteredBulkAssignments.length}</span>
                  ) : null}
                </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#d9e3f7] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-5">
            <div className="w-full max-w-[1120px] 2xl:max-w-[1180px]">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_280px] xl:items-end">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Search
                </span>
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={activeTab === "individual" ? "Search applicants..." : "Search batch title, code, or program..."}
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Queue
                </span>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setQueueTab(event.target.value as QueueTab)}
                    value={queueTab}
                  >
                    <option value="under_review">Under Review</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                    <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  Assignment Date
                </span>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 pr-12 text-[13px] font-medium text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                    value={dateFilter}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#747685]">
                    <i aria-hidden="true" className="fa-solid fa-chevron-down text-[12px]" />
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                  {activeTab === "individual" ? "Course" : "Program"}
                </span>
                <div className="relative">
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
          </div>
        </section>

        {error ? (
          <NotificationBanner className="mb-4" message={error} variant="error" />
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading assigned applicants...</p>
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest assignment list for this center.</p>
          </div>
        ) : (
          <section>
            {activeTab === "individual" ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredIndividualApplicants.map((applicant) => {
                  const statusBadge = getStatusBadge(applicant.workflow_status);

                  return (
                    <article
                      key={applicant.id}
                      className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${statusBadge.className}`}>
                                <i aria-hidden="true" className={`${statusBadge.iconClassName} text-[11px]`} />
                                {statusBadge.label}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f7] bg-white px-3 py-1 text-[11px] font-bold text-[#4563a5]">
                                <i aria-hidden="true" className="fa-solid fa-user text-[11px]" />
                                Individual assignment
                              </span>
                            </div>
                            <p className="mt-2 text-[18px] font-bold leading-[1.2] text-[#0b1c30]">{applicant.applicant_name}</p>
                            <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">{applicant.qualification}</p>
                            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#747685]">
                              Assigned {formatAssignedDate(applicant.assigned_at)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <a
                              className="inline-flex min-h-[34px] min-w-[96px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                              href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              View
                            </a>
                            <a
                              className="inline-flex min-h-[34px] min-w-[96px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                              href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                            >
                              Download
                            </a>
                          </div>
                        </div>

                        {renderStatusActions(applicant, true)}
                      </div>
                    </article>
                  );
                })}

                {filteredIndividualApplicants.length === 0 ? (
                  <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                      <i
                        aria-hidden="true"
                        className={`fa-solid ${individualApplicants.length === 0 ? "fa-user-group" : "fa-filter-circle-xmark"} text-[18px]`}
                      />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                      {individualApplicants.length === 0
                        ? "No individual applicants have been assigned yet"
                        : queueTab === "under_review"
                            ? "No under-review applicants match the current search and filters"
                            : "No closed applicants match the current search and filters"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {individualApplicants.length === 0
                        ? "Individual applicant assignments from the admin portal will appear here."
                        : "Try another course, change the queue tab, or clear the search to view more applicants."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredBulkAssignments.map((assignment) => {
                  const isUpdatingThisBatch = updatingBulkAssignmentId === assignment.id;
                  const batchActionable = assignment.underReviewCount > 0;
                  const batchClosedCount = assignment.closedCount;

                  return (
                  <article
                    key={assignment.id}
                    className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f7] bg-white px-3 py-1 text-[11px] font-bold text-[#4563a5]">
                              <i aria-hidden="true" className="fa-solid fa-layer-group text-[11px]" />
                              Bulk assignment
                            </span>
                          </div>
                          <p className="mt-2 text-[18px] font-bold leading-[1.2] text-[#0b1c30]">{assignment.title}</p>
                          <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">{assignment.qualification}</p>
                          <p className="mt-1.5 text-[12px] leading-[1.5] text-[#747685]">
                            Assigned {formatAssignedDate(assignment.assignedAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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

                      </div>

                      {batchActionable ? (
                        <div className="space-y-2.5">
                          <div className="rounded-md border border-[#dbe6fb] bg-[#f7faff] px-3.5 py-2.5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Next Step</p>
                            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#30435f]">
                              This batch is already under review. Record the final outcome here, then use the modal only to view or download applicant PDFs.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {(["complete", "reject", "cancel"] as StatusAction[]).map((action) => {
                              const isUpdatingThisAction = isUpdatingThisBatch && updatingAction === action;

                              return (
                                <button
                                  key={action}
                                  className={`inline-flex min-h-[36px] min-w-[100px] items-center justify-center rounded-lg px-3.5 text-[12px] font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                    action === "complete"
                                      ? "bg-[#2f8f5b] text-white hover:bg-[#27794d]"
                                      : action === "reject"
                                        ? "border border-[#f3c9c9] bg-[#fff7f7] text-[#b42318] hover:bg-[#fff1f1]"
                                        : "border border-[#f1d8bf] bg-white text-[#8a5200] hover:bg-[#fff8e8]"
                                  }`}
                                  disabled={Boolean(updatingSubmissionId || updatingBulkAssignmentId)}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openBulkStatusAction(assignment, action);
                                  }}
                                  type="button"
                                >
                                  {isUpdatingThisAction ? "Saving..." : getActionButtonLabel(action)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-[#d9e3f7] bg-[#fbfdff] px-3.5 py-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Recorded Outcome</p>
                          <p className="mt-1.5 text-[12px] leading-[1.5] text-[#444653]">
                            Every applicant in this batch already has a final assessment-center outcome.
                          </p>
                          <p className="mt-1.5 text-[12px] font-semibold text-[#30435f]">
                            Closed applicants: {batchClosedCount}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                )})}

                {filteredBulkAssignments.length === 0 ? (
                  <div className="rounded-xl border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                      <i
                        aria-hidden="true"
                        className={`fa-solid ${bulkAssignments.length === 0 ? "fa-layer-group" : "fa-filter-circle-xmark"} text-[18px]`}
                      />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                      {bulkAssignments.length === 0
                        ? "No bulk assignments have been received yet"
                        : queueTab === "under_review"
                            ? "No under-review batch submissions match the current search and filters"
                            : "No closed batch submissions match the current search and filters"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {bulkAssignments.length === 0
                        ? "Bulk assignment batches from the admin portal will appear here."
                        : "Try another program, change the queue tab, or clear the search to view more batch assignments."}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(pendingStatusUpdate)}
        zIndexClassName="z-[60]"
      >
        {pendingStatusUpdate ? (
          <>
            {(() => {
              const actionTheme = getActionTheme(pendingStatusUpdate.action);

              return (
                <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Confirm Outcome</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                Record the final review outcome before this applicant or batch leaves the active center queue.
              </p>
            </div>

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              <div className="rounded-lg border border-[#d9e3f7] bg-[#fbfdff] px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Updating</p>
                  <span className={`inline-flex min-h-[30px] items-center justify-center rounded-full border px-3 text-[11px] font-bold ${actionTheme.badgeClassName}`}>
                    {getActionButtonLabel(pendingStatusUpdate.action)}
                  </span>
                </div>
                <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{pendingStatusUpdate.title}</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                  {pendingStatusUpdate.type === "individual"
                    ? `Mark this applicant as ${getActionButtonLabel(pendingStatusUpdate.action).toLowerCase()}.`
                    : `Mark ${pendingStatusUpdate.count} applicants in this batch as ${getActionButtonLabel(
                        pendingStatusUpdate.action,
                      ).toLowerCase()}.`}
                </p>
                <p className="mt-2 text-[12px] leading-[1.5] text-[#30435f]">{actionTheme.helperText}</p>
              </div>

              {shouldShowReasonField(pendingStatusUpdate.action) ? (
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">
                    Reason {isReasonRequired(pendingStatusUpdate.action) ? "(Required)" : "(Optional)"}
                  </span>
                  <textarea
                    className="mt-2 min-h-[112px] w-full rounded-lg border border-[#d9e3f7] bg-white px-3 py-2.5 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setStatusReason(event.target.value)}
                    placeholder={
                      isReasonRequired(pendingStatusUpdate.action)
                        ? "Explain the rejection or cancellation reason."
                        : "Add any helpful note for the recorded outcome."
                    }
                    value={statusReason}
                  />
                </label>
              ) : null}

              {isReasonRequired(pendingStatusUpdate.action) ? (
                <div className="rounded-lg border border-[#f1d8bf] bg-[#fff8e8] px-4 py-3">
                  <p className="text-[12px] leading-[1.55] text-[#8a5200]">
                    This outcome will be shown to the applicant together with the recorded reason.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={Boolean(updatingSubmissionId || updatingBulkAssignmentId)}
                  onClick={() => {
                    setPendingStatusUpdate(null);
                    setStatusReason("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`inline-flex min-w-[136px] items-center justify-center rounded-lg px-4 py-2.5 text-[12px] font-bold transition disabled:cursor-not-allowed disabled:bg-[#9aa6c7] ${actionTheme.buttonClassName}`}
                  disabled={Boolean(updatingSubmissionId || updatingBulkAssignmentId)}
                  onClick={() => void handleConfirmStatusUpdate()}
                  type="button"
                >
                  {updatingSubmissionId || updatingBulkAssignmentId ? "Saving..." : "Save Outcome"}
                </button>
              </div>
            </div>
                </>
              );
            })()}
          </>
        ) : null}
      </AnimatedModal>

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
                  Applicants assigned to {centerName || "this center"} under this batch.
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
              <div className="mb-3">
                <div className="group relative">
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                  />
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white py-3 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setBulkSearch(event.target.value)}
                    placeholder="Search applicants in this batch..."
                    type="text"
                    value={bulkSearch}
                  />
                </div>
              </div>

              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {filteredSelectedBulkApplicants.map((applicant) => {
                  return (
                    <div
                      className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]"
                      key={applicant.id}
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                          <p className="mt-1 truncate text-[13px] text-[#5d5f5f]">{applicant.qualification}</p>
                          {applicant.workflow_status !== "completed" && applicant.latest_status_reason ? (
                            <p className="mt-1 text-[12px] leading-[1.5] text-[#30435f]">Reason: {applicant.latest_status_reason}</p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <a
                            className="inline-flex min-h-[40px] min-w-[104px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                            href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View PDF
                          </a>
                          <a
                            className="inline-flex min-h-[40px] min-w-[104px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                            href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference, { download: true })}
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredSelectedBulkApplicants.length === 0 ? (
                  <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-6 text-center text-[13px] text-[#747685]">
                    No applicants in this batch match the current queue tab or search.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <NotificationToast
        message={statusSuccess}
        onClose={() => setStatusSuccess("")}
        open={Boolean(statusSuccess)}
        title="Status Updated"
        variant="success"
      />
    </main>
  );
}

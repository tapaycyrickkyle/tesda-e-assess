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
  assessment_center_id: string;
  center_name: string;
  id: string;
  qualification: string;
  workflow_status: ApplicationSubmissionStatus;
};

type BulkAssignment = {
  assignmentIds: string[];
  applicantCount: number;
  assignedAt: string;
  batchCode: string;
  centerName: string;
  hasProcessedApplicants: boolean;
  id: string;
  qualification: string;
  title: string;
};

type AssessmentCenterSummary = {
  applicantCount: number;
  batchCount: number;
  id: string;
  individualCount: number;
  latestAssignedAt: string;
  name: string;
  pendingCount: number;
  processedCount: number;
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
const assignedMetaCardClass =
  "flex min-h-[48px] w-full flex-col justify-center rounded-lg border border-[#d9e3f7] bg-white px-3 py-2 text-left sm:min-w-[188px] sm:w-auto";
const secondaryActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff] sm:min-w-[96px] sm:w-auto";
const destructiveActionButtonClass =
  "inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#e4bcbc] bg-[#fff5f5] px-3.5 text-[12px] font-bold text-[#b24c4c] transition hover:bg-[#ffeaea] sm:min-w-[96px] sm:w-auto";
const tabInlineCountClass =
  "pointer-events-none absolute -right-1 -top-0.5 inline-flex min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#e53935] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(229,57,53,0.18)]";
const summaryCardClass =
  "flex min-h-[120px] flex-col rounded-[10px] border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const summaryIconClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#d9e3f7] bg-white text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
const centerActiveStatuses: ApplicationSubmissionStatus[] = ["assigned", "under_review"];
const centerClosedStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];

function getStatusBadgeClass(status: ApplicationSubmissionStatus) {
  if (status === "completed") {
    return "bg-[#e8f7ee] text-[#166534]";
  }

  if (status === "rejected" || status === "cancelled" || status === "withdrawn") {
    return "bg-[#fff1f1] text-[#b42318]";
  }

  if (status === "assigned" || status === "under_review") {
    return "bg-[#eef4ff] text-[#3056c4]";
  }

  return "bg-[#fff4db] text-[#8a5200]";
}

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
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");

  useEffect(() => {
    if (!removalSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRemovalSuccess("");
    }, 4500);

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
  const centerSummaries = useMemo(() => {
    const centerMap = new Map<string, AssessmentCenterSummary & { batchCodes: Set<string> }>();

    applicants.forEach((applicant) => {
      const existing = centerMap.get(applicant.assessment_center_id);

        if (existing) {
          existing.applicantCount += 1;
          existing.pendingCount += centerActiveStatuses.includes(applicant.workflow_status) ? 1 : 0;
          existing.processedCount += centerClosedStatuses.includes(applicant.workflow_status) ? 1 : 0;
          existing.individualCount += applicant.assignment_batch ? 0 : 1;
        if (applicant.assignment_batch) {
          existing.batchCodes.add(applicant.assignment_batch);
        }
        if (new Date(applicant.assigned_at).getTime() > new Date(existing.latestAssignedAt).getTime()) {
          existing.latestAssignedAt = applicant.assigned_at;
        }
        return;
      }

      centerMap.set(applicant.assessment_center_id, {
        applicantCount: 1,
        batchCodes: new Set(applicant.assignment_batch ? [applicant.assignment_batch] : []),
        batchCount: 0,
        id: applicant.assessment_center_id,
        individualCount: applicant.assignment_batch ? 0 : 1,
        latestAssignedAt: applicant.assigned_at,
        name: applicant.center_name,
        pendingCount: centerActiveStatuses.includes(applicant.workflow_status) ? 1 : 0,
        processedCount: centerClosedStatuses.includes(applicant.workflow_status) ? 1 : 0,
      });
    });

    return Array.from(centerMap.values())
      .map(({ batchCodes, ...center }) => ({
        ...center,
        batchCount: batchCodes.size,
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
    () => selectedCenterApplicants.filter((applicant) => !applicant.assignment_batch),
    [selectedCenterApplicants],
  );

  const bulkAssignments = useMemo(() => {
    const batchMap = new Map<string, BulkAssignment>();

    selectedCenterApplicants
      .filter((applicant) => applicant.assignment_batch)
      .forEach((applicant) => {
        const batchCode = applicant.assignment_batch ?? "";
        const assignmentTitle = applicant.assignment_title?.trim() || batchCode;
        const groupingKey = `${batchCode}:${assignmentTitle}:${applicant.center_name}`;
        const existing = batchMap.get(groupingKey);

        if (existing) {
          existing.applicantCount += 1;
          existing.assignmentIds.push(applicant.id);
          existing.hasProcessedApplicants =
            existing.hasProcessedApplicants || applicant.workflow_status !== "assigned";
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
          hasProcessedApplicants: applicant.workflow_status !== "assigned",
          id: applicant.id,
          qualification: applicant.qualification,
          title: assignmentTitle,
        });
      });

    return Array.from(batchMap.values()).sort(
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

  const openCenterView = (centerId: string) => {
    setSelectedCenterId(centerId);
    setActiveTab("individual");
    setSearchQuery("");
    setBulkSearch("");
    setIndividualCourseFilter("all");
    setBulkProgramFilter("all");
    setSelectedBulkAssignment(null);
    setIsBulkModalOpen(false);
  };

  const returnToCenterDirectory = () => {
    setSelectedCenterId(null);
    setSearchQuery("");
    setBulkSearch("");
    setIndividualCourseFilter("all");
    setBulkProgramFilter("all");
    setSelectedBulkAssignment(null);
    setIsBulkModalOpen(false);
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

      const nextApplicants = applicants.filter((applicant) => !removalTarget.assignmentIds.includes(applicant.id));
      setApplicants(nextApplicants);
      if (removalTarget.type === "bulk") {
        setIsBulkModalOpen(false);
        setSelectedBulkAssignment(null);
        setBulkSearch("");
      }
      if (selectedCenterId && !nextApplicants.some((applicant) => applicant.assessment_center_id === selectedCenterId)) {
        returnToCenterDirectory();
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
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-2.5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Assigned Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                {selectedCenterSummary
                  ? `Review the assignments currently routed to ${selectedCenterSummary.name}.`
                  : "Open an assessment center to review its individual and bulk assignment queues."}
              </p>
            </div>

            {selectedCenterSummary ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                <div className={summaryCardClass}>
                  <div className="flex min-h-[44px] items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Individual</p>
                      <p className="mt-1 text-[10px] font-medium leading-[1.35] text-[#747685] sm:text-[11px]">
                        Direct assignments
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
                        Assigned batches
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
            ) : null}
          </div>
        </section>

        <section className="mb-3">
          {selectedCenterSummary ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="flex justify-start">
                <button
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#eff4ff]"
                  onClick={returnToCenterDirectory}
                  type="button"
                >
                  <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
                  Back to Centers
                </button>
              </div>

              <div className="flex justify-center md:col-start-2">
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
                    <span className={tabInlineCountClass}>{filteredIndividualApplicants.length}</span>
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
                    <span className={tabInlineCountClass}>{filteredBulkAssignments.length}</span>
                  </button>
                </div>
              </div>

              <div className="hidden md:block" aria-hidden="true" />
            </div>
          ) : null}

          {selectedCenterSummary ? (
            <>
              <div className="mt-4 rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-5">
                  <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
                    <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 xl:w-full xl:max-w-[520px]">
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[64px]">
                        Search
                      </span>
                      <div className="group relative min-w-0 flex-1">
                        <i
                          aria-hidden="true"
                          className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                        />
                        <input
                          className="w-full rounded-lg border border-[#d9e3f7] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder={activeTab === "individual" ? "Search assigned applicants..." : "Search assigned batches..."}
                          type="text"
                          value={searchQuery}
                        />
                      </div>
                    </label>

                    <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 xl:ml-auto xl:w-full xl:max-w-[360px]">
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[108px]">
                        Program Filter
                      </span>
                      <span className="sr-only">Filter by program</span>
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
            </>
          ) : null}
        </section>

        {error ? (
          <NotificationBanner className="mb-4" message={error} variant="error" />
        ) : null}

        {isLoading ? (
          <div className="rounded-[12px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading assigned applicants...</p>
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest routing history from assessment centers.</p>
          </div>
        ) : !selectedCenterSummary ? (
          <section>
            {centerSummaries.length === 0 ? (
              <div className="rounded-[12px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                  <i aria-hidden="true" className="fa-solid fa-building text-[18px]" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No assessment centers have assigned applicants yet</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                  Centers will appear here after applicants are routed from the submitted queue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {centerSummaries.map((center) => (
                  <button
                    key={center.id}
                    className="rounded-[12px] border border-[#d9e3f7] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    onClick={() => openCenterView(center.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assessment Center</p>
                        <h2 className="mt-2 text-[22px] font-bold leading-[1.2] text-[#0b1c30]">{center.name}</h2>
                        <p className="mt-2 text-[13px] leading-[1.55] text-[#4c5d79]">
                          Latest assignment {formatAssignedDate(center.latestAssignedAt)}
                        </p>
                      </div>
                      <span className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-[#eef4ff] px-3 text-[12px] font-bold text-[#093cab]">
                        Open
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section>
            {activeTab === "individual" ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredIndividualApplicants.map((applicant) => (
                  <article
                    className="rounded-[12px] border border-[#d9e3f7] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:px-5"
                    key={applicant.id}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{applicant.applicant_name}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#444653]">{applicant.qualification}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                        <div className={assignedMetaCardClass}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">
                            {formatAssignedDate(applicant.assigned_at)}
                          </p>
                        </div>
                        {applicant.workflow_status !== "assigned" ? (
                          <span
                            className={`inline-flex min-h-[36px] min-w-[96px] items-center justify-center rounded-lg px-3.5 text-[12px] font-bold ${getStatusBadgeClass(applicant.workflow_status)}`}
                          >
                            {getApplicationSubmissionStatusLabel(applicant.workflow_status)}
                          </span>
                        ) : null}
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
                        {applicant.workflow_status === "assigned" ? (
                          <button
                            className={destructiveActionButtonClass}
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
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}

                {filteredIndividualApplicants.length === 0 ? (
                  <div className="rounded-[12px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center">
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
              <div className="grid grid-cols-1 gap-2.5">
                {filteredBulkAssignments.map((assignment) => (
                  <article
                    key={`${assignment.batchCode}-${assignment.title}-${assignment.centerName}`}
                    className="rounded-lg border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{assignment.title}</p>
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{assignment.qualification}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                        <div className={assignedMetaCardClass}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#0b1c30]">
                            {formatAssignedDate(assignment.assignedAt)}
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
                        {!assignment.hasProcessedApplicants ? (
                          <button
                            className={destructiveActionButtonClass}
                            onClick={() => {
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
                        ) : (
                          <span className="inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-[#d6dce9] bg-[#f7f9fc] px-4 text-[12px] font-bold text-[#7a879d] sm:min-w-[104px] sm:w-auto">
                            Processing
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                {filteredBulkAssignments.length === 0 ? (
                  <div className="rounded-[12px] border border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center">
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[12px] border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
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

              <label className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5] sm:min-w-[128px]">
                  Search Applicants
                </span>
                <div className="group relative min-w-0 flex-1">
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

              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {filteredSelectedBulkApplicants.map((applicant) => (
                  <div
                    className="flex flex-col gap-3 rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between"
                    key={applicant.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={buildApplicationSubmissionPdfUrl(applicant.applicant_reference)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View PDF
                      </a>
                      <a
                        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-[12px] border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
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
                <NotificationBanner compact message={removalError} variant="error" />
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
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isRemovingAssignment}
                  onClick={closeRemovalFlow}
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

      <NotificationToast
        message={removalSuccess}
        onClose={() => setRemovalSuccess("")}
        open={Boolean(removalSuccess)}
        title="Assignment Removed"
        variant="success"
      />
    </main>
  );
}

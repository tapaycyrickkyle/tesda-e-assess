"use client";

import { useEffect, useMemo, useState } from "react";

type AssignedApplicant = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
  id: string;
  qualification: string;
};

type BulkAssignment = {
  applicantCount: number;
  assignedAt: string;
  batchCode: string;
  id: string;
  qualification: string;
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

export default function AssessmentCenterApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [applicants, setApplicants] = useState<AssignedApplicant[]>([]);
  const [centerName, setCenterName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [individualCourseFilter, setIndividualCourseFilter] = useState("all");
  const [bulkProgramFilter, setBulkProgramFilter] = useState("all");

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
        const existing = batchMap.get(batchCode);

        if (existing) {
          existing.applicantCount += 1;
          if (new Date(applicant.assigned_at).getTime() > new Date(existing.assignedAt).getTime()) {
            existing.assignedAt = applicant.assigned_at;
          }
          return;
        }

        batchMap.set(batchCode, {
          applicantCount: 1,
          assignedAt: applicant.assigned_at,
          batchCode,
          id: applicant.id,
          qualification: applicant.qualification,
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
      individualApplicants.filter(
        (applicant) => individualCourseFilter === "all" || applicant.qualification === individualCourseFilter,
      ),
    [individualApplicants, individualCourseFilter],
  );

  const filteredBulkAssignments = useMemo(
    () =>
      bulkAssignments.filter(
        (assignment) => bulkProgramFilter === "all" || assignment.qualification === bulkProgramFilter,
      ),
    [bulkAssignments, bulkProgramFilter],
  );

  const topRightCount = activeTab === "individual" ? filteredIndividualApplicants.length : filteredBulkAssignments.length;
  const topRightLabel = activeTab === "individual" ? "Applicants" : "Batches";

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                Review applicants routed to {centerName || "the assessment center"} and organize them by assignment type.
              </p>
            </div>

            <div className="flex min-h-[112px] w-full max-w-[196px] flex-col justify-center rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{topRightLabel}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none text-[#0b1c30]">{topRightCount}</p>
              <p className="mt-1 text-[11px] text-[#4563a5]">
                {activeTab === "individual" ? "Ready for individual assessment" : "Received bulk assignment batches"}
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

              <div className="flex flex-col gap-2 sm:min-w-[320px] sm:flex-row sm:items-center sm:justify-end">
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
                  (activeTab === "bulk" && bulkProgramFilter !== "all")) ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4def2] bg-[#eef4ff] px-4 py-2.5 text-[13px] font-bold text-[#093cab] transition hover:bg-[#e3edff]"
                    onClick={() =>
                      activeTab === "individual" ? setIndividualCourseFilter("all") : setBulkProgramFilter("all")
                    }
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
            <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest assignment list for this center.</p>
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
                        : "No applicants match this course filter"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {individualApplicants.length === 0
                        ? "Individual applicant assignments from the admin portal will appear here."
                        : "Try another course or clear the filter to view all individual assignments."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBulkAssignments.map((assignment) => (
                  <article key={assignment.batchCode} className="rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className={cardTitleClass}>{assignment.batchCode}</p>
                        <p className="mt-2 text-[14px] font-medium text-[#444653]">{assignment.qualification}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-4 py-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Applicants</p>
                          <p className="mt-1 text-[13px] font-medium text-[#0b1c30]">
                            {assignment.applicantCount} {assignment.applicantCount === 1 ? "received" : "received"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-4 py-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-1 text-[13px] font-medium text-[#0b1c30]">
                            {formatAssignedDate(assignment.assignedAt)}
                          </p>
                        </div>
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
                        ? "No bulk assignments have been received yet"
                        : "No batch submissions match this program filter"}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                      {bulkAssignments.length === 0
                        ? "Bulk assignment batches from the admin portal will appear here."
                        : "Try another program or clear the filter to view all batch assignments."}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

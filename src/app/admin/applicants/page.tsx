"use client";

import { useEffect, useState } from "react";

type ApplicantRecord = {
  course: string;
  date: string;
  id: string;
  initials: string;
  level: string;
  name: string;
  room: string;
  time: string;
  toneClass: string;
};

type AssignmentTarget =
  | {
      applicants: { id: string; name: string; qualification: string }[];
      applicantCount: number;
      description: string;
      title: string;
      type: "individual";
    }
  | {
      applicants: { id: string; name: string; qualification: string }[];
      applicantCount: number;
      description: string;
      title: string;
      type: "bulk";
    };

type AssessmentCenterOption = {
  address: string;
  id: string;
  name: string;
};

const applicants: ApplicantRecord[] = [
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

const bulkQualification = "Computer Systems Servicing NC II";
const cardTitleClass = "text-[18px] font-bold leading-[1.2] text-[#0b1c30]";

export default function AdminApplicantsPage() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");
  const [assessmentCenters, setAssessmentCenters] = useState<AssessmentCenterOption[]>([]);
  const [centersError, setCentersError] = useState("");
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [isAssignmentConfirmOpen, setIsAssignmentConfirmOpen] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

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

  const bulkSchoolCount = 1;
  const topRightCount = activeTab === "individual" ? applicants.length : bulkSchoolCount;
  const topRightLabel = activeTab === "individual" ? "Applicants" : "Schools";
  const filteredBulkApplicants = bulkApplicants.filter((applicant) =>
    applicant.name.toLowerCase().includes(bulkSearch.trim().toLowerCase()),
  );
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
            assignmentBatch: assignmentTarget.type === "bulk" ? bulkSubmission.batchCode : null,
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

            <div className="w-full max-w-[220px] rounded-[14px] border border-[#d4def2] bg-[#eef4ff] px-5 py-4 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{topRightLabel}</p>
              <p className="mt-2 text-[30px] font-bold leading-none text-[#0b1c30]">{topRightCount}</p>
              <p className="mt-1 text-[12px] text-[#4563a5]">
                {activeTab === "individual" ? "Ready for assessment assignment" : "Submitted school batches"}
              </p>
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
                <article key={applicant.id} className="rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm">
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
                        onClick={() =>
                          openAssignmentModal({
                            applicants: [
                              {
                                id: applicant.id,
                                name: applicant.name,
                                qualification: applicant.course,
                              },
                            ],
                            applicantCount: 1,
                            description: applicant.course,
                            title: applicant.name,
                            type: "individual",
                          })
                        }
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
            <article
              className="cursor-pointer rounded-lg border border-[#c4c5d5] bg-white p-5 shadow-sm transition hover:border-[#002576] hover:shadow-md"
              onClick={() => setIsBulkModalOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsBulkModalOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className={cardTitleClass}>{bulkSubmission.name}</p>
                  <p className="mt-2 text-[14px] font-medium text-[#444653]">{bulkQualification}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <button
                    className="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8]"
                    onClick={(event) => {
                      event.stopPropagation();
                      openAssignmentModal({
                        applicants: bulkApplicants.map((applicant) => ({
                          id: applicant.id,
                          name: applicant.name,
                          qualification: bulkQualification,
                        })),
                        applicantCount: bulkApplicants.length,
                        description: bulkQualification,
                        title: bulkSubmission.name,
                        type: "bulk",
                      });
                    }}
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
        <div className="ui-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4 py-4">
          <div className="ui-modal-pop max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-lg border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
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
                <span className="text-[12px] font-medium text-[#747685]">{bulkApplicants.length} total</span>
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
                  <div key={applicant.id} className="flex flex-col gap-3 rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-6 text-center text-[13px] text-[#747685]">
                    No applicants found.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {assignmentTarget && !isAssignmentConfirmOpen ? (
        <div className="ui-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4 py-4">
          <div className="ui-modal-pop max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-lg border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Assign Assessment Center</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
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

            <div className="space-y-4 rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              {assignmentError ? (
                <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#93000a]">
                  {assignmentError}
                </div>
              ) : null}

              <div className="rounded-lg border border-[#cfe0ff] bg-[#eef4ff] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4563a5]">Assigning</p>
                <div className="mt-3 min-w-0">
                  <p className="text-[15px] font-bold text-[#0b1c30]">{assignmentTarget.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[#44506a]">{assignmentTarget.description}</p>
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4563a5]">
                    {assignmentTarget.applicantCount} {assignmentTarget.applicantCount === 1 ? "Applicant" : "Applicants"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#0b1c30]">Choose Assessment Center</p>
                    <p className="mt-1 text-[12px] leading-[1.5] text-[#747685]">
                      Select one destination from the list for this assignment.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#747685] shadow-sm">
                    {isLoadingCenters ? "Loading..." : `${assessmentCenters.length} options`}
                  </span>
                </div>

                {centersError ? <p className="mb-3 text-[12px] text-[#93000a]">{centersError}</p> : null}

                <div className="space-y-3">
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
                    <div className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#747685]">Selected Center</p>
                      <p className="mt-3 text-[15px] font-bold text-[#0b1c30]">{selectedCenter.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">{selectedCenter.address}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          </div>
        </div>
      ) : null}

      {assignmentTarget && selectedCenter && isAssignmentConfirmOpen ? (
        <div className="ui-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 px-4 py-4">
          <div className="ui-modal-pop max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-y-auto rounded-lg border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
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
          </div>
        </div>
      ) : null}

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

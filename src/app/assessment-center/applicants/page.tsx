"use client";

import { useEffect, useState } from "react";

type AssignedApplicant = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
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

export default function AssessmentCenterApplicantsPage() {
  const [applicants, setApplicants] = useState<AssignedApplicant[]>([]);
  const [centerName, setCenterName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Applicants</h1>
              <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
                View and manage applicants assigned to {centerName || "the assessment center"}.
              </p>
            </div>

            <div className="w-full max-w-[220px] rounded-[16px] border border-[#d4def2] bg-[#eef4ff] px-5 py-4 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Assigned Applicants</p>
              <p className="mt-2 text-[30px] font-bold leading-none text-[#0b1c30]">{applicants.length}</p>
              <p className="mt-1 text-[12px] text-[#4563a5]">Currently routed to this center</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#c4c5d5] bg-white shadow-sm">
          <div className="border-b border-[#d9e3f7] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[24px] font-semibold text-[#0b1c30]">Assigned Applicants</h2>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                  Applicants routed to this assessment center from the admin portal.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#093cab] shadow-sm">
                  {centerName || "Assessment Center"}
                </span>
                <span className="inline-flex w-fit items-center rounded-full bg-[#dce9ff] px-3 py-1.5 text-[12px] font-semibold text-[#093cab]">
                  {applicants.length} assigned
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="border-b border-[#f3d6d6] bg-[#fff4f4] px-5 py-3 text-[13px] text-[#93000a] sm:px-6">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-5 py-12 sm:px-6">
              <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                  <i aria-hidden="true" className="fa-solid fa-spinner animate-spin text-[18px]" />
                </div>
                <p className="mt-4 text-[14px] font-semibold text-[#0b1c30]">Loading assigned applicants...</p>
                <p className="mt-1 text-[13px] text-[#747685]">Pulling the latest assignment list for this center.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                <div className="space-y-3 px-4 py-4 sm:px-6">
                  {applicants.map((applicant) => (
                    <article key={applicant.id} className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                          <p className="mt-1 text-[12px] text-[#747685]">{applicant.applicant_reference}</p>
                        </div>
                        <span className="inline-flex shrink-0 rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#093cab]">
                          {applicant.assignment_batch ?? "Individual"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[14px] border border-[#e4ebf7] bg-white p-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Qualification</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{applicant.qualification}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Batch</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{applicant.assignment_batch ?? "Individual Assignment"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assigned</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{formatAssignedDate(applicant.assigned_at)}</p>
                        </div>
                      </div>
                    </article>
                  ))}

                  {applicants.length === 0 ? (
                    <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                        <i aria-hidden="true" className="fa-solid fa-user-group text-[18px]" />
                      </div>
                      <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                        No applicants have been assigned yet
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                        Assigned applicants from the admin portal will appear here once routed to this center.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden lg:block">
                {applicants.length > 0 ? (
                  <div className="border-b border-[#d9e3f7] bg-white px-6 py-3 text-[13px] text-[#5d5f5f]">
                    Showing <span className="font-semibold text-[#0b1c30]">{applicants.length}</span> assigned applicant
                    {applicants.length === 1 ? "" : "s"}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#d9e3f7] bg-[#f8fbff]">
                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                          Applicant
                        </th>
                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                          Qualification
                        </th>
                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                          Batch
                        </th>
                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                          Assigned At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9e3f7]">
                      {applicants.map((applicant) => (
                        <tr key={applicant.id} className="transition-colors hover:bg-[#f8fbff]">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-[14px] font-bold text-[#0b1c30]">{applicant.applicant_name}</p>
                              <p className="mt-0.5 text-[11px] text-[#747685]">{applicant.applicant_reference}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#444653]">{applicant.qualification}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[12px] font-medium text-[#093cab]">
                              {applicant.assignment_batch ?? "Individual Assignment"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#444653]">{formatAssignedDate(applicant.assigned_at)}</td>
                        </tr>
                      ))}

                      {applicants.length === 0 ? (
                        <tr>
                          <td className="px-6 py-14 text-center" colSpan={4}>
                            <div className="mx-auto max-w-[360px]">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                                <i aria-hidden="true" className="fa-solid fa-user-group text-[18px]" />
                              </div>
                              <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">
                                No applicants have been assigned yet
                              </p>
                              <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
                                Assigned applicants from the admin portal will appear here once routed to this center.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

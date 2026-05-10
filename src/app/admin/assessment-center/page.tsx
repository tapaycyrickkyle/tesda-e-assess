"use client";

import { useEffect, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";

type AssessmentCenter = {
  address: string;
  center_auth_user_id?: string | null;
  center_email?: string | null;
  contact: string;
  created_at?: string;
  id: string;
  manager: string;
  name: string;
};

type CenterFormState = {
  address: string;
  contact: string;
  email: string;
  manager: string;
  name: string;
  password: string;
};

const emptyFormState: CenterFormState = {
  address: "",
  contact: "",
  email: "",
  manager: "",
  name: "",
  password: "",
};

const formatCenterCreatedAt = (value?: string) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export default function AdminAssessmentCenterPage() {
  const [assessmentCenters, setAssessmentCenters] = useState<AssessmentCenter[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingCenter, setIsDeletingCenter] = useState(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);
  const [isSavingCenter, setIsSavingCenter] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [formState, setFormState] = useState<CenterFormState>(emptyFormState);
  const [selectedCenter, setSelectedCenter] = useState<AssessmentCenter | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAssessmentCenters = async () => {
      setIsLoadingCenters(true);
      setPageError("");

      try {
        const response = await fetch("/api/admin/assessment-centers", {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          centers?: AssessmentCenter[];
          message?: string;
          success?: boolean;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load assessment centers.");
        }

        if (isMounted) {
          setAssessmentCenters(payload.centers ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error instanceof Error ? error.message : "Unable to load assessment centers.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCenters(false);
        }
      }
    };

    void loadAssessmentCenters();

    return () => {
      isMounted = false;
    };
  }, []);

  const closeModal = () => {
    setIsAddModalOpen(false);
    setFormError("");
    setFormState(emptyFormState);
  };

  const closeDetailsModal = () => {
    setSelectedCenter(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleAddAssessmentCenter = async () => {
    const name = formState.name.trim();
    const address = formState.address.trim();
    const manager = formState.manager.trim();
    const contact = formState.contact.trim();
    const email = formState.email.trim().toLowerCase();
    const password = formState.password;

    if (!name || !address || !manager || !contact || !email || !password) {
      setFormError("Please complete all assessment center and login details.");
      return;
    }

    setIsSavingCenter(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/assessment-centers", {
        body: JSON.stringify({ address, contact, email, manager, name, password }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        center?: AssessmentCenter;
        message?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success || !payload.center) {
        throw new Error(payload.message ?? "Unable to create assessment center.");
      }

      setAssessmentCenters((currentCenters) => [payload.center!, ...currentCenters]);
      closeModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create assessment center.");
    } finally {
      setIsSavingCenter(false);
    }
  };

  const isSubmitDisabled =
    isSavingCenter ||
    formState.name.trim().length === 0 ||
    formState.address.trim().length === 0 ||
    formState.manager.trim().length === 0 ||
    formState.contact.trim().length === 0 ||
    formState.email.trim().length === 0 ||
    formState.password.length < 8;

  const handleDeleteAssessmentCenter = async () => {
    if (!selectedCenter) {
      return;
    }

    setIsDeletingCenter(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/assessment-centers", {
        body: JSON.stringify({ id: selectedCenter.id }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        message?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete assessment center.");
      }

      setAssessmentCenters((currentCenters) => currentCenters.filter((center) => center.id !== selectedCenter.id));
      closeDetailsModal();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete assessment center.");
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeletingCenter(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-24 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Assessment Center</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Manage and configure assessment center records from the admin portal.
          </p>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#c4c5d5] bg-white shadow-sm">
          {pageError ? (
            <div className="border-b border-[#f3d6d6] bg-[#fff4f4] px-5 py-3 text-[13px] text-[#93000a] sm:px-6">
              {pageError}
            </div>
          ) : null}

          {isLoadingCenters ? (
            <div className="px-5 py-10 text-center text-[14px] text-[#747685] sm:px-6">Loading assessment centers...</div>
          ) : (
            <>
              <div className="lg:hidden">
                <div className="space-y-3 px-4 py-4 sm:px-6">
                  {assessmentCenters.map((center) => (
                    <article
                      key={center.id}
                      className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] p-4 shadow-sm transition hover:border-[#bfd0f2] hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-[#0b1c30]">{center.name}</p>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[14px] border border-[#e4ebf7] bg-white p-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Address</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.address}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Center Head</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.manager}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Contact</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.contact}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCenter(center);
                          }}
                          type="button"
                        >
                          View More
                        </button>
                      </div>
                    </article>
                  ))}

                  {assessmentCenters.length === 0 ? (
                    <div className="rounded-[18px] border border-[#d9e3f7] bg-[#fbfdff] px-5 py-10 text-center text-[14px] text-[#747685]">
                      No assessment centers found yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d9e3f7] bg-[#f8fbff]">
                      <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        Center Name
                      </th>
                      <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        Address
                      </th>
                      <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        Center Head
                      </th>
                      <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d9e3f7]">
                    {assessmentCenters.map((center) => (
                      <tr
                        key={center.id}
                        className="transition-colors hover:bg-[#f8fbff]"
                      >
                        <td className="px-6 py-4">
                          <p className="text-[14px] font-bold text-[#0b1c30]">{center.name}</p>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#444653]">{center.address}</td>
                        <td className="px-6 py-4 text-[14px] text-[#444653]">{center.manager}</td>
                        <td className="px-6 py-4 text-[14px] text-[#444653]">{center.contact}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCenter(center);
                            }}
                            type="button"
                          >
                            View More
                          </button>
                        </td>
                      </tr>
                    ))}

                    {assessmentCenters.length === 0 ? (
                      <tr>
                        <td className="px-6 py-10 text-center text-[14px] text-[#747685]" colSpan={5}>
                          No assessment centers found yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-[#002576] px-5 py-3 text-[13px] font-bold text-white shadow-[0_16px_32px_rgba(0,37,118,0.24)] transition hover:bg-[#0038a8] lg:right-8"
        onClick={() => setIsAddModalOpen(true)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-plus text-[12px]" />
        Add Assessment Center
      </button>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={isAddModalOpen}
      >
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Add Assessment Center</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Enter the center details to save them to Supabase.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={closeModal}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="space-y-4 rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              {formError ? (
                <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#93000a]">
                  {formError}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Name</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter assessment center name"
                  type="text"
                  value={formState.name}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Address</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Enter center address"
                  type="text"
                  value={formState.address}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Head</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, manager: event.target.value }))}
                  placeholder="Enter assigned center head"
                  type="text"
                  value={formState.manager}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Contact</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, contact: event.target.value }))}
                  placeholder="Enter center contact number"
                  type="text"
                  value={formState.contact}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Login Email</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Enter assessment center login email"
                  type="email"
                  value={formState.email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Password</span>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter at least 8 characters"
                  type="password"
                  value={formState.password}
                />
                <p className="mt-2 text-[12px] text-[#747685]">This will be used on the main login page.</p>
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                  disabled={isSubmitDisabled}
                  onClick={handleAddAssessmentCenter}
                  type="button"
                >
                  {isSavingCenter ? "Saving..." : "Save Center"}
                </button>
              </div>
            </div>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(selectedCenter)}
      >
        {selectedCenter ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">{selectedCenter.name}</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Assessment center account and contact details.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={closeDetailsModal}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="space-y-3 rounded-b-[24px] bg-[#f8fbff] px-6 py-4 sm:px-7">
              <div className="rounded-[16px] border border-[#d9e3f7] bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] bg-[#f8fbff] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Address</p>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-[#0b1c30]">{selectedCenter.address}</p>
                  </div>
                  <div className="rounded-[12px] bg-[#f8fbff] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Center Head</p>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-[#0b1c30]">{selectedCenter.manager}</p>
                  </div>
                  <div className="rounded-[12px] bg-[#f8fbff] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Contact</p>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-[#0b1c30]">{selectedCenter.contact}</p>
                  </div>
                  <div className="rounded-[12px] bg-[#f8fbff] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Login Email</p>
                    <p className="mt-1.5 break-all text-[14px] leading-[1.55] text-[#0b1c30]">
                      {selectedCenter.center_email ?? "Not available"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[12px] bg-[#f8fbff] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Created</p>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-[#0b1c30]">
                    {formatCenterCreatedAt(selectedCenter.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#d9e3f7] pt-3 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={closeDetailsModal}
                  type="button"
                >
                  Close
                </button>
                <button
                  className="inline-flex min-w-[132px] items-center justify-center rounded-lg border border-[#efc5c5] bg-[#fff4f4] px-4 py-2.5 text-[12px] font-bold text-[#93000a] transition hover:bg-[#ffeaea]"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  type="button"
                >
                  Delete Center
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[460px] rounded-[20px] border border-[#c4c5d5] bg-white shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(selectedCenter && isDeleteConfirmOpen)}
        zIndexClassName="z-[60]"
      >
        {selectedCenter ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="text-[24px] font-semibold leading-[1.2] text-[#0b1c30]">Delete Assessment Center</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                This will remove the assessment center record, linked login account, and the matching `profiles` role
                entry.
              </p>
            </div>

            <div className="space-y-4 rounded-b-[24px] bg-[#f8fbff] px-6 py-5 sm:px-7">
              <div className="rounded-lg border border-[#f3d6d6] bg-[#fff4f4] px-4 py-4">
                <p className="text-[13px] leading-[1.6] text-[#93000a]">
                  Are you sure you want to delete <span className="font-bold">{selectedCenter.name}</span>?
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#c4c5d5] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isDeletingCenter}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#c65a5a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#b84d4d] disabled:cursor-not-allowed disabled:bg-[#d9a3a3]"
                  disabled={isDeletingCenter}
                  onClick={handleDeleteAssessmentCenter}
                  type="button"
                >
                  {isDeletingCenter ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>
    </main>
  );
}

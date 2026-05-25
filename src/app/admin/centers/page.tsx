"use client";

import { useEffect, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";

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

type EditCenterFormState = {
  address: string;
  contact: string;
  manager: string;
  name: string;
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

  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart}, ${timePart}`;
};

export default function AdminAssessmentCenterPage() {
  const [assessmentCenters, setAssessmentCenters] = useState<AssessmentCenter[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingCenter, setIsDeletingCenter] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);
  const [isSavingCenter, setIsSavingCenter] = useState(false);
  const [isUpdatingCenter, setIsUpdatingCenter] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [formState, setFormState] = useState<CenterFormState>(emptyFormState);
  const [editFormState, setEditFormState] = useState<EditCenterFormState>({
    address: "",
    contact: "",
    manager: "",
    name: "",
  });
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
    setIsEditModalOpen(false);
  };

  const openEditModal = () => {
    if (!selectedCenter) {
      return;
    }

    setEditFormState({
      address: selectedCenter.address,
      contact: selectedCenter.contact,
      manager: selectedCenter.manager,
      name: selectedCenter.name,
    });
    setFormError("");
    setIsEditModalOpen(true);
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

  const handleUpdateAssessmentCenter = async () => {
    if (!selectedCenter) {
      return;
    }

    const name = editFormState.name.trim();
    const address = editFormState.address.trim();
    const manager = editFormState.manager.trim();
    const contact = editFormState.contact.trim();

    if (!name || !address || !manager || !contact) {
      setFormError("Please complete the editable assessment center details.");
      return;
    }

    setIsUpdatingCenter(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/assessment-centers", {
        body: JSON.stringify({
          address,
          contact,
          id: selectedCenter.id,
          manager,
          name,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = (await response.json()) as {
        center?: AssessmentCenter;
        message?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success || !payload.center) {
        throw new Error(payload.message ?? "Unable to update assessment center.");
      }

      setAssessmentCenters((currentCenters) =>
        currentCenters.map((center) => (center.id === payload.center!.id ? payload.center! : center)),
      );
      setSelectedCenter(payload.center);
      setIsEditModalOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to update assessment center.");
    } finally {
      setIsUpdatingCenter(false);
    }
  };

  return (
    <main className="ui-portal-main pb-24 pt-8">
      <div className="ui-page-content">
        <section className="mb-5">
          <h1 className="ui-page-title text-[#002576]">Centers</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Manage assessment center records and open each center&apos;s details from the admin portal.
          </p>
        </section>

        <section className="mb-5">
          {pageError ? (
            <NotificationBanner className="mb-3 rounded-xl sm:px-6" compact message={pageError} variant="error" />
          ) : null}

          {isLoadingCenters ? (
            <div className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-8 text-center text-[14px] text-[#747685] shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-6">
              Loading assessment centers...
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                <div className="space-y-2.5 px-4 py-4 sm:px-6">
                  {assessmentCenters.map((center) => (
                    <article
                      key={center.id}
                      className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#bfd0f2] hover:bg-[#fcfdff]"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-[#0b1c30]">{center.name}</p>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-[#e7edf4] pt-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Address</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.address}</p>
                        </div>
                        <div className="border-t border-[#eef2fb] pt-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Center Head</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.manager}</p>
                        </div>
                        <div className="border-t border-[#eef2fb] pt-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Contact</p>
                          <p className="mt-1 text-[13px] text-[#444653]">{center.contact}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
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
                    <div className="px-4 py-8 text-center text-[14px] text-[#747685]">
                      No assessment centers found yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden lg:block">
                {assessmentCenters.length > 0 ? (
                  <div className="ui-data-table-shell">
                    <table className="ui-data-table">
                      <thead>
                        <tr>
                          <th className="text-left">
                            Center Name
                          </th>
                          <th className="text-left">
                            Address
                          </th>
                          <th className="text-left">
                            Center Head
                          </th>
                          <th className="text-left">
                            Contact
                          </th>
                          <th className="text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentCenters.map((center) => (
                          <tr key={center.id}>
                            <td>
                              <div className="ui-data-table-stack">
                                <p className="ui-data-table-title truncate">{center.name}</p>
                                <p className="ui-data-table-meta">{formatCenterCreatedAt(center.created_at)}</p>
                              </div>
                            </td>
                            <td>
                              <p className="ui-data-table-copy max-w-[300px] truncate">{center.address}</p>
                            </td>
                            <td>
                              <p className="ui-data-table-copy font-semibold text-[#0b1c30]">{center.manager}</p>
                            </td>
                            <td>
                              <p className="ui-data-table-copy font-semibold text-[#0b1c30]">{center.contact}</p>
                            </td>
                            <td className="text-right">
                              <button
                                className="ui-data-table-action"
                                onClick={() => setSelectedCenter(center)}
                                type="button"
                              >
                                <span>View Details</span>
                                <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-[14px] text-[#747685]">
                    No assessment centers found yet.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-lg bg-[#002576] px-5 py-3 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(0,37,118,0.16)] transition hover:bg-[#0038a8] lg:right-8"
        onClick={() => setIsAddModalOpen(true)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-plus text-[12px]" />
        Add Assessment Center
      </button>

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isAddModalOpen}
      >
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">Add Assessment Center</h2>
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

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              {formError ? (
                <NotificationBanner compact message={formError} variant="error" />
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Name</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter assessment center name"
                  type="text"
                  value={formState.name}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Address</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Enter center address"
                  type="text"
                  value={formState.address}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Head</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, manager: event.target.value }))}
                  placeholder="Enter assigned center head"
                  type="text"
                  value={formState.manager}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Contact</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, contact: event.target.value }))}
                  placeholder="Enter center contact number"
                  type="text"
                  value={formState.contact}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Login Email</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Enter assessment center login email"
                  type="email"
                  value={formState.email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Password</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter at least 8 characters"
                  type="password"
                  value={formState.password}
                />
                <p className="mt-2 text-[12px] text-[#747685]">This will be used on the main login page.</p>
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[540px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(selectedCenter)}
      >
        {selectedCenter ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-4 sm:px-7">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">{selectedCenter.name}</h2>
                <p className="mt-1 text-[13px] leading-[1.5] text-[#444653]">
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

            <div className="ui-modal-section space-y-3 px-6 py-3.5 sm:px-7">
              <div className="grid gap-x-6 sm:grid-cols-2">
                <div className="ui-list-row">
                  <div className="min-w-0">
                    <p className="ui-meta-label">Address</p>
                    <p className="ui-meta-value">{selectedCenter.address}</p>
                  </div>
                </div>
                <div className="ui-list-row">
                  <div className="min-w-0">
                    <p className="ui-meta-label">Center Head</p>
                    <p className="ui-meta-value">{selectedCenter.manager}</p>
                  </div>
                </div>
                <div className="ui-list-row">
                  <div className="min-w-0">
                    <p className="ui-meta-label">Contact</p>
                    <p className="ui-meta-value">{selectedCenter.contact}</p>
                  </div>
                </div>
                <div className="ui-list-row">
                  <div className="min-w-0">
                    <p className="ui-meta-label">Login Email</p>
                    <p className="ui-meta-value break-all">{selectedCenter.center_email ?? "Not available"}</p>
                  </div>
                </div>
                <div className="ui-list-row sm:col-span-2">
                  <div className="min-w-0">
                    <p className="ui-meta-label">Created</p>
                    <p className="ui-meta-value">{formatCenterCreatedAt(selectedCenter.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#d9e3f7] pt-3 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={closeDetailsModal}
                  type="button"
                >
                  Close
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={openEditModal}
                  type="button"
                >
                  Edit Center
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
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(selectedCenter && isEditModalOpen)}
        zIndexClassName="z-[60]"
      >
        {selectedCenter ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <div>
                <h2 className="ui-section-title text-[#0b1c30]">Edit Assessment Center</h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                  Update the center record details without changing its linked login email.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => setIsEditModalOpen(false)}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              {formError ? <NotificationBanner compact message={formError} variant="error" /> : null}

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Name</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setEditFormState((current) => ({ ...current, name: event.target.value }))}
                  type="text"
                  value={editFormState.name}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Address</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setEditFormState((current) => ({ ...current, address: event.target.value }))}
                  type="text"
                  value={editFormState.address}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Head</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setEditFormState((current) => ({ ...current, manager: event.target.value }))}
                  type="text"
                  value={editFormState.manager}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Contact</span>
                <input
                  className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  onChange={(event) => setEditFormState((current) => ({ ...current, contact: event.target.value }))}
                  type="text"
                  value={editFormState.contact}
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isUpdatingCenter}
                  onClick={() => setIsEditModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                  disabled={isUpdatingCenter}
                  onClick={handleUpdateAssessmentCenter}
                  type="button"
                >
                  {isUpdatingCenter ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[460px] rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(selectedCenter && isDeleteConfirmOpen)}
        zIndexClassName="z-[60]"
      >
        {selectedCenter ? (
          <>
            <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
              <h2 className="ui-section-title text-[#0b1c30]">Delete Assessment Center</h2>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#444653]">
                This will remove the assessment center record, linked login account, and the matching `profiles` role
                entry.
              </p>
            </div>

            <div className="ui-modal-section space-y-4 px-6 py-5 sm:px-7">
              <div className="border-t border-[#f0d5d5] pt-4">
                <p className="text-[13px] leading-[1.6] text-[#93000a]">
                  Are you sure you want to delete <span className="font-bold">{selectedCenter.name}</span>?
                </p>
              </div>

              <div className="border-t border-[#e7edf4] pt-4">
                <p className="text-[13px] leading-[1.6] text-[#30435f]">
                  Delete is only allowed when this center no longer has active applicant assignments still being handled.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  disabled={isDeletingCenter}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-w-[112px] items-center justify-center rounded-lg bg-[#d97a7a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#c96a6a] disabled:cursor-not-allowed disabled:bg-[#e6b8b8]"
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

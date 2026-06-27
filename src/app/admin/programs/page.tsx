"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { parseApiResponse } from "@/lib/api-response";

type ProgramRecord = {
  created_at?: string;
  id: string;
  is_active: boolean;
  title: string;
  updated_at?: string;
};

type ProgramsResponse = {
  message?: string;
  program?: ProgramRecord;
  programs?: ProgramRecord[];
  success?: boolean;
};

export default function AdminProgramsPage() {
  const [editProgramTitle, setEditProgramTitle] = useState("");
  const [editingProgram, setEditingProgram] = useState<ProgramRecord | null>(null);
  const [formError, setFormError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [isUpdatingProgram, setIsUpdatingProgram] = useState(false);
  const [pageError, setPageError] = useState("");
  const [programTitle, setProgramTitle] = useState("");
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingProgramId, setSavingProgramId] = useState<string | null>(null);
  const activeProgramCount = useMemo(() => programs.filter((program) => program.is_active).length, [programs]);
  const filteredPrograms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return programs;
    }

    return programs.filter((program) => program.title.toLowerCase().includes(normalizedQuery));
  }, [programs, searchQuery]);

  useEffect(() => {
    let isMounted = true;

    const loadPrograms = async () => {
      setIsLoadingPrograms(true);
      setPageError("");

      try {
        const response = await fetch("/api/admin/programs", { credentials: "same-origin" });
        const payload = await parseApiResponse<ProgramsResponse>(response);

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load programs.");
        }

        if (isMounted) {
          setPrograms(payload.programs ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error instanceof Error ? error.message : "Unable to load programs.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrograms(false);
        }
      }
    };

    void loadPrograms();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddProgram = async () => {
    const title = programTitle.trim();

    if (!title) {
      setFormError("Program title is required.");
      return;
    }

    setIsSavingProgram(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/programs", {
        body: JSON.stringify({ title }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = await parseApiResponse<ProgramsResponse>(response);

      if (!response.ok || !payload.success || !payload.program) {
        throw new Error(payload.message ?? "Unable to add program.");
      }

      setPrograms((currentPrograms) =>
        [payload.program!, ...currentPrograms].sort((left, right) => {
          if (left.is_active !== right.is_active) {
            return left.is_active ? -1 : 1;
          }

          return left.title.localeCompare(right.title);
        }),
      );
      setProgramTitle("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to add program.");
    } finally {
      setIsSavingProgram(false);
    }
  };

  const handleToggleProgram = async (program: ProgramRecord) => {
    setSavingProgramId(program.id);
    setPageError("");

    try {
      const response = await fetch("/api/admin/programs", {
        body: JSON.stringify({
          id: program.id,
          isActive: !program.is_active,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = await parseApiResponse<ProgramsResponse>(response);

      if (!response.ok || !payload.success || !payload.program) {
        throw new Error(payload.message ?? "Unable to update program.");
      }

      setPrograms((currentPrograms) =>
        currentPrograms
          .map((currentProgram) => (currentProgram.id === payload.program!.id ? payload.program! : currentProgram))
          .sort((left, right) => {
            if (left.is_active !== right.is_active) {
              return left.is_active ? -1 : 1;
            }

            return left.title.localeCompare(right.title);
          }),
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update program.");
    } finally {
      setSavingProgramId(null);
    }
  };

  const handleOpenEditModal = (program: ProgramRecord) => {
    setEditingProgram(program);
    setEditProgramTitle(program.title);
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingProgram(null);
    setEditProgramTitle("");
    setFormError("");
    setIsEditModalOpen(false);
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) {
      return;
    }

    const title = editProgramTitle.trim();

    if (!title) {
      setFormError("Program title is required.");
      return;
    }

    setIsUpdatingProgram(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/programs", {
        body: JSON.stringify({
          id: editingProgram.id,
          title,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = await parseApiResponse<ProgramsResponse>(response);

      if (!response.ok || !payload.success || !payload.program) {
        throw new Error(payload.message ?? "Unable to update program.");
      }

      setPrograms((currentPrograms) =>
        currentPrograms
          .map((currentProgram) => (currentProgram.id === payload.program!.id ? payload.program! : currentProgram))
          .sort((left, right) => {
            if (left.is_active !== right.is_active) {
              return left.is_active ? -1 : 1;
            }

            return left.title.localeCompare(right.title);
          }),
      );
      handleCloseEditModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to update program.");
    } finally {
      setIsUpdatingProgram(false);
    }
  };

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Programs</h1>
          <p className="ui-page-description">
            Add available qualifications and control which programs applicants and teachers can currently choose.
          </p>
        </section>

        {pageError ? <NotificationBanner className="mb-5" message={pageError} variant="error" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
          <article className="ui-surface p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Add Program</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-[44px] w-full rounded-lg border border-[#d9e3f7] bg-white px-4 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                onChange={(event) => setProgramTitle(event.target.value)}
                placeholder="Enter a new program title"
                value={programTitle}
              />
              <button
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSavingProgram || programTitle.trim().length === 0}
                onClick={handleAddProgram}
                type="button"
              >
                {isSavingProgram ? "Adding..." : "Add Program"}
              </button>
            </div>
            {formError ? <p className="mt-2 text-[12px] text-[#93000a]">{formError}</p> : null}
          </article>

          <article className="ui-surface p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Summary</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#d9e3f7] bg-[#fbfdff] px-4 py-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#747685]">Total</p>
                <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{programs.length}</p>
              </div>
              <div className="rounded-lg border border-[#d9e3f7] bg-[#fbfdff] px-4 py-3">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#747685]">Available</p>
                <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{activeProgramCount}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="ui-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Program List</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-[#5d5f5f]">
                Available programs appear in applicant and teacher qualification selectors. Unavailable programs stay hidden from new selections.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Search</span>
              <input
                className="min-h-[44px] w-full rounded-lg border border-[#d9e3f7] bg-white px-4 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search programs..."
                value={searchQuery}
              />
            </label>
          </div>

          {isLoadingPrograms ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center text-[14px] text-[#5d5f5f]">
              Loading programs...
            </div>
          ) : programs.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center text-[14px] text-[#5d5f5f]">
              No programs found yet.
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#d9e3f7] bg-[#fbfdff] px-4 py-8 text-center text-[14px] text-[#5d5f5f]">
              No programs match your search.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {filteredPrograms.map((program) => (
                <article
                  key={program.id}
                  className="rounded-lg border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold leading-[1.25] text-[#0b1c30]">{program.title}</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff] sm:w-auto"
                        onClick={() => handleOpenEditModal(program)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={`inline-flex min-h-[40px] w-full items-center justify-center rounded-lg px-4 text-[13px] font-bold transition sm:w-auto ${
                          program.is_active
                            ? "border border-[#d4d7de] bg-white text-[#4f535d] hover:bg-[#f7f8fb]"
                            : "bg-[#002576] text-white hover:bg-[#0038a8]"
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                        disabled={savingProgramId === program.id}
                        onClick={() => void handleToggleProgram(program)}
                        type="button"
                      >
                        {savingProgramId === program.id
                          ? "Saving..."
                          : program.is_active
                            ? "Unavailable"
                            : "Available"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <AnimatedModal
          contentClassName="w-full max-w-[520px] rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          open={isEditModalOpen}
          zIndexClassName="z-[60]"
        >
          {editingProgram ? (
            <>
              <div className="border-b border-[#d9e3f7] px-6 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Edit Program</p>
                    <h2 className="mt-2 text-[20px] font-semibold text-[#0b1c30]">Update program title</h2>
                  </div>
                  <button
                    aria-label="Close edit program modal"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e3f7] bg-white text-[16px] text-[#5d5f5f] transition hover:bg-[#eff4ff] hover:text-[#002576]"
                    disabled={isUpdatingProgram}
                    onClick={handleCloseEditModal}
                    type="button"
                  >
                    <i aria-hidden="true" className="fa-solid fa-xmark" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 sm:px-7">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Program Title</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    onChange={(event) => setEditProgramTitle(event.target.value)}
                    placeholder="Enter the updated program title"
                    value={editProgramTitle}
                  />
                </label>
                {formError ? <p className="mt-2 text-[12px] text-[#93000a]">{formError}</p> : null}
              </div>

              <div className="flex flex-col gap-2 border-t border-[#e3ebfb] px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-5 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isUpdatingProgram}
                  onClick={handleCloseEditModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0038a8] px-5 text-[14px] font-bold text-white transition hover:bg-[#002576] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isUpdatingProgram || editProgramTitle.trim().length === 0}
                  onClick={() => void handleUpdateProgram()}
                  type="button"
                >
                  {isUpdatingProgram ? "Saving..." : "Save Program"}
                </button>
              </div>
            </>
          ) : null}
        </AnimatedModal>
      </div>
    </main>
  );
}

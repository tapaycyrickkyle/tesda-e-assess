"use client";

import { startTransition, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import type { CurrentAppUser } from "@/lib/current-user";
import type { UserProfileView } from "@/lib/user-profile";

type UserProfilePageProps = {
  currentUser: CurrentAppUser;
  profileView: UserProfileView;
};

function getRoleHeading(role: CurrentAppUser["role"]) {
  if (role === "assessment_center") {
    return "Assessment Center Account";
  }

  return `${role.charAt(0).toUpperCase() + role.slice(1)} Account`;
}

export default function UserProfilePage({ currentUser, profileView }: UserProfilePageProps) {
  const router = useRouter();
  const [assessmentCenterForm, setAssessmentCenterForm] = useState(
    profileView.editor.assessmentCenter ?? {
      address: "",
      contact: "",
      manager: "",
      name: "",
    },
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(profileView.editor.profile);
  const [successMessage, setSuccessMessage] = useState("");
  const isAssessmentCenter = currentUser.role === "assessment_center";
  const isTeacher = currentUser.role === "teacher";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const payload = isAssessmentCenter
        ? assessmentCenterForm
        : {
            contactNumber: profileForm.contactNumber,
            firstName: profileForm.firstName,
            institutionName: isTeacher ? profileForm.institutionName : undefined,
            institutionType: isTeacher ? profileForm.institutionType : undefined,
            lastName: profileForm.lastName,
            middleName: profileForm.middleName,
            positionTitle: isTeacher ? profileForm.positionTitle : undefined,
          };

      const response = await fetch("/api/profile", {
        body: JSON.stringify(payload),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const result = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to update your account right now.");
      }

      setSuccessMessage(result.message ?? "Account updated successfully.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update your account right now.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleProfileChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAssessmentCenterChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setAssessmentCenterForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content-narrow">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">{getRoleHeading(currentUser.role)}</h1>
          <p className="ui-page-description">
            Review and update the account details currently linked to your portal access.
          </p>
        </section>

        {profileView.notice ? <NotificationBanner className="mb-5" message={profileView.notice} variant="warning" /> : null}
        {errorMessage ? <NotificationBanner className="mb-5" message={errorMessage} variant="error" /> : null}
        {successMessage ? <NotificationBanner className="mb-5" message={successMessage} variant="success" /> : null}

        <section className="ui-surface-highlight mb-5 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Account Overview</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="ui-section-title text-[#0b1c30]">{profileView.displayName}</h2>
              <p className="mt-1 text-[14px] leading-[1.55] text-[#444653]">{currentUser.email}</p>
              <p className="mt-2 text-[12px] text-[#747685]">Email address and account role are managed separately and cannot be edited here.</p>
            </div>
            <span className="ui-badge ui-badge-accent">
              {currentUser.role.replace(/_/g, " ")}
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {profileView.sections.map((section) => (
            <article key={section.title} className="ui-surface p-5">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">{section.title}</p>
              <div className="mt-3">
                {section.fields.map((field) => (
                  <div key={field.label} className="ui-list-row">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">{field.label}</p>
                      <p className="mt-1 text-[14px] font-semibold leading-[1.55] text-[#0b1c30]">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="ui-surface mt-5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Edit Details</p>
              <h2 className="mt-2 text-[20px] font-semibold text-[#0b1c30]">
                {isAssessmentCenter ? "Update assessment center information" : "Update personal account information"}
              </h2>
            </div>
            <span className="ui-badge ui-badge-accent">
              {currentUser.role.replace(/_/g, " ")}
            </span>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {isAssessmentCenter ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Center Name</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="name"
                    onChange={handleAssessmentCenterChange}
                    required
                    type="text"
                    value={assessmentCenterForm.name}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Manager</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="manager"
                    onChange={handleAssessmentCenterChange}
                    required
                    type="text"
                    value={assessmentCenterForm.manager}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Contact</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="contact"
                    onChange={handleAssessmentCenterChange}
                    required
                    type="text"
                    value={assessmentCenterForm.contact}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Address</span>
                  <textarea
                    className="min-h-[108px] w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="address"
                    onChange={handleAssessmentCenterChange}
                    required
                    value={assessmentCenterForm.address}
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">First Name</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="firstName"
                    onChange={handleProfileChange}
                    required
                    type="text"
                    value={profileForm.firstName}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Last Name</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="lastName"
                    onChange={handleProfileChange}
                    required
                    type="text"
                    value={profileForm.lastName}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Middle Name</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="middleName"
                    onChange={handleProfileChange}
                    type="text"
                    value={profileForm.middleName}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Contact Number</span>
                  <input
                    className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                    name="contactNumber"
                    onChange={handleProfileChange}
                    placeholder="09123456789"
                    type="text"
                    value={profileForm.contactNumber}
                  />
                </label>

                {isTeacher ? (
                  <>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Institution Name</span>
                      <input
                        className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                        name="institutionName"
                        onChange={handleProfileChange}
                        type="text"
                        value={profileForm.institutionName}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Institution Type</span>
                      <select
                        className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                        name="institutionType"
                        onChange={handleProfileChange}
                        value={profileForm.institutionType}
                      >
                        <option value="">Select institution type</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-bold text-[#0b1c30]">Position Title</span>
                      <input
                        className="w-full rounded-lg border border-[#d9e3f7] bg-white px-4 py-3 text-[14px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                        name="positionTitle"
                        onChange={handleProfileChange}
                        type="text"
                        value={profileForm.positionTitle}
                      />
                    </label>
                  </>
                ) : null}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-[#e3ebfb] pt-4 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0038a8] px-5 text-[14px] font-bold text-white transition hover:bg-[#002576] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save Account"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

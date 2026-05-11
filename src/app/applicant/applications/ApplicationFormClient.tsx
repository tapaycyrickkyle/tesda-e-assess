"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  assessmentTypeOptions,
  civilStatusOptions,
  clientTypeOptions,
  createEmptyApplicationFormData,
  educationalAttainmentOptions,
  employmentStatusOptions,
  normalizeApplicationFormData,
  sexOptions,
  type ApplicantApplicationFormData,
  type ApplicationSubmissionRecord,
  type CompetencyAssessmentItem,
  type LicensureExamItem,
  type TrainingItem,
  type WorkExperienceItem,
} from "@/lib/application-form";

type ApplicationMode = "individual" | "room";

type ApplicantApplicationFormClientProps = {
  applicantEmail: string;
  existingSubmission: ApplicationSubmissionRecord | null;
  mode: ApplicationMode;
  room:
    | {
        id: string;
        join_code: string;
        name: string;
        qualification: string;
      }
    | null;
};

type SubmissionResponse = {
  message?: string;
  submissionId?: string | null;
  success: boolean;
  validationErrors?: string[];
};

type RepeaterSectionProps<T extends { [key: string]: string }> = {
  addButtonLabel: string;
  disabled?: boolean;
  fields: Array<{ key: keyof T; label: string; placeholder?: string; type?: "date" | "text" }>;
  items: T[];
  onAdd: () => void;
  onChange: (index: number, key: keyof T, value: string) => void;
  onRemove: (index: number) => void;
  title: string;
};

type FormStep = {
  description: string;
  id: string;
  title: string;
};

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function emptyWorkExperienceItem(): WorkExperienceItem {
  return {
    companyName: "",
    position: "",
    inclusiveDates: "",
    monthlySalary: "",
    appointmentStatus: "",
    yearsOfExperience: "",
  };
}

function emptyTrainingItem(): TrainingItem {
  return {
    title: "",
    venue: "",
    inclusiveDates: "",
    hours: "",
    conductedBy: "",
  };
}

function emptyLicensureExamItem(): LicensureExamItem {
  return {
    title: "",
    yearTaken: "",
    examinationVenue: "",
    rating: "",
    remarks: "",
    expiryDate: "",
  };
}

function emptyCompetencyAssessmentItem(): CompetencyAssessmentItem {
  return {
    title: "",
    qualificationLevel: "",
    industrySector: "",
    certificateNumber: "",
    dateOfIssuance: "",
    expirationDate: "",
  };
}

function extractMiddleInitial(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue.charAt(0).toUpperCase() : "";
}

function mergeInitialFormData(
  applicantEmail: string,
  existingSubmission: ApplicationSubmissionRecord | null,
  room: ApplicantApplicationFormClientProps["room"],
) {
  const emptyState = createEmptyApplicationFormData();
  const existingFormData = existingSubmission ? normalizeApplicationFormData(existingSubmission.form_data) : emptyState;

  return {
    ...emptyState,
    ...existingFormData,
    applicationDate: existingFormData.applicationDate || getTodayDateValue(),
    emailAddress: existingFormData.emailAddress || applicantEmail,
    middleInitial: extractMiddleInitial(existingFormData.middleName) || existingFormData.middleInitial,
    qualificationTitle: room?.qualification || existingFormData.qualificationTitle || "",
    schoolName: existingFormData.schoolName || room?.name || "",
    trainings: existingFormData.trainings.length > 0 ? existingFormData.trainings : [emptyTrainingItem()],
    workExperiences:
      existingFormData.workExperiences.length > 0 ? existingFormData.workExperiences : [emptyWorkExperienceItem()],
    licensureExams:
      existingFormData.licensureExams.length > 0 ? existingFormData.licensureExams : [emptyLicensureExamItem()],
    competencyAssessments:
      existingFormData.competencyAssessments.length > 0
        ? existingFormData.competencyAssessments
        : [emptyCompetencyAssessmentItem()],
  } satisfies ApplicantApplicationFormData;
}

const formSteps: FormStep[] = [
  {
    id: "assessment",
    title: "Assessment Details",
    description: "Assessment title, school details, and application route context.",
  },
  {
    id: "identity",
    title: "Applicant Identity",
    description: "Name and mailing address information from the official form.",
  },
  {
    id: "personal",
    title: "Contact And Personal Info",
    description: "Contact details, demographics, and employment background.",
  },
  {
    id: "experience",
    title: "Work And Training",
    description: "Work experience and seminars or training attended.",
  },
  {
    id: "credentials",
    title: "Credentials",
    description: "Licensure exams and competency assessments passed.",
  },
  {
    id: "review",
    title: "Review And Submit",
    description: "Final confirmation and PDF submission testing.",
  },
];

export default function ApplicantApplicationFormClient({
  applicantEmail,
  existingSubmission,
  mode,
  room,
}: ApplicantApplicationFormClientProps) {
  const initialFormData = useMemo(
    () => mergeInitialFormData(applicantEmail, existingSubmission, room),
    [applicantEmail, existingSubmission, room],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSubmissionId, setSavedSubmissionId] = useState(existingSubmission?.id ?? null);
  const [successMessage, setSuccessMessage] = useState("");
  const isReadOnly = false;
  const activeStep = formSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === formSteps.length - 1;

  function updateField<Key extends keyof ApplicantApplicationFormData>(key: Key, value: ApplicantApplicationFormData[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMiddleName(value: string) {
    setFormData((current) => ({
      ...current,
      middleName: value,
      middleInitial: extractMiddleInitial(value),
    }));
  }

  function updateMailingAddressField(key: keyof ApplicantApplicationFormData["mailingAddress"], value: string) {
    setFormData((current) => ({
      ...current,
      mailingAddress: {
        ...current.mailingAddress,
        [key]: value,
      },
    }));
  }

  function updateRepeaterItem<T extends { [key: string]: string }>(
    key: "workExperiences" | "trainings" | "licensureExams" | "competencyAssessments",
    index: number,
    fieldKey: keyof T,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [fieldKey]: value,
            }
          : item,
      ),
    }));
  }

  function addRepeaterItem(
    key: "workExperiences" | "trainings" | "licensureExams" | "competencyAssessments",
    itemFactory:
      | (() => WorkExperienceItem)
      | (() => TrainingItem)
      | (() => LicensureExamItem)
      | (() => CompetencyAssessmentItem),
  ) {
    setFormData((current) => ({
      ...current,
      [key]: [...current[key], itemFactory()],
    }));
  }

  function removeRepeaterItem(
    key: "workExperiences" | "trainings" | "licensureExams" | "competencyAssessments",
    index: number,
    fallbackFactory:
      | (() => WorkExperienceItem)
      | (() => TrainingItem)
      | (() => LicensureExamItem)
      | (() => CompetencyAssessmentItem),
  ) {
    setFormData((current) => {
      const remainingItems = current[key].filter((_, itemIndex) => itemIndex !== index);

      return {
        ...current,
        [key]: remainingItems.length > 0 ? remainingItems : [fallbackFactory()],
      };
    });
  }

  function jumpToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNextStep() {
    if (isLastStep) {
      return;
    }

    jumpToStep(currentStep + 1);
  }

  function goToPreviousStep() {
    if (isFirstStep) {
      return;
    }

    jumpToStep(currentStep - 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/applicant/application-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          roomId: mode === "room" ? room?.id ?? null : null,
          submissionId: existingSubmission?.id ?? null,
          submissionSource: mode,
        }),
      });

      const payload = (await response.json()) as SubmissionResponse;

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Unable to submit the application form.");
        return;
      }
      setSavedSubmissionId(payload.submissionId ?? existingSubmission?.id ?? savedSubmissionId);
      setSuccessMessage(payload.message ?? "Application form submitted successfully.");
      jumpToStep(formSteps.length - 1);
    } catch {
      setErrorMessage("Unable to submit the application form right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderCurrentStep() {
    switch (activeStep.id) {
      case "assessment":
        return (
          <SectionCard
            description="Start with the assessment title, school or training center details, and the route this form will follow."
            title="Assessment Details"
          >
            <SubsectionCard description="Core application details used to route and label the PDF correctly." title="Application Info">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TextField
                  disabled={isReadOnly}
                  label="Application Date"
                  onChange={(value) => updateField("applicationDate", value)}
                  type="date"
                  value={formData.applicationDate}
                />
                <TextField
                  disabled={isReadOnly || Boolean(room)}
                  label="School / Training Center / Company"
                  onChange={(value) => updateField("schoolName", value)}
                  placeholder="Enter the school, center, or company"
                  value={formData.schoolName}
                />
                <TextField
                  disabled={isReadOnly || Boolean(room)}
                  label="Assessment Applied For"
                  onChange={(value) => updateField("qualificationTitle", value)}
                  placeholder="Enter the qualification or assessment title"
                  value={formData.qualificationTitle}
                />
              </div>

              <TextField
                disabled={isReadOnly}
                label="Address"
                onChange={(value) => updateField("schoolAddress", value)}
                placeholder="Enter the full address"
                value={formData.schoolAddress}
              />
            </SubsectionCard>

            <SubsectionCard description="Choose how this application should be classified before submission." title="Classification">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <OptionGroup
                  columnsClassName="grid-cols-1 sm:grid-cols-3"
                  disabled={isReadOnly}
                  label="Assessment Type"
                  onChange={(value) => updateField("assessmentType", value)}
                  options={assessmentTypeOptions}
                  value={formData.assessmentType}
                />

                <OptionGroup
                  columnsClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  disabled={isReadOnly}
                  label="Client Type"
                  onChange={(value) => updateField("clientType", value)}
                  options={clientTypeOptions}
                  value={formData.clientType}
                />
              </div>
            </SubsectionCard>
          </SectionCard>
        );
      case "identity":
        return (
          <SectionCard
            description="Fill in the applicant name block and mailing address. These fields help position the PDF output correctly."
            title="Applicant Identity"
          >
            <SubsectionCard description="Keep the applicant name grouped together so it reads like one identity block." title="Full Name">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TextField
                  disabled={isReadOnly}
                  label="Surname"
                  onChange={(value) => updateField("surname", value)}
                  placeholder="Surname"
                  value={formData.surname}
                />
                <TextField
                  disabled={isReadOnly}
                  label="First Name"
                  onChange={(value) => updateField("firstName", value)}
                  placeholder="First name"
                  value={formData.firstName}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Middle Name"
                  onChange={updateMiddleName}
                  placeholder="Middle name"
                  value={formData.middleName}
                />
                <TextField
                  disabled
                  label="Middle Initial"
                  onChange={() => undefined}
                  placeholder="M.I."
                  value={formData.middleInitial}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Name Extension"
                  onChange={(value) => updateField("nameExtension", value)}
                  placeholder="Jr., Sr., III"
                  value={formData.nameExtension}
                />
              </div>
            </SubsectionCard>

            <SubsectionCard description="Address fields are grouped in a simple location flow from street down to region and zip code." title="Mailing Address">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TextField
                  disabled={isReadOnly}
                  label="Number / Street"
                  onChange={(value) => updateMailingAddressField("numberStreet", value)}
                  placeholder="House number and street"
                  value={formData.mailingAddress.numberStreet}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Barangay"
                  onChange={(value) => updateMailingAddressField("barangay", value)}
                  placeholder="Barangay"
                  value={formData.mailingAddress.barangay}
                />
                <TextField
                  disabled={isReadOnly}
                  label="District"
                  onChange={(value) => updateMailingAddressField("district", value)}
                  placeholder="District"
                  value={formData.mailingAddress.district}
                />
                <TextField
                  disabled={isReadOnly}
                  label="City"
                  onChange={(value) => updateMailingAddressField("city", value)}
                  placeholder="City"
                  value={formData.mailingAddress.city}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Province"
                  onChange={(value) => updateMailingAddressField("province", value)}
                  placeholder="Province"
                  value={formData.mailingAddress.province}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Region"
                  onChange={(value) => updateMailingAddressField("region", value)}
                  placeholder="Region"
                  value={formData.mailingAddress.region}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Zip Code"
                  onChange={(value) => updateMailingAddressField("zipCode", value)}
                  placeholder="Zip code"
                  value={formData.mailingAddress.zipCode}
                />
              </div>
            </SubsectionCard>
          </SectionCard>
        );
      case "personal":
        return (
          <SectionCard
            description="Add contact details plus the applicant profile choices from the official TESDA form."
            title="Contact And Personal Info"
          >
            <SubsectionCard description="Primary ways to contact the applicant are grouped together in one place." title="Contact Details">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TextField
                  disabled={isReadOnly}
                  label="Email Address"
                  onChange={(value) => updateField("emailAddress", value)}
                  placeholder="Email address"
                  type="email"
                  uppercase={false}
                  value={formData.emailAddress}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Mobile Number"
                  onChange={(value) => updateField("mobileNumber", value)}
                  placeholder="Mobile number"
                  value={formData.mobileNumber}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Home Telephone"
                  onChange={(value) => updateField("homeTelephone", value)}
                  placeholder="Telephone number"
                  value={formData.homeTelephone}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Fax Number"
                  onChange={(value) => updateField("faxNumber", value)}
                  placeholder="Fax number"
                  value={formData.faxNumber}
                />
                <div className="lg:col-span-2">
                  <TextField
                    disabled={isReadOnly}
                    label="Other Contact Number(s)"
                    onChange={(value) => updateField("contactNumbers", value)}
                    placeholder="Additional contact numbers"
                    value={formData.contactNumbers}
                  />
                </div>
              </div>
            </SubsectionCard>

            <SubsectionCard description="Personal profile selections are grouped by category so they are easier to scan." title="Profile Details">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <OptionGroup
                  columnsClassName="grid-cols-2"
                  disabled={isReadOnly}
                  label="Sex"
                  onChange={(value) => updateField("sex", value)}
                  options={sexOptions}
                  value={formData.sex}
                />
                <OptionGroup
                  columnsClassName="grid-cols-2"
                  disabled={isReadOnly}
                  label="Civil Status"
                  onChange={(value) => updateField("civilStatus", value)}
                  options={civilStatusOptions}
                  value={formData.civilStatus}
                />
                <OptionGroup
                  columnsClassName="grid-cols-1 sm:grid-cols-2"
                  disabled={isReadOnly}
                  label="Highest Educational Attainment"
                  onChange={(value) => updateField("educationalAttainment", value)}
                  options={educationalAttainmentOptions}
                  value={formData.educationalAttainment}
                />
                <div className="space-y-2.5">
                  <OptionGroup
                    columnsClassName="grid-cols-1 sm:grid-cols-2"
                    disabled={isReadOnly}
                    label="Employment Status"
                    onChange={(value) => updateField("employmentStatus", value)}
                    options={employmentStatusOptions}
                    value={formData.employmentStatus}
                  />
                  {formData.employmentStatus === "Others" ? (
                    <TextField
                      disabled={isReadOnly}
                      label="Other Employment Status"
                      onChange={(value) => updateField("otherEmploymentStatus", value)}
                      placeholder="Specify employment status"
                      value={formData.otherEmploymentStatus}
                    />
                  ) : null}
                </div>
              </div>
            </SubsectionCard>

            <SubsectionCard description="Birth information stays together in one compact row for faster completion." title="Birth Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <TextField
                  disabled={isReadOnly}
                  label="Birth Date"
                  onChange={(value) => updateField("dateOfBirth", value)}
                  type="date"
                  value={formData.dateOfBirth}
                />
                <TextField
                  disabled={isReadOnly}
                  label="Birth Place"
                  onChange={(value) => updateField("birthPlace", value)}
                  placeholder="Birth place"
                  value={formData.birthPlace}
                />
                <TextField
                  disabled
                  label="Age"
                  onChange={() => undefined}
                  placeholder="Auto-computed"
                  value={calculateAge(formData.dateOfBirth)}
                />
              </div>
            </SubsectionCard>
          </SectionCard>
        );
      case "experience":
        return (
          <div className="space-y-4">
            <RepeaterSection
              addButtonLabel="Add Work Experience"
              disabled={isReadOnly}
              fields={[
                { key: "companyName", label: "Company Name", placeholder: "Company or employer" },
                { key: "position", label: "Position", placeholder: "Job title" },
                { key: "inclusiveDates", label: "Inclusive Dates", placeholder: "Jan 2022 - Mar 2024" },
                { key: "monthlySalary", label: "Monthly Salary", placeholder: "Monthly salary" },
                { key: "appointmentStatus", label: "Status of Appointment", placeholder: "Permanent, Casual, etc." },
                { key: "yearsOfExperience", label: "Years of Experience", placeholder: "Years" },
              ]}
              items={formData.workExperiences}
              onAdd={() => addRepeaterItem("workExperiences", emptyWorkExperienceItem)}
              onChange={(index, key, value) =>
                updateRepeaterItem<WorkExperienceItem>("workExperiences", index, key, value)
              }
              onRemove={(index) => removeRepeaterItem("workExperiences", index, emptyWorkExperienceItem)}
              title="Work Experience"
            />

            <RepeaterSection
              addButtonLabel="Add Training"
              disabled={isReadOnly}
              fields={[
                { key: "title", label: "Title", placeholder: "Training or seminar title" },
                { key: "venue", label: "Venue", placeholder: "Venue" },
                { key: "inclusiveDates", label: "Inclusive Dates", placeholder: "Inclusive dates" },
                { key: "hours", label: "No. of Hours", placeholder: "Hours" },
                { key: "conductedBy", label: "Conducted By", placeholder: "Organizer or institution" },
              ]}
              items={formData.trainings}
              onAdd={() => addRepeaterItem("trainings", emptyTrainingItem)}
              onChange={(index, key, value) => updateRepeaterItem<TrainingItem>("trainings", index, key, value)}
              onRemove={(index) => removeRepeaterItem("trainings", index, emptyTrainingItem)}
              title="Other Training / Seminars Attended"
            />
          </div>
        );
      case "credentials":
        return (
          <div className="space-y-4">
            <RepeaterSection
              addButtonLabel="Add Licensure Exam"
              disabled={isReadOnly}
              fields={[
                { key: "title", label: "Title", placeholder: "Licensure exam title" },
                { key: "yearTaken", label: "Year Taken", placeholder: "Year taken" },
                { key: "examinationVenue", label: "Examination Venue", placeholder: "Venue" },
                { key: "rating", label: "Rating", placeholder: "Rating" },
                { key: "remarks", label: "Remarks", placeholder: "Remarks" },
                { key: "expiryDate", label: "Expiry Date", type: "date" },
              ]}
              items={formData.licensureExams}
              onAdd={() => addRepeaterItem("licensureExams", emptyLicensureExamItem)}
              onChange={(index, key, value) =>
                updateRepeaterItem<LicensureExamItem>("licensureExams", index, key, value)
              }
              onRemove={(index) => removeRepeaterItem("licensureExams", index, emptyLicensureExamItem)}
              title="Licensure Examination(s) Passed"
            />

            <RepeaterSection
              addButtonLabel="Add Competency Assessment"
              disabled={isReadOnly}
              fields={[
                { key: "title", label: "Title", placeholder: "Assessment title" },
                { key: "qualificationLevel", label: "Qualification Level", placeholder: "Qualification level" },
                { key: "industrySector", label: "Industry Sector", placeholder: "Industry sector" },
                { key: "certificateNumber", label: "Certificate Number", placeholder: "Certificate number" },
                { key: "dateOfIssuance", label: "Date of Issuance", type: "date" },
                { key: "expirationDate", label: "Expiration Date", type: "date" },
              ]}
              items={formData.competencyAssessments}
              onAdd={() => addRepeaterItem("competencyAssessments", emptyCompetencyAssessmentItem)}
              onChange={(index, key, value) =>
                updateRepeaterItem<CompetencyAssessmentItem>("competencyAssessments", index, key, value)
              }
              onRemove={(index) => removeRepeaterItem("competencyAssessments", index, emptyCompetencyAssessmentItem)}
              title="Competency Assessment(s) Passed"
            />
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <SectionCard
              description="Fields are temporarily optional so you can test the generated PDF faster. Fill only what you need for the current check."
              title="Review And Submit"
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ReviewPanel
                  rows={[
                    ["Application Date", formatReviewValue(formData.applicationDate)],
                    ["Assessment Applied For", formatReviewValue(formData.qualificationTitle)],
                    ["School / Training Center / Company", formatReviewValue(formData.schoolName || room?.name || "")],
                    ["Address", formatReviewValue(formData.schoolAddress)],
                    ["Assessment Type", formatReviewValue(formData.assessmentType, "Not selected")],
                    ["Client Type", formatReviewValue(formData.clientType, "Not selected")],
                  ]}
                  title="Application Details"
                />
                <ReviewPanel
                  rows={[
                    ["Surname", formatReviewValue(formData.surname)],
                    ["First Name", formatReviewValue(formData.firstName)],
                    ["Middle Name", formatReviewValue(formData.middleName)],
                    ["Middle Initial", formatReviewValue(formData.middleInitial)],
                    ["Name Extension", formatReviewValue(formData.nameExtension)],
                    ["Birth Date", formatReviewValue(formData.dateOfBirth)],
                    ["Birth Place", formatReviewValue(formData.birthPlace)],
                    ["Age", formatReviewValue(calculateAge(formData.dateOfBirth))],
                  ]}
                  title="Identity Details"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ReviewPanel
                  rows={[
                    ["Number / Street", formatReviewValue(formData.mailingAddress.numberStreet)],
                    ["Barangay", formatReviewValue(formData.mailingAddress.barangay)],
                    ["District", formatReviewValue(formData.mailingAddress.district)],
                    ["City", formatReviewValue(formData.mailingAddress.city)],
                    ["Province", formatReviewValue(formData.mailingAddress.province)],
                    ["Region", formatReviewValue(formData.mailingAddress.region)],
                    ["Zip Code", formatReviewValue(formData.mailingAddress.zipCode)],
                  ]}
                  title="Mailing Address"
                />
                <ReviewPanel
                  rows={[
                    ["Email", formatReviewValue(formData.emailAddress || applicantEmail)],
                    ["Mobile Number", formatReviewValue(formData.mobileNumber)],
                    ["Home Telephone", formatReviewValue(formData.homeTelephone)],
                    ["Fax Number", formatReviewValue(formData.faxNumber)],
                    ["Other Contact Number(s)", formatReviewValue(formData.contactNumbers)],
                    ["Sex", formatReviewValue(formData.sex, "Not selected")],
                    ["Civil Status", formatReviewValue(formData.civilStatus, "Not selected")],
                  ]}
                  title="Contact Details"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ReviewPanel
                  rows={[
                    ["Highest Educational Attainment", formatReviewValue(formData.educationalAttainment, "Not selected")],
                    ["Employment Status", formatReviewValue(formData.employmentStatus, "Not selected")],
                    ["Other Employment Status", formatReviewValue(formData.otherEmploymentStatus)],
                  ]}
                  title="Profile Details"
                />
                <ReviewPanel
                  rows={[
                    ["Work Entries", String(countFilledEntries(formData.workExperiences))],
                    ["Training Entries", String(countFilledEntries(formData.trainings))],
                    ["Licensure Entries", String(countFilledEntries(formData.licensureExams))],
                    ["Competency Entries", String(countFilledEntries(formData.competencyAssessments))],
                  ]}
                  title="PDF Coverage"
                />
              </div>

              <ReviewListPanel
                emptyLabel="No work experience entries added yet."
                items={buildWorkExperienceReviewItems(formData.workExperiences)}
                title="Work Experience"
              />
              <ReviewListPanel
                emptyLabel="No training or seminar entries added yet."
                items={buildTrainingReviewItems(formData.trainings)}
                title="Other Training / Seminars Attended"
              />
              <ReviewListPanel
                emptyLabel="No licensure examination entries added yet."
                items={buildLicensureReviewItems(formData.licensureExams)}
                title="Licensure Examination(s) Passed"
              />
              <ReviewListPanel
                emptyLabel="No competency assessment entries added yet."
                items={buildCompetencyReviewItems(formData.competencyAssessments)}
                title="Competency Assessment(s) Passed"
              />
            </SectionCard>
          </div>
        );
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-6 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-3">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9d7f5] bg-white px-3.5 py-2 text-[12px] font-bold text-[#002576] shadow-sm transition hover:bg-[#f8fbff]"
            href={mode === "individual" ? "/applicant/applications" : "/applicant/room"}
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
            Back
          </Link>
        </div>

        {successMessage ? (
          <div className="mb-4 rounded-[18px] border border-[#bfe3cc] bg-[#edf9f1] px-4 py-3 text-[14px] text-[#215c36]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-[18px] border border-[#f3d6d6] bg-[#fff4f4] px-4 py-3 text-[14px] text-[#93000a]">
            {errorMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[18px] border border-[#d7e3fb] bg-white px-3.5 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {formSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;

                return (
                  <button
                    key={step.id}
                    aria-label={`Go to ${step.title}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-[13px] font-bold transition ${
                      isActive
                        ? "border-[#002576] bg-[#002576] text-white shadow-sm"
                        : isComplete
                          ? "border-[#9dbaf3] bg-[#e7f0ff] text-[#093cab] hover:bg-[#dbe8ff]"
                          : "border-[#d1dbef] bg-white text-[#5f6b85] hover:border-[#a8bde8] hover:bg-[#f8fbff]"
                    }`}
                    onClick={() => jumpToStep(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {renderCurrentStep()}

          <div className="rounded-[22px] border border-[#d9e3f7] bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-[13px] leading-[1.7] text-[#44506a]">
                  {isLastStep
                    ? "Use submit on this last step to update the saved PDF. Empty fields are allowed for now while you test."
                    : "Move through the form one part at a time. You can reopen submitted forms later, edit the original data, and resubmit."}
                </p>
                {savedSubmissionId ? (
                  <p className="text-[12px] leading-[1.55] text-[#4563a5]">
                    This submission also appears on your submitted forms page for repeat PDF checks.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  className="inline-flex min-h-[44px] min-w-[132px] items-center justify-center rounded-xl border border-[#c4d1eb] bg-white px-4 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isFirstStep}
                  onClick={goToPreviousStep}
                  type="button"
                >
                  Back
                </button>

                {!isLastStep ? (
                  <button
                    className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-xl bg-[#002576] px-5 text-[14px] font-bold text-white shadow-md transition hover:bg-[#0038a8]"
                    onClick={goToNextStep}
                    type="button"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    className="inline-flex min-h-[44px] min-w-[132px] items-center justify-center rounded-xl bg-[#002576] px-4 text-[14px] font-bold text-white shadow-md transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:bg-[#9aa6c7]"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 border-t border-[#e4ebfb] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <Link className="text-[12px] font-bold text-[#002576] hover:underline" href="/applicant/submitted-forms">
                View submitted forms
              </Link>
              <p className="text-[12px] text-[#6b7892]">
                Step {currentStep + 1} of {formSteps.length}
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title?: string;
}) {
  return (
    <section className="rounded-[22px] border border-[#d9e3f7] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      {title || description ? (
        <div className="mb-4 border-b border-[#edf2fd] pb-4">
          {title ? <h2 className="text-[24px] font-bold leading-[1.2] text-[#002576]">{title}</h2> : null}
          {description ? <p className="mt-1.5 max-w-3xl text-[14px] leading-[1.6] text-[#556079]">{description}</p> : null}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubsectionCard({
  children,
}: {
  children: ReactNode;
  description?: string;
  title?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3.5 sm:px-4 sm:py-4">
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

function TextField({
  disabled = false,
  label,
  onChange,
  placeholder,
  type = "text",
  uppercase = true,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  uppercase?: boolean;
  value: string;
}) {
  const shouldUppercase = uppercase && type !== "date";
  const displayValue = shouldUppercase ? value.toUpperCase() : value;

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.04em] text-[#4c5e7a]">{label}</span>
      <input
        className={`min-h-[44px] w-full rounded-xl border border-[#c8d5ee] bg-white px-3.5 py-2.5 text-[14px] text-[#0b1c30] outline-none transition placeholder:text-[#94a0b5] focus:border-[#002576] focus:bg-[#fbfdff] focus:ring-2 focus:ring-[#3056c4]/15 disabled:cursor-not-allowed disabled:bg-[#eef3ff] disabled:text-[#63718b] ${
          shouldUppercase ? "uppercase" : ""
        }`}
        disabled={disabled}
        onChange={(event) => onChange(shouldUppercase ? event.target.value.toUpperCase() : event.target.value)}
        placeholder={placeholder}
        type={type}
        value={displayValue}
      />
    </label>
  );
}

function OptionGroup({
  columnsClassName = "grid-cols-1 sm:grid-cols-2",
  disabled = false,
  label,
  onChange,
  options,
  value,
}: {
  columnsClassName?: string;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-[#4c5e7a]">{label}</p>
      <div className={`grid gap-2 ${columnsClassName}`}>
        {options.map((option) => {
          const isActive = value === option;

          return (
            <button
              key={option}
              className={`inline-flex min-h-[40px] items-center justify-center rounded-xl border px-3.5 py-2 text-center text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#002576] bg-[#002576] text-white"
                  : "border-[#c8d5ee] bg-white text-[#24364c] hover:border-[#8ea8e6] hover:bg-[#f8fbff]"
              } disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={disabled}
              onClick={() => onChange(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RepeaterSection<T extends { [key: string]: string }>({
  addButtonLabel,
  disabled = false,
  fields,
  items,
  onAdd,
  onChange,
  onRemove,
  title,
}: RepeaterSectionProps<T>) {
  return (
    <SectionCard
      description="Add as many rows as you need. Leaving sections blank is okay while you test the generated PDF."
      title={title}
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-[18px] border border-[#e3ebfb] bg-[#fbfdff] p-3.5 sm:p-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Entry {index + 1}</p>
              <button
                className="inline-flex min-h-[36px] items-center rounded-lg border border-[#e4bcbc] bg-white px-3 text-[12px] font-bold text-[#b24c4c] transition hover:bg-[#fff4f4]"
                disabled={disabled}
                onClick={() => onRemove(index)}
                type="button"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {fields.map((field) => (
                <TextField
                  disabled={disabled}
                  key={`${title}-${String(field.key)}-${index}`}
                  label={field.label}
                  onChange={(value) => onChange(index, field.key, value)}
                  placeholder={field.placeholder}
                  type={field.type ?? "text"}
                  value={item[field.key] ?? ""}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="inline-flex min-h-[40px] items-center rounded-xl border border-[#002576] px-4 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
        disabled={disabled}
        onClick={onAdd}
        type="button"
      >
        {addButtonLabel}
      </button>
    </SectionCard>
  );
}

function ReviewPanel({ rows, title }: { rows: [string, string][]; title: string }) {
  return (
    <div className="rounded-[18px] border border-[#d9e3f7] bg-white px-4 py-3.5">
      <p className="text-[14px] font-bold text-[#002576]">{title}</p>
      <div className="mt-2.5 space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 border-b border-[#edf2fd] pb-2.5 last:border-b-0 last:pb-0">
            <span className="text-[12px] font-semibold text-[#5d6b84]">{label}</span>
            <span className="text-right text-[13px] font-medium text-[#0b1c30]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewListPanel({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#d9e3f7] bg-white px-4 py-3.5">
      <p className="text-[14px] font-bold text-[#002576]">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2.5 text-[13px] text-[#5d6b84]">{emptyLabel}</p>
      ) : (
        <div className="mt-2.5 space-y-2.5">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-[14px] border border-[#edf2fd] bg-[#fbfdff] px-3 py-2.5">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Entry {index + 1}</p>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#0b1c30]">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function countFilledEntries(items: Array<Record<string, string>>) {
  return items.filter((item) => Object.values(item).some((value) => value.trim().length > 0)).length;
}

function formatReviewValue(value: string, fallback = "Not provided yet") {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function hasFilledFields(item: Record<string, string>) {
  return Object.values(item).some((value) => value.trim().length > 0);
}

function joinReviewParts(parts: Array<string | false>) {
  return parts.filter(Boolean).join(" | ");
}

function buildWorkExperienceReviewItems(items: WorkExperienceItem[]) {
  return items
    .filter((item) => hasFilledFields(item))
    .map((item) =>
      joinReviewParts([
        item.companyName && `Company: ${item.companyName}`,
        item.position && `Position: ${item.position}`,
        item.inclusiveDates && `Dates: ${item.inclusiveDates}`,
        item.monthlySalary && `Salary: ${item.monthlySalary}`,
        item.appointmentStatus && `Status: ${item.appointmentStatus}`,
        item.yearsOfExperience && `Years: ${item.yearsOfExperience}`,
      ]),
    );
}

function buildTrainingReviewItems(items: TrainingItem[]) {
  return items
    .filter((item) => hasFilledFields(item))
    .map((item) =>
      joinReviewParts([
        item.title && `Title: ${item.title}`,
        item.venue && `Venue: ${item.venue}`,
        item.inclusiveDates && `Dates: ${item.inclusiveDates}`,
        item.hours && `Hours: ${item.hours}`,
        item.conductedBy && `Conducted By: ${item.conductedBy}`,
      ]),
    );
}

function buildLicensureReviewItems(items: LicensureExamItem[]) {
  return items
    .filter((item) => hasFilledFields(item))
    .map((item) =>
      joinReviewParts([
        item.title && `Title: ${item.title}`,
        item.yearTaken && `Year Taken: ${item.yearTaken}`,
        item.examinationVenue && `Venue: ${item.examinationVenue}`,
        item.rating && `Rating: ${item.rating}`,
        item.remarks && `Remarks: ${item.remarks}`,
        item.expiryDate && `Expiry Date: ${item.expiryDate}`,
      ]),
    );
}

function buildCompetencyReviewItems(items: CompetencyAssessmentItem[]) {
  return items
    .filter((item) => hasFilledFields(item))
    .map((item) =>
      joinReviewParts([
        item.title && `Title: ${item.title}`,
        item.qualificationLevel && `Qualification Level: ${item.qualificationLevel}`,
        item.industrySector && `Industry Sector: ${item.industrySector}`,
        item.certificateNumber && `Certificate Number: ${item.certificateNumber}`,
        item.dateOfIssuance && `Issued: ${item.dateOfIssuance}`,
        item.expirationDate && `Expires: ${item.expirationDate}`,
      ]),
    );
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return "";
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

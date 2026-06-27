export const assessmentTypeOptions = ["Full Qualification", "COC", "Renewal"] as const;

export const qualificationOptions = [
  "Computer Systems Servicing NC II",
  "Cookery NC II",
  "Automotive Servicing NC I",
  "Health Care Services NC II",
  "Visual Graphic Design NC III",
] as const;

export const clientTypeOptions = [
  "TVET Graduating Student",
  "TVET Graduate",
  "Industry Worker",
  "K-12",
  "OFW",
] as const;

export const sexOptions = ["Male", "Female"] as const;
export const civilStatusOptions = ["Single", "Married", "Widowed", "Separated"] as const;

export const educationalAttainmentOptions = [
  "Elementary Graduate",
  "High School Graduate",
  "TVET Graduate",
  "College Level",
  "College Graduate",
] as const;

export const employmentStatusOptions = [
  "Casual",
  "Job Order",
  "Probationary",
  "Permanent",
  "Self-Employed",
  "OFW",
  "Others",
] as const;

export const MAX_REPEATABLE_ENTRIES = 3;

export type ApplicationSubmissionSource = "individual" | "room";
export type ApplicationSubmissionStatus =
  | "draft"
  | "submitted_to_teacher"
  | "submitted_to_admin"
  | "needs_applicant_update"
  | "assigned"
  | "under_review"
  | "for_result_encoding"
  | "passed"
  | "not_passed"
  | "completed"
  | "rejected"
  | "cancelled"
  | "withdrawn";

export type WorkExperienceItem = {
  companyName: string;
  position: string;
  inclusiveDates: string;
  monthlySalary: string;
  appointmentStatus: string;
  yearsOfExperience: string;
};

export type TrainingItem = {
  title: string;
  venue: string;
  inclusiveDates: string;
  hours: string;
  conductedBy: string;
};

export type LicensureExamItem = {
  title: string;
  yearTaken: string;
  examinationVenue: string;
  rating: string;
  remarks: string;
  expiryDate: string;
};

export type CompetencyAssessmentItem = {
  title: string;
  qualificationLevel: string;
  industrySector: string;
  certificateNumber: string;
  dateOfIssuance: string;
  expirationDate: string;
};

export type SagAnswerValue = "" | "no" | "yes";

export type ApplicantApplicationFormData = {
  applicationDate: string;
  applicantSignatureName: string;
  assessmentType: string;
  civilStatus: string;
  clientType: string;
  contactNumbers: string;
  dateOfBirth: string;
  educationalAttainment: string;
  emailAddress: string;
  employmentStatus: string;
  faxNumber: string;
  firstName: string;
  homeTelephone: string;
  mailingAddress: {
    barangay: string;
    city: string;
    district: string;
    numberStreet: string;
    province: string;
    region: string;
    zipCode: string;
  };
  middleInitial: string;
  middleName: string;
  mobileNumber: string;
  nameExtension: string;
  otherEmploymentStatus: string;
  qualificationTitle: string;
  schoolAddress: string;
  schoolName: string;
  sex: string;
  surname: string;
  trainings: TrainingItem[];
  workExperiences: WorkExperienceItem[];
  licensureExams: LicensureExamItem[];
  competencyAssessments: CompetencyAssessmentItem[];
  birthPlace: string;
  sagAnswers: Record<string, SagAnswerValue>;
};

export type ApplicationSubmissionRecord = {
  id: string;
  applicant_email: string;
  applicant_id: string;
  applicant_name: string;
  contact_number: string | null;
  created_at: string;
  form_data: ApplicantApplicationFormData;
  qualification_title: string;
  qualification_type: string;
  latest_status_reason?: string | null;
  latest_status_updated_at?: string | null;
  room_id: string | null;
  submission_source: ApplicationSubmissionSource;
  submitted_at: string;
  teacher_forwarded_at: string | null;
  updated_at: string;
  workflow_status: ApplicationSubmissionStatus;
};

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

export function createEmptyApplicationFormData(): ApplicantApplicationFormData {
  return {
    applicationDate: "",
    applicantSignatureName: "",
    assessmentType: "",
    civilStatus: "",
    clientType: "",
    contactNumbers: "",
    dateOfBirth: "",
    educationalAttainment: "",
    emailAddress: "",
    employmentStatus: "",
    faxNumber: "",
    firstName: "",
    homeTelephone: "",
    mailingAddress: {
      barangay: "",
      city: "",
      district: "",
      numberStreet: "",
      province: "",
      region: "",
      zipCode: "",
    },
    middleInitial: "",
    middleName: "",
    mobileNumber: "",
    nameExtension: "",
    otherEmploymentStatus: "",
    qualificationTitle: "",
    schoolAddress: "",
    schoolName: "",
    sex: "",
    surname: "",
    trainings: [emptyTrainingItem()],
    workExperiences: [emptyWorkExperienceItem()],
    licensureExams: [emptyLicensureExamItem()],
    competencyAssessments: [emptyCompetencyAssessmentItem()],
    birthPlace: "",
    sagAnswers: {},
  };
}

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray<T>(
  value: unknown,
  createEmptyItem: () => T,
  normalizeItem: (item: Record<string, unknown>) => T,
) {
  if (!Array.isArray(value)) {
    return [createEmptyItem()];
  }

  const normalized = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => normalizeItem(item))
    .filter((item) => Object.values(item as Record<string, string>).some(Boolean));

  const capped = normalized.slice(0, MAX_REPEATABLE_ENTRIES);

  return capped.length > 0 ? capped : [createEmptyItem()];
}

export function normalizeApplicationFormData(value: unknown): ApplicantApplicationFormData {
  const fallback = createEmptyApplicationFormData();

  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const mailingAddress =
    typeof record.mailingAddress === "object" && record.mailingAddress !== null
      ? (record.mailingAddress as Record<string, unknown>)
      : {};
  const sagAnswers =
    typeof record.sagAnswers === "object" && record.sagAnswers !== null && !Array.isArray(record.sagAnswers)
      ? (record.sagAnswers as Record<string, unknown>)
      : {};

  return {
    applicationDate: sanitizeString(record.applicationDate),
    applicantSignatureName: sanitizeString(record.applicantSignatureName),
    assessmentType: sanitizeString(record.assessmentType),
    civilStatus: sanitizeString(record.civilStatus),
    clientType: sanitizeString(record.clientType),
    contactNumbers: sanitizeString(record.contactNumbers),
    dateOfBirth: sanitizeString(record.dateOfBirth),
    educationalAttainment: sanitizeString(record.educationalAttainment),
    emailAddress: sanitizeString(record.emailAddress),
    employmentStatus: sanitizeString(record.employmentStatus),
    faxNumber: sanitizeString(record.faxNumber),
    firstName: sanitizeString(record.firstName),
    homeTelephone: sanitizeString(record.homeTelephone),
    mailingAddress: {
      barangay: sanitizeString(mailingAddress.barangay),
      city: sanitizeString(mailingAddress.city),
      district: sanitizeString(mailingAddress.district),
      numberStreet: sanitizeString(mailingAddress.numberStreet),
      province: sanitizeString(mailingAddress.province),
      region: sanitizeString(mailingAddress.region),
      zipCode: sanitizeString(mailingAddress.zipCode),
    },
    middleInitial: sanitizeString(record.middleInitial),
    middleName: sanitizeString(record.middleName),
    mobileNumber: sanitizeString(record.mobileNumber),
    nameExtension: sanitizeString(record.nameExtension),
    otherEmploymentStatus: sanitizeString(record.otherEmploymentStatus),
    qualificationTitle: sanitizeString(record.qualificationTitle),
    schoolAddress: sanitizeString(record.schoolAddress),
    schoolName: sanitizeString(record.schoolName),
    sex: sanitizeString(record.sex),
    surname: sanitizeString(record.surname),
    trainings: normalizeArray(record.trainings, emptyTrainingItem, (item) => ({
      title: sanitizeString(item.title),
      venue: sanitizeString(item.venue),
      inclusiveDates: sanitizeString(item.inclusiveDates),
      hours: sanitizeString(item.hours),
      conductedBy: sanitizeString(item.conductedBy),
    })),
    workExperiences: normalizeArray(record.workExperiences, emptyWorkExperienceItem, (item) => ({
      companyName: sanitizeString(item.companyName),
      position: sanitizeString(item.position),
      inclusiveDates: sanitizeString(item.inclusiveDates),
      monthlySalary: sanitizeString(item.monthlySalary),
      appointmentStatus: sanitizeString(item.appointmentStatus),
      yearsOfExperience: sanitizeString(item.yearsOfExperience),
    })),
    licensureExams: normalizeArray(record.licensureExams, emptyLicensureExamItem, (item) => ({
      title: sanitizeString(item.title),
      yearTaken: sanitizeString(item.yearTaken),
      examinationVenue: sanitizeString(item.examinationVenue),
      rating: sanitizeString(item.rating),
      remarks: sanitizeString(item.remarks),
      expiryDate: sanitizeString(item.expiryDate),
    })),
    competencyAssessments: normalizeArray(
      record.competencyAssessments,
      emptyCompetencyAssessmentItem,
      (item) => ({
        title: sanitizeString(item.title),
        qualificationLevel: sanitizeString(item.qualificationLevel),
        industrySector: sanitizeString(item.industrySector),
        certificateNumber: sanitizeString(item.certificateNumber),
        dateOfIssuance: sanitizeString(item.dateOfIssuance),
        expirationDate: sanitizeString(item.expirationDate),
      }),
    ),
    birthPlace: sanitizeString(record.birthPlace),
    sagAnswers: Object.fromEntries(
      Object.entries(sagAnswers)
        .filter((entry): entry is [string, SagAnswerValue] => entry[1] === "yes" || entry[1] === "no")
        .map(([key, value]) => [sanitizeString(key), value]),
    ),
  };
}

export function buildApplicantName(formData: ApplicantApplicationFormData) {
  return [
    formData.firstName,
    formData.middleInitial ? `${formData.middleInitial}.` : "",
    formData.surname,
    formData.nameExtension,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPrimaryContactNumber(formData: ApplicantApplicationFormData) {
  return formData.contactNumbers || formData.mobileNumber || formData.homeTelephone || "";
}

export function getApplicationSubmissionStatusLabel(status: ApplicationSubmissionStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted_to_teacher":
      return "Submitted to Teacher";
    case "submitted_to_admin":
      return "Submitted to TESDA";
    case "needs_applicant_update":
      return "Needs Applicant Update";
    case "assigned":
      return "Assigned to Assessment Center";
    case "under_review":
      return "Under Review at Assessment Center";
    case "for_result_encoding":
      return "Ready for Result Encoding";
    case "passed":
      return "Competent";
    case "not_passed":
      return "Not Competent";
    case "completed":
      return "COC";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "withdrawn":
      return "Withdrawn";
    default:
      return status;
  }
}

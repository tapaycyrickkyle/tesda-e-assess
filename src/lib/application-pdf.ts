import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  drawCheckMark,
  PDFCheckBox,
  PDFDocument,
  PDFName,
  PDFTextField,
  PDFWidgetAnnotation,
  StandardFonts,
  TextAlignment,
  popGraphicsState,
  pushGraphicsState,
  rotateInPlace,
  rgb,
  type PDFFont,
  type PDFForm,
  type PDFPage,
} from "pdf-lib";
import {
  educationalAttainmentOptions,
  buildApplicantName,
  normalizeApplicationFormData,
  type ApplicantApplicationFormData,
  type ApplicationSubmissionSource,
  type ApplicationSubmissionStatus,
  type CompetencyAssessmentItem,
  type LicensureExamItem,
  type TrainingItem,
  type WorkExperienceItem,
} from "@/lib/application-form";

type GenerateApplicationPdfOptions = {
  applicantEmail: string;
  roomName?: string | null;
  submissionSource: ApplicationSubmissionSource;
  workflowStatus: ApplicationSubmissionStatus;
};

type DrawTextBoxOptions = {
  color?: ReturnType<typeof rgb>;
  font: PDFFont;
  lineHeight?: number;
  maxLines?: number;
  minSize?: number;
  page: PDFPage;
  size?: number;
  text: string;
  width: number;
  x: number;
  y: number;
};

const FILLABLE_TEMPLATE_PATH = path.join(process.cwd(), "public", "forms", "fillable-application-form.pdf");
const INK = rgb(0.07, 0.11, 0.24);
const MUTED = rgb(0.31, 0.38, 0.52);
const PDF_FIELD_FONT_SIZE = 8;
const CHECKBOX_MARK_SCALE = 0.54;
const CHECKBOX_MARK_THICKNESS = 1.7;

function formatDisplayDate(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function calculateAge(value: string) {
  if (!value) {
    return "";
  }

  const birthDate = new Date(value);

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

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(font: PDFFont, text: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let candidate = text;

  while (candidate.length > 1 && font.widthOfTextAtSize(`${candidate}...`, size) > maxWidth) {
    candidate = candidate.slice(0, -1).trimEnd();
  }

  return `${candidate}...`;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const normalized = cleanValue(text);

  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    lines.push(truncateText(font, word, size, maxWidth));
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawTextBox({
  color = INK,
  font,
  lineHeight,
  maxLines = 1,
  minSize = 6,
  page,
  size = 9,
  text,
  width,
  x,
  y,
}: DrawTextBoxOptions) {
  const normalized = cleanValue(text);

  if (!normalized) {
    return;
  }

  let fontSize = size;
  let lines = wrapText(font, normalized, fontSize, width);

  while (fontSize > minSize && lines.length > maxLines) {
    fontSize -= 0.5;
    lines = wrapText(font, normalized, fontSize, width);
  }

  const visibleLines = lines.slice(0, maxLines).map((line, index) => {
    if (index !== maxLines - 1 || lines.length <= maxLines) {
      return line;
    }

    return truncateText(font, line, fontSize, width);
  });

  const computedLineHeight = lineHeight ?? fontSize + 2;

  visibleLines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * computedLineHeight,
      size: fontSize,
      font,
      color,
    });
  });
}

function hasValue(value: string) {
  return cleanValue(value).length > 0;
}

function hasWorkExperience(item: WorkExperienceItem) {
  return Object.values(item).some(hasValue);
}

function hasTraining(item: TrainingItem) {
  return Object.values(item).some(hasValue);
}

function hasLicensure(item: LicensureExamItem) {
  return Object.values(item).some(hasValue);
}

function hasCompetency(item: CompetencyAssessmentItem) {
  return Object.values(item).some(hasValue);
}

function buildWorkExperienceSummary(item: WorkExperienceItem) {
  return [
    item.companyName && `Company: ${item.companyName}`,
    item.position && `Position: ${item.position}`,
    item.inclusiveDates && `Dates: ${item.inclusiveDates}`,
    item.monthlySalary && `Salary: ${item.monthlySalary}`,
    item.appointmentStatus && `Status: ${item.appointmentStatus}`,
    item.yearsOfExperience && `Years: ${item.yearsOfExperience}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildTrainingSummary(item: TrainingItem) {
  return [
    item.title && `Title: ${item.title}`,
    item.venue && `Venue: ${item.venue}`,
    item.inclusiveDates && `Dates: ${item.inclusiveDates}`,
    item.hours && `Hours: ${item.hours}`,
    item.conductedBy && `By: ${item.conductedBy}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildLicensureSummary(item: LicensureExamItem) {
  return [
    item.title && `Title: ${item.title}`,
    item.yearTaken && `Year: ${item.yearTaken}`,
    item.examinationVenue && `Venue: ${item.examinationVenue}`,
    item.rating && `Rating: ${item.rating}`,
    item.remarks && `Remarks: ${item.remarks}`,
    item.expiryDate && `Expiry: ${formatDisplayDate(item.expiryDate)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildCompetencySummary(item: CompetencyAssessmentItem) {
  return [
    item.title && `Title: ${item.title}`,
    item.qualificationLevel && `Level: ${item.qualificationLevel}`,
    item.industrySector && `Sector: ${item.industrySector}`,
    item.certificateNumber && `Certificate: ${item.certificateNumber}`,
    item.dateOfIssuance && `Issued: ${formatDisplayDate(item.dateOfIssuance)}`,
    item.expirationDate && `Expires: ${formatDisplayDate(item.expirationDate)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatApplicantFileName(name: string) {
  const normalized = cleanValue(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized || "application-form";
}

function drawFooter(page: PDFPage, font: PDFFont, pageNumber: number, pageCount: number, source: ApplicationSubmissionSource) {
  page.drawText(
    `Generated by TESDA E-Forms | ${source === "individual" ? "Individual" : "Room"} submission | Page ${pageNumber}/${pageCount}`,
    {
      x: 20,
      y: 16,
      size: 7,
      font,
      color: MUTED,
    },
  );
}

function appendOverflowPage(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  formData: ApplicantApplicationFormData,
  options: GenerateApplicationPdfOptions,
) {
  const sections = [
    {
      title: "Applicant",
      lines: [
        `Name: ${buildApplicantName(formData) || "N/A"}`,
        `Email: ${formData.emailAddress || options.applicantEmail || "N/A"}`,
        `Route: ${options.submissionSource === "individual" ? "Individual to Admin" : `Room via ${options.roomName || "Teacher"}`}`,
        `Workflow Status: ${options.workflowStatus === "submitted_to_admin" ? "Submitted to Admin" : "Submitted to Teacher"}`,
      ],
    },
    {
      title: "Work Experience",
      lines: formData.workExperiences.filter(hasWorkExperience).map(buildWorkExperienceSummary),
    },
    {
      title: "Training / Seminars",
      lines: formData.trainings.filter(hasTraining).map(buildTrainingSummary),
    },
    {
      title: "Licensure Examinations",
      lines: formData.licensureExams.filter(hasLicensure).map(buildLicensureSummary),
    },
    {
      title: "Competency Assessments",
      lines: formData.competencyAssessments.filter(hasCompetency).map(buildCompetencySummary),
    },
  ].filter((section) => section.lines.length > 0);

  if (sections.length === 0) {
    return;
  }

  const overflowPage = pdfDoc.addPage([595.4, 842]);
  let cursorY = 786;

  overflowPage.drawText("Application Form Additional Details", {
    x: 36,
    y: cursorY,
    size: 18,
    font: boldFont,
    color: INK,
  });
  cursorY -= 24;

  drawTextBox({
    page: overflowPage,
    font,
    color: MUTED,
    text: "This continuation page is generated from the TESDA E-Forms website so every submitted detail is preserved in the downloadable softcopy.",
    width: 520,
    x: 36,
    y: cursorY,
    size: 10,
    maxLines: 3,
  });
  cursorY -= 30;

  sections.forEach((section) => {
    overflowPage.drawText(section.title, {
      x: 36,
      y: cursorY,
      size: 12,
      font: boldFont,
      color: INK,
    });
    cursorY -= 18;

    section.lines.forEach((line) => {
      const wrappedLines = wrapText(font, line, 9, 520);

      wrappedLines.forEach((wrappedLine) => {
        overflowPage.drawText(`- ${wrappedLine}`, {
          x: 44,
          y: cursorY,
          size: 9,
          font,
          color: INK,
        });
        cursorY -= 13;
      });
    });

    cursorY -= 10;
  });
}

export function buildApplicationSubmissionPdfUrl(submissionId: string, options?: { download?: boolean }) {
  const baseUrl = `/api/application-submissions/${submissionId}/pdf`;
  return options?.download ? `${baseUrl}?download=1` : baseUrl;
}

export function buildApplicationPdfFileName(formData: ApplicantApplicationFormData) {
  const applicantName = buildApplicantName(formData);
  return `${formatApplicantFileName(applicantName)}-application-form.pdf`;
}

function configureTextFieldAppearance(field: PDFTextField, alignment = TextAlignment.Left) {
  try {
    field.setAlignment(alignment);
  } catch {
    // Some vendor-provided fields may not fully support alignment updates.
  }

  try {
    field.setFontSize(PDF_FIELD_FONT_SIZE);
  } catch {
    // Some vendor-provided fields may not expose a default appearance stream.
  }
}

function configureAllTextFields(form: PDFForm) {
  form.getFields().forEach((field) => {
    if (field instanceof PDFTextField) {
      configureTextFieldAppearance(field);
    }
  });
}

function setTextField(form: PDFForm, fieldName: string, value: string, alignment = TextAlignment.Left) {
  const normalizedValue = cleanValue(value);

  if (!normalizedValue) {
    return;
  }

  try {
    const field = form.getTextField(fieldName);
    configureTextFieldAppearance(field, alignment);
    field.setText(normalizedValue);
  } catch {
    // Ignore missing or incompatible fields in vendor-provided templates.
  }
}

function getTextFieldRectangle(form: PDFForm, fieldName: string) {
  try {
    const field = form.getTextField(fieldName);
    const widget = field.acroField.getWidgets()[0];
    return widget?.getRectangle();
  } catch {
    return null;
  }
}

function drawCenteredFieldText(
  page: PDFPage,
  rectangle: { height: number; width: number; x: number; y: number } | null,
  text: string,
  font: PDFFont,
  options?: { size?: number; yOffset?: number },
) {
  const normalizedText = cleanValue(text);

  if (!normalizedText || !rectangle) {
    return;
  }

  const fontSize = options?.size ?? PDF_FIELD_FONT_SIZE;
  const textWidth = font.widthOfTextAtSize(normalizedText, fontSize);
  const centeredX = rectangle.x + Math.max((rectangle.width - textWidth) / 2, 0);
  const baselineY = rectangle.y + rectangle.height / 2 - fontSize / 2 + (options?.yOffset ?? 0);

  page.drawText(normalizedText, {
    x: centeredX,
    y: baselineY,
    size: fontSize,
    font,
    color: INK,
  });
}

function setCharacterFields(form: PDFForm, fieldNames: string[], value: string) {
  const characters = cleanValue(value).toUpperCase().slice(0, fieldNames.length).split("");

  fieldNames.forEach((fieldName, index) => {
    const character = characters[index] ?? "";

    try {
      const field = form.getTextField(fieldName);
      configureTextFieldAppearance(field, TextAlignment.Center);
      field.setMaxLength(1);
      field.setText(character);
    } catch {
      // Ignore missing or incompatible fields in vendor-provided templates.
    }
  });
}

function setCheckboxField(form: PDFForm, fieldName: string, checked: boolean) {
  try {
    const checkbox = form.getCheckBox(fieldName);

    if (checked) {
      checkbox.check();
      return;
    }

    checkbox.uncheck();
  } catch {
    // Ignore missing or incompatible checkbox fields in vendor-provided templates.
  }
}

function setCheckboxWidgetStates(form: PDFForm, fieldName: string, widgetStates: boolean[]) {
  try {
    const checkbox = form.getCheckBox(fieldName);
    const widgets = checkbox.acroField.getWidgets();
    const onValue = checkbox.acroField.getOnValue() ?? PDFName.of("Yes");
    const anyChecked = widgetStates.some(Boolean);

    checkbox.acroField.setValue(anyChecked ? onValue : PDFName.of("Off"));

    widgets.forEach((widget, index) => {
      widget.setAppearanceState(widgetStates[index] ? onValue : PDFName.of("Off"));
    });
  } catch {
    // Ignore missing or incompatible checkbox fields in vendor-provided templates.
  }
}

function largeCheckBoxAppearanceProvider(checkBox: PDFCheckBox, widget: PDFWidgetAnnotation) {
  const rectangle = widget.getRectangle();
  const width = rectangle.width;
  const height = rectangle.height;
  const rotate = rotateInPlace({ ...rectangle, rotation: 0 });

  const drawAppearance = (filled: boolean) => {
    if (!filled) {
      return [];
    }

    const markSize = Math.min(width, height) * CHECKBOX_MARK_SCALE;
    const mark = drawCheckMark({
      x: width / 2,
      y: height / 2,
      size: markSize,
      thickness: CHECKBOX_MARK_THICKNESS,
      color: INK,
    });

    return [pushGraphicsState(), ...rotate, ...mark, popGraphicsState()];
  };

  return {
    normal: {
      on: drawAppearance(true),
      off: drawAppearance(false),
    },
    down: {
      on: drawAppearance(true),
      off: drawAppearance(false),
    },
  };
}

function updateCheckboxAppearances(form: PDFForm) {
  form.getFields().forEach((field) => {
    if (field instanceof PDFCheckBox) {
      field.updateAppearances(largeCheckBoxAppearanceProvider);
    }
  });
}

function splitDateParts(value: string) {
  if (!value) {
    return { day: "", month: "", year: "" };
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, "0"),
      month: String(parsed.getMonth() + 1).padStart(2, "0"),
      year: String(parsed.getFullYear()),
    };
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return { day: "", month: "", year: "" };
  }

  return {
    day: match[3] ?? "",
    month: match[2] ?? "",
    year: match[1] ?? "",
  };
}

function buildSequentialFieldNames(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
}

function buildPrintedApplicantName(formData: ApplicantApplicationFormData) {
  const formatted = [
    formData.firstName,
    formData.middleInitial ? `${formData.middleInitial}.` : "",
    formData.surname,
    formData.nameExtension,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanValue(formatted || formData.applicantSignatureName).toUpperCase();
}

function setSplitDateFields(
  form: PDFForm,
  fieldNames: { dayFirst: string; daySecond: string; monthFirst: string; monthSecond: string; yearFirst: string; yearSecond: string },
  value: string,
) {
  const parts = splitDateParts(value);

  setTextField(form, fieldNames.monthFirst, parts.month.slice(0, 1), TextAlignment.Center);
  setTextField(form, fieldNames.monthSecond, parts.month.slice(1, 2), TextAlignment.Center);
  setTextField(form, fieldNames.dayFirst, parts.day.slice(0, 1), TextAlignment.Center);
  setTextField(form, fieldNames.daySecond, parts.day.slice(1, 2), TextAlignment.Center);
  setTextField(form, fieldNames.yearFirst, parts.year.slice(0, 2), TextAlignment.Center);
  setTextField(form, fieldNames.yearSecond, parts.year.slice(2, 4), TextAlignment.Center);
}

async function generateFillableApplicationPdf(
  formData: ApplicantApplicationFormData,
  options: GenerateApplicationPdfOptions,
) {
  const templateBytes = await readFile(FILLABLE_TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const applicantName = buildApplicantName(formData);
  const printedApplicantName = buildPrintedApplicantName(formData);
  const phoneNumber = formData.contactNumbers || formData.mobileNumber || formData.homeTelephone;
  const workExperiences = formData.workExperiences.filter(hasWorkExperience);
  const trainings = formData.trainings.filter(hasTraining);
  const licensureExams = formData.licensureExams.filter(hasLicensure);
  const competencyAssessments = formData.competencyAssessments.filter(hasCompetency);
  const applicantNameFieldRectangle = getTextFieldRectangle(form, "Applicant Name");

  configureAllTextFields(form);

  setTextField(form, "Date of Application", formatDisplayDate(formData.applicationDate));
  setTextField(form, "Name of SchoolTraining CenterCompany", formData.schoolName);
  setTextField(form, "Address", formData.schoolAddress);
  setTextField(form, "Title of Assessment applied for", formData.qualificationTitle);

  setTextField(form, "Name of Applicant", applicantName);
  setTextField(form, "Tel Number", phoneNumber);
  setTextField(form, "Assessment Applied for", formData.qualificationTitle);
  setTextField(form, "Date Issued", formatDisplayDate(formData.applicationDate));

  setCharacterFields(form, buildSequentialFieldNames("Surname Box", 29), formData.surname);
  setCharacterFields(form, buildSequentialFieldNames("Firstname Box", 29), formData.firstName);
  setCharacterFields(form, buildSequentialFieldNames("Middlename Box", 18), formData.middleName);
  setCharacterFields(form, ["Middle initital box1", "Middle initital box2"], formData.middleInitial);
  setCharacterFields(form, ["name extension box1", "name extension box2", "name extension box3"], formData.nameExtension);

  setTextField(form, "Number, Street", formData.mailingAddress.numberStreet);
  setTextField(form, "Barangay", formData.mailingAddress.barangay);
  setTextField(form, "District", formData.mailingAddress.district);
  setTextField(form, "City", formData.mailingAddress.city);
  setTextField(form, "Province", formData.mailingAddress.province);
  setTextField(form, "Region", formData.mailingAddress.region);
  setTextField(form, "Zipcode", formData.mailingAddress.zipCode);

  setTextField(form, "Tel", formData.homeTelephone);
  setTextField(form, "Mobile", formData.mobileNumber);
  setTextField(form, "Email", formData.emailAddress || options.applicantEmail);
  setTextField(form, "Fax", formData.faxNumber);
  setTextField(form, "Others", formData.contactNumbers);
  setTextField(form, "Contact Numbers", formData.contactNumbers);

  setSplitDateFields(
    form,
    {
      dayFirst: "D1",
      daySecond: "D2",
      monthFirst: "M1",
      monthSecond: "M2",
      yearFirst: "Y1",
      yearSecond: "Y2",
    },
    formData.dateOfBirth,
  );

  setTextField(form, "Birth place", formData.birthPlace);
  setTextField(form, "Age", calculateAge(formData.dateOfBirth));

  setCheckboxField(form, "Full Qualification Checkbox", formData.assessmentType === "Full Qualification");
  setCheckboxField(form, "COC Checkbox", formData.assessmentType === "COC");
  setCheckboxField(form, "Renewal Checkbox", formData.assessmentType === "Renewal");
  setCheckboxField(form, "TVET Graduating Student Checkbox", formData.clientType === "TVET Graduating Student");
  setCheckboxField(form, "Industry Worker Checkbox", formData.clientType === "Industry Worker");
  setCheckboxField(form, "K-12 Checkbox", formData.clientType === "K-12");
  setCheckboxField(form, "Male Checkbox", formData.sex === "Male");
  setCheckboxField(form, "Female Checkbox", formData.sex === "Female");
  setCheckboxField(form, "Single Checkbox", formData.civilStatus === "Single");
  setCheckboxField(form, "Married Checkbox", formData.civilStatus === "Married");
  setCheckboxField(form, "Widow Checkbox", formData.civilStatus === "Widowed");
  setCheckboxField(form, "Separated Checkbox", formData.civilStatus === "Separated");
  setCheckboxField(form, "Elementary Graduate Checkbox", formData.educationalAttainment === "Elementary Graduate");
  setCheckboxField(form, "High School Graduate Checkbox", formData.educationalAttainment === "High School Graduate");
  setCheckboxField(form, "TVET graduate Checkbox", formData.clientType === "TVET Graduate");
  setCheckboxField(form, "TVET Graduate Checkbox", formData.educationalAttainment === "TVET Graduate");
  setCheckboxField(form, "College Level Checkbox", formData.educationalAttainment === "College Level");
  setCheckboxField(form, "College Graduate Checkbox", formData.educationalAttainment === "College Graduate");
  setCheckboxField(
    form,
    "Others Checkbox",
    Boolean(formData.educationalAttainment) &&
      !(educationalAttainmentOptions as readonly string[]).includes(formData.educationalAttainment),
  );
  setTextField(
    form,
    "Others Answer",
    Boolean(formData.educationalAttainment) &&
      !(educationalAttainmentOptions as readonly string[]).includes(formData.educationalAttainment)
      ? formData.educationalAttainment
      : "",
  );
  setCheckboxField(form, "Casual Checkbox", formData.employmentStatus === "Casual");
  setCheckboxField(form, "Job Order Checkbox", formData.employmentStatus === "Job Order");
  setCheckboxField(form, "Probationary Checkbox", formData.employmentStatus === "Probationary");
  setCheckboxField(form, "Permanent Checkbox", formData.employmentStatus === "Permanent");
  setCheckboxField(form, "Self-Employed Checkbox", formData.employmentStatus === "Self-Employed");
  setCheckboxWidgetStates(form, "OFW Checkbox", [formData.employmentStatus === "OFW", formData.clientType === "OFW"]);

  workExperiences.slice(0, 3).forEach((item, index) => {
    const rowNumber = index + 1;
    setTextField(form, `Name of CompanyRow${rowNumber}`, item.companyName);
    setTextField(form, `32 PositionRow${rowNumber}`, item.position);
    setTextField(form, `33 Inclusive DatesRow${rowNumber}`, item.inclusiveDates);
    setTextField(form, `34 Monthly SalaryRow${rowNumber}`, item.monthlySalary);
    setTextField(form, `Status of AppointmentRow${rowNumber}`, item.appointmentStatus);
    setTextField(form, `No of Yrs Working ExpRow${rowNumber}`, item.yearsOfExperience);
  });

  trainings.slice(0, 4).forEach((item, index) => {
    const rowNumber = index + 1;
    setTextField(form, `41 TitleRow${rowNumber}`, item.title);
    setTextField(form, `42 VenueRow${rowNumber}`, item.venue);
    setTextField(form, `43 Inclusive DatesRow${rowNumber}`, item.inclusiveDates);
    setTextField(form, `44 No  of HoursRow${rowNumber}`, item.hours);
    setTextField(form, `45 Conducted ByRow${rowNumber}`, item.conductedBy);
  });

  licensureExams.slice(0, 3).forEach((item, index) => {
    const rowNumber = index + 1;
    setTextField(form, `51 TitleRow${rowNumber}`, item.title);
    setTextField(form, `52 Year TakenRow${rowNumber}`, item.yearTaken);
    setTextField(form, `53 Examination VenueRow${rowNumber}`, item.examinationVenue);
    setTextField(form, `54 RatingRow${rowNumber}`, item.rating);
    setTextField(form, `55 RemarksRow${rowNumber}`, item.remarks);
    setTextField(form, `56 Expiry DateRow${rowNumber}`, formatDisplayDate(item.expiryDate));
  });

  competencyAssessments.slice(0, 3).forEach((item, index) => {
    const rowNumber = index + 1;
    setTextField(form, `61 TitleRow${rowNumber}`, item.title);
    setTextField(form, `62 Qualification LevelRow${rowNumber}`, item.qualificationLevel);
    setTextField(form, `63 Industry SectorRow${rowNumber}`, item.industrySector);
    setTextField(form, `64 Certificate NumberRow${rowNumber}`, item.certificateNumber);
    setTextField(form, `65 Date of IssuanceRow${rowNumber}`, formatDisplayDate(item.dateOfIssuance));
    setTextField(form, `66 Expiration DateRow${rowNumber}`, formatDisplayDate(item.expirationDate));
  });

  form.updateFieldAppearances(font);
  updateCheckboxAppearances(form);
  form.flatten();
  drawCenteredFieldText(pdfDoc.getPages()[0], applicantNameFieldRectangle, printedApplicantName, font, {
    size: PDF_FIELD_FONT_SIZE,
    yOffset: -1.5,
  });

  const needsOverflowPage =
    workExperiences.length > 3 || trainings.length > 4 || licensureExams.length > 3 || competencyAssessments.length > 3;

  if (needsOverflowPage) {
    appendOverflowPage(pdfDoc, font, boldFont, formData, options);
  }

  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    drawFooter(page, font, index + 1, pages.length, options.submissionSource);
  });

  const pdfBytes = await pdfDoc.save();

  return {
    fileName: buildApplicationPdfFileName(formData),
    pdfBytes,
  };
}

export async function generateApplicationPdf(rawFormData: unknown, options: GenerateApplicationPdfOptions) {
  const formData = normalizeApplicationFormData(rawFormData);
  return generateFillableApplicationPdf(formData, options);
}

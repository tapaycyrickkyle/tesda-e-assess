import { formatAssessmentDate } from "@/lib/assessment-date";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type MonthlySummaryRow = {
  applicant_name: string;
  assessment_center_id: string;
  assessment_center_name: string;
  assessment_date: string;
  assessor: string;
  qualification_title: string;
  workflow_status: string;
};

type MonthRange = {
  end: string;
  label: string;
  normalizedMonth: string;
  start: string;
};

function escapeXml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getMonthRange(month?: string | null): MonthRange {
  const normalizedInput = month?.trim() ?? "";
  const validMatch = /^\d{4}-\d{2}$/.test(normalizedInput) ? normalizedInput : "";
  const baseDate = validMatch ? new Date(`${validMatch}-01T00:00:00Z`) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    return getMonthRange(null);
  }

  const year = baseDate.getUTCFullYear();
  const monthIndex = baseDate.getUTCMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const normalizedMonth = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(start);

  return {
    end: end.toISOString().slice(0, 10),
    label,
    normalizedMonth,
    start: start.toISOString().slice(0, 10),
  };
}

export async function loadMonthlySummaryRows({
  assessmentCenterId,
  month,
}: {
  assessmentCenterId?: string | null;
  month?: string | null;
}) {
  const range = getMonthRange(month);
  const supabase = createSupabaseAdminClient();
  let assignmentQuery = supabase
    .from("assessment_center_applicants")
    .select("assessment_center_id, applicant_reference, assessment_date, assessor")
    .gte("assessment_date", range.start)
    .lt("assessment_date", range.end)
    .order("assessment_date", { ascending: true });

  if (assessmentCenterId) {
    assignmentQuery = assignmentQuery.eq("assessment_center_id", assessmentCenterId);
  }

  const { data: assignments, error: assignmentsError } = await assignmentQuery;

  if (assignmentsError) {
    throw new Error("Unable to load monthly assessment assignments.");
  }

  const assignmentRows = (assignments ?? []).filter((assignment) => Boolean(assignment.assessment_date));
  const submissionIds = assignmentRows.map((assignment) => assignment.applicant_reference);

  const [{ data: submissions, error: submissionsError }, { data: centers, error: centersError }] = await Promise.all([
    submissionIds.length > 0
      ? supabase
          .from("applicant_application_submissions")
          .select("id, applicant_name, qualification_title, workflow_status")
          .in("id", submissionIds)
      : { data: [], error: null },
    supabase.from("assessment_centers").select("id, name"),
  ]);

  if (submissionsError || centersError) {
    throw new Error("Unable to load monthly assessment summary details.");
  }

  const finalizedSubmissionById = new Map(
    (submissions ?? [])
      .filter((submission) =>
        submission.workflow_status === "passed" ||
        submission.workflow_status === "not_passed" ||
        submission.workflow_status === "completed",
      )
      .map((submission) => [submission.id, submission]),
  );
  const centerNameById = new Map((centers ?? []).map((center) => [center.id, center.name]));

  const rows = assignmentRows
    .map((assignment) => {
      const submission = finalizedSubmissionById.get(assignment.applicant_reference);

      if (!submission) {
        return null;
      }

      return {
        applicant_name: submission.applicant_name,
        assessment_center_id: assignment.assessment_center_id,
        assessment_center_name: centerNameById.get(assignment.assessment_center_id) ?? "Unknown Center",
        assessment_date: assignment.assessment_date,
        assessor: assignment.assessor ?? "Not set",
        qualification_title: submission.qualification_title,
        workflow_status: submission.workflow_status,
      } satisfies MonthlySummaryRow;
    })
    .filter((row): row is MonthlySummaryRow => Boolean(row));

  return {
    monthLabel: range.label,
    normalizedMonth: range.normalizedMonth,
    rows,
  };
}

export function buildMonthlySummaryExcelXml({
  centerName,
  monthLabel,
  rows,
}: {
  centerName?: string | null;
  monthLabel: string;
  rows: MonthlySummaryRow[];
}) {
  const totalsByCenter = rows.reduce(
    (accumulator, row) => {
      accumulator.set(row.assessment_center_name, (accumulator.get(row.assessment_center_name) ?? 0) + 1);
      return accumulator;
    },
    new Map<string, number>(),
  );

  const summaryRows = centerName
    ? [[centerName, String(rows.length)]]
    : Array.from(totalsByCenter.entries()).sort((left, right) => left[0].localeCompare(right[0]));

  const workbookRows = [
    ["Monthly Assessment Summary", centerName ?? "All Assessment Centers"],
    ["Month", monthLabel],
    ["Total Finalized Assessment Results", String(rows.length)],
    [""],
    [centerName ? "Assessment Center" : "Center", "Finalized Results"],
    ...summaryRows,
    [""],
    ["Assessment Date", "Applicant", "Qualification", "Assessor", "Assessment Center", "Status"],
    ...rows.map((row) => [
      formatAssessmentDate(row.assessment_date),
      row.applicant_name,
      row.qualification_title,
      row.assessor,
      row.assessment_center_name,
      row.workflow_status,
    ]),
  ];

  const xmlRows = workbookRows
    .map((row) => {
      const cells = row
        .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell ?? "")}</Data></Cell>`)
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Monthly Summary">
  <Table>${xmlRows}</Table>
 </Worksheet>
</Workbook>`;
}

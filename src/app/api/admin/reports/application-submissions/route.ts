import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import {
  buildMonthlySummaryExcelXml,
  loadMonthlySummaryRows,
} from "@/lib/monthly-summary-reports";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildApplicationSubmissionReportCsv,
  loadApplicationSubmissionReportRows,
} from "@/lib/workflow-history";

export async function GET(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const format = new URL(request.url).searchParams.get("format")?.trim().toLowerCase() ?? "json";
  const month = new URL(request.url).searchParams.get("month");
  const assessmentCenterId = new URL(request.url).searchParams.get("assessmentCenterId")?.trim() ?? "";

  try {
    if (format === "csv") {
      const csv = await buildApplicationSubmissionReportCsv();

      return new Response(csv, {
        headers: {
          "Content-Disposition": 'attachment; filename="application-submissions-report.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
        status: 200,
      });
    }

    if (format === "excel") {
      const { monthLabel, normalizedMonth, rows } = await loadMonthlySummaryRows({
        assessmentCenterId: assessmentCenterId || null,
        month,
      });
      let centerName: string | null = null;

      if (assessmentCenterId) {
        const supabase = createSupabaseAdminClient();
        const { data: center, error: centerError } = await supabase
          .from("assessment_centers")
          .select("name")
          .eq("id", assessmentCenterId)
          .maybeSingle();

        if (centerError) {
          throw new Error("Unable to load the selected assessment center for export.");
        }

        centerName = center?.name ?? null;
      }

      const xml = buildMonthlySummaryExcelXml({
        centerName,
        monthLabel,
        rows,
      });
      const safeCenterName = centerName
        ? centerName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : "";
      const filename = assessmentCenterId
        ? `admin-monthly-summary-${safeCenterName || assessmentCenterId}-${normalizedMonth}.xls`
        : `admin-monthly-summary-${normalizedMonth}.xls`;

      return new Response(xml, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        },
        status: 200,
      });
    }

    const rows = await loadApplicationSubmissionReportRows();
    return NextResponse.json({ rows, success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to build the application submission report right now.",
      },
      { status: 500 },
    );
  }
}

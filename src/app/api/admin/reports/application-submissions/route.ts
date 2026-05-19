import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
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

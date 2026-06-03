import { NextResponse } from "next/server";
import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
} from "@/lib/assessment-centers";
import { getCurrentAppUser } from "@/lib/current-user";
import { buildMonthlySummaryExcelXml, loadMonthlySummaryRows } from "@/lib/monthly-summary-reports";

export async function GET(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "assessment_center") {
    return NextResponse.json({ success: false, message: "Assessment center access is required." }, { status: 403 });
  }

  const centerResult = await resolveAssessmentCenterForUser<{
    center_auth_user_id: string | null;
    center_email: string | null;
    id: string;
    name: string;
  }>(currentUser, "id, name, center_email, center_auth_user_id");

  if (!centerResult.center) {
    return NextResponse.json(
      { success: false, message: getAssessmentCenterLinkMessage(centerResult.status) },
      { status: centerResult.status === "email_conflict" ? 403 : 404 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const month = searchParams.get("month");

  try {
    const { monthLabel, normalizedMonth, rows } = await loadMonthlySummaryRows({
      assessmentCenterId: centerResult.center.id,
      month,
    });
    const xml = buildMonthlySummaryExcelXml({
      centerName: centerResult.center.name,
      monthLabel,
      rows,
    });

    return new Response(xml, {
      headers: {
        "Content-Disposition": `attachment; filename="${centerResult.center.name.replace(/\s+/g, "-").toLowerCase()}-monthly-summary-${normalizedMonth}.xls"`,
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to build the monthly summary report.",
      },
      { status: 500 },
    );
  }
}

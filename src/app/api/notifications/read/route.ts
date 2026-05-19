import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { markNotificationsRead } from "@/lib/workflow-history";

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let notificationIds: string[] | undefined;

  try {
    const body = (await request.json()) as { notificationIds?: unknown };
    notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds.filter((value): value is string => typeof value === "string")
      : undefined;
  } catch {
    notificationIds = undefined;
  }

  try {
    await markNotificationsRead({
      email: currentUser.email,
      notificationIds,
      userId: currentUser.id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update notifications right now." }, { status: 500 });
  }
}

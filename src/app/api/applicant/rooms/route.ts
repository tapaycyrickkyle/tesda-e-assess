import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadApplicantJoinedRooms } from "@/lib/rooms";

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const { memberships, error } = await loadApplicantJoinedRooms(currentUser.accessToken, currentUser.id);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your joined rooms right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    memberships: memberships.map((membership) => ({
      id: membership.id,
      joined_at: membership.joined_at,
      rooms: membership.room,
    })),
  });
}

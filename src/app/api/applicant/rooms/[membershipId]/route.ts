import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "applicant") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const { membershipId } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { data: membership, error: membershipError } = await supabase
    .from("room_members")
    .select("id, room_id, applicant_id")
    .eq("id", membershipId)
    .eq("applicant_id", currentUser.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify the room membership you are trying to leave." },
      { status: 500 },
    );
  }

  if (!membership) {
    return NextResponse.json({ success: false, message: "Room membership not found." }, { status: 404 });
  }

  const { data: existingSubmission, error: submissionError } = await supabase
    .from("applicant_application_submissions")
    .select("id")
    .eq("applicant_id", currentUser.id)
    .eq("room_id", membership.room_id)
    .maybeSingle();

  if (submissionError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify whether you already submitted to this room." },
      { status: 500 },
    );
  }

  if (existingSubmission) {
    return NextResponse.json(
      {
        success: false,
        message: "You already submitted a room application here, so this room can no longer be left.",
      },
      { status: 400 },
    );
  }

  const { error: deleteError } = await supabase
    .from("room_members")
    .delete()
    .eq("id", membership.id)
    .eq("applicant_id", currentUser.id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, message: "Unable to leave this room right now. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    membershipId: membership.id,
    message: "You left the room successfully.",
  });
}

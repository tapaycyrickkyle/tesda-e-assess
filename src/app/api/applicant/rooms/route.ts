import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "student") {
    return NextResponse.json({ success: false, message: "Applicant access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const { data, error } = await supabase
    .from("room_members")
    .select("id, joined_at, rooms(id, name, qualification, join_code, is_active, created_at)")
    .eq("applicant_id", currentUser.id)
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load joined rooms. Check the Supabase room tables and policies.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, memberships: data ?? [] });
}

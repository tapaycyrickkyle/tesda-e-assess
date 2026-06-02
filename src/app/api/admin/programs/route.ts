import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type CreateProgramPayload = {
  title?: string;
};

type UpdateProgramPayload = {
  id?: string;
  isActive?: boolean;
  title?: string;
};

function forbiddenResponse(status: 401 | 403, message: string) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return forbiddenResponse(401, "You must be logged in.");
  }

  if (currentUser.role !== "admin") {
    return forbiddenResponse(403, "Admin access is required.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, title, is_active, created_at, updated_at")
    .order("is_active", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load programs. Make sure the `programs` table has been created in Supabase.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, programs: data ?? [] });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return forbiddenResponse(401, "You must be logged in.");
  }

  if (currentUser.role !== "admin") {
    return forbiddenResponse(403, "Admin access is required.");
  }

  const body = (await request.json()) as CreateProgramPayload;
  const title = body.title?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ success: false, message: "Program title is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("programs")
    .insert({
      is_active: true,
      title,
    })
    .select("id, title, is_active, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, message: "That program already exists." }, { status: 409 });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add the program right now. Make sure the `programs` table exists and allows inserts.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Program added successfully.",
    program: data,
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return forbiddenResponse(401, "You must be logged in.");
  }

  if (currentUser.role !== "admin") {
    return forbiddenResponse(403, "Admin access is required.");
  }

  const body = (await request.json()) as UpdateProgramPayload;
  const id = body.id?.trim() ?? "";
  const title = body.title?.trim();

  if (!id || (typeof body.isActive !== "boolean" && typeof title !== "string")) {
    return NextResponse.json(
      {
        success: false,
        message: "Program id and at least one update value are required.",
      },
      { status: 400 },
    );
  }

  if (typeof title === "string" && !title) {
    return NextResponse.json({ success: false, message: "Program title is required." }, { status: 400 });
  }

  const updates: Record<string, string | boolean> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.isActive === "boolean") {
    updates.is_active = body.isActive;
  }

  if (typeof title === "string") {
    updates.title = title;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("programs")
    .update(updates)
    .eq("id", id)
    .select("id, title, is_active, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, message: "That program already exists." }, { status: 409 });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update the program right now.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message:
      typeof title === "string"
        ? "Program updated successfully."
        : body.isActive
          ? "Program is now available."
          : "Program is now unavailable.",
    program: data,
  });
}

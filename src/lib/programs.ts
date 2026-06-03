import { qualificationOptions } from "@/lib/application-form";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type ProgramRecord = {
  created_at?: string;
  id: string;
  is_active: boolean;
  title: string;
  updated_at?: string;
};

const fallbackProgramTitles = [...qualificationOptions];

function normalizeProgramTitles(titles: Array<string | null | undefined>) {
  return [...new Set(titles.map((title) => title?.trim()).filter((title): title is string => Boolean(title)))];
}

export function getFallbackProgramTitles() {
  return [...fallbackProgramTitles];
}

export async function loadActiveProgramTitles() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("programs")
      .select("title")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) {
      return getFallbackProgramTitles();
    }

    const titles = normalizeProgramTitles((data ?? []).map((program) => program.title));
    return titles.length > 0 ? titles : getFallbackProgramTitles();
  } catch {
    return getFallbackProgramTitles();
  }
}


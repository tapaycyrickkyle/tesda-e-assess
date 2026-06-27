import { readdir } from "node:fs/promises";
import path from "node:path";
import { qualificationOptions } from "@/lib/application-form";
import { loadSagFormDefinitions, normalizeSagProgramTitle } from "@/lib/sag-forms";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type ProgramRecord = {
  created_at?: string;
  id: string;
  is_active: boolean;
  title: string;
  updated_at?: string;
};

const fallbackProgramTitles = [...qualificationOptions];
const SAG_FORMS_PATH = path.join(process.cwd(), "public", "forms", "sag");

function normalizeProgramTitles(titles: Array<string | null | undefined>) {
  return [...new Set(titles.map((title) => title?.trim()).filter((title): title is string => Boolean(title)))];
}

export function getFallbackProgramTitles() {
  return [...fallbackProgramTitles];
}

export async function loadSagProgramTitles() {
  try {
    const sagForms = await loadSagFormDefinitions();
    const parsedTitles = normalizeProgramTitles(sagForms.map((form) => form.qualificationTitle)).sort((left, right) =>
      left.localeCompare(right),
    );

    if (parsedTitles.length > 0) {
      return parsedTitles;
    }

    const entries = await readdir(SAG_FORMS_PATH, { withFileTypes: true });
    const titles = normalizeProgramTitles(
      entries
        .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
        .map((entry) => normalizeSagProgramTitle(entry.name)),
    ).sort((left, right) => left.localeCompare(right));

    return titles.length > 0 ? titles : getFallbackProgramTitles();
  } catch {
    return getFallbackProgramTitles();
  }
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

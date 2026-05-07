import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/auth";

export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

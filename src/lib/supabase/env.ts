const SUPABASE_URL_VARIABLE = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_VARIABLE = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url && SUPABASE_URL_VARIABLE,
    !anonKey && SUPABASE_ANON_KEY_VARIABLE,
  ].filter((name): name is string => Boolean(name));

  if (!url || !anonKey) {
    throw new Error(
      `Supabase configuration error: missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
    );
  }

  return { url, anonKey };
}

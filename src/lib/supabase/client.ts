import { createBrowserClient } from "@supabase/ssr";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project.supabase.co")
);

export function createClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Unsigned local-dev session fallback (`novel_builder_dev_session` cookie)
 * is only honored outside production. The cookie is plain JSON, so it must
 * never be trusted when real credentials exist or in a production build.
 */
export const isDevAuthFallbackEnabled =
  process.env.NODE_ENV !== "production";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isDevAuthFallbackEnabled } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Ensures a valid authenticated user exists.
 * If not authenticated, automatically redirects to /login.
 *
 * Rule 5.3 & Rule 21 (AGENTS.md): Never trust client-provided IDs. Always verify server-side.
 */
export async function requireAuth(options: { redirectToLogin?: boolean } = { redirectToLogin: true }): Promise<AuthUser> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // 1. Supabase configured authentication
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email || "",
        displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Author",
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      };
    }
  } else if (isDevAuthFallbackEnabled) {
    // 2. Local Dev / Demo Session Fallback (when Supabase credentials are not yet configured).
    // Unsigned JSON cookie: only honored outside production, never when real
    // credentials exist or in a production build.
    const devCookie = cookieStore.get("novel_builder_dev_session");
    if (devCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devCookie.value));
        if (parsed && parsed.id) {
          return {
            id: parsed.id,
            email: parsed.email || "author@novelbuilder.dev",
            displayName: parsed.displayName || "Dev Author",
            avatarUrl: parsed.avatarUrl || null,
          };
        }
      } catch {
        // invalid cookie format, fall through to redirect
      }
    }
  }

  if (options.redirectToLogin !== false) {
    redirect("/login");
  }

  throw new Error("Unauthorized: User is not authenticated.");
}

/**
 * Verifies that the currently authenticated user owns or has access to the specified novel.
 * Prevents unauthorized access or cross-tenant data leakage.
 * Ownership is resolved through NovelRepository so the check holds in both
 * Supabase and local-dev in-memory modes.
 */
export async function requireNovelAccess(
  novelId: string,
  options: { redirectToLogin?: boolean; currentUserId?: string } = {}
): Promise<{ novelId: string; userId: string }> {
  const user = options.currentUserId
    ? { id: options.currentUserId }
    : await requireAuth({ redirectToLogin: options.redirectToLogin });

  const novel = await NovelRepository.findById(novelId, user.id);
  if (!novel) {
    throw new Error(`Unauthorized: User does not have access to novel "${novelId}".`);
  }

  return {
    novelId,
    userId: user.id,
  };
}

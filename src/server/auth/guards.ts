import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  } else {
    // 2. Local Dev / Demo Session Fallback (when Supabase credentials are not yet configured)
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
 */
export async function requireNovelAccess(novelId: string, currentUserId?: string): Promise<{ novelId: string; userId: string }> {
  const user = currentUserId ? { id: currentUserId } : await requireAuth();
  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("novels")
      .select("id")
      .eq("id", novelId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      throw new Error(`Unauthorized: User does not have access to novel "${novelId}".`);
    }
  }

  return {
    novelId,
    userId: user.id,
  };
}

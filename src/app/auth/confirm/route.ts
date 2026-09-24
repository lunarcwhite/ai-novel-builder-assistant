import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Exchanges a Supabase recovery `code` for a session, then continues to the
 * password-reset form. Standard @supabase/ssr code-exchange route.
 *
 * GET /auth/confirm?code=...&next=/reset-password
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/reset-password";

  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(
    siteUrl && anonKey && !siteUrl.includes("your-project.supabase.co")
  );

  if (code && configured) {
    const cookieStore = await cookies();
    const supabase = createServerClient(siteUrl!, anonKey!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // Called from a Route Handler without mutable cookies context;
            // middleware handles session refresh on the next request.
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectUrl = new URL(next, request.url);
      // Only allow same-origin relative targets.
      if (redirectUrl.origin !== url.origin) {
        return NextResponse.redirect(new URL("/reset-password", request.url));
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

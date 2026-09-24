import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project.supabase.co")
  );

  let isAuthenticated = false;

  if (isSupabaseConfigured) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              response.cookies.set(name, value, options as any)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } else if (process.env.NODE_ENV !== "production") {
    // Local dev mode fallback session check. Unsigned cookie: never trusted
    // in production (see isDevAuthFallbackEnabled).
    const devCookie = request.cookies.get("novel_builder_dev_session");
    isAuthenticated = Boolean(devCookie?.value);
  }

  // 1. Protected routes: /workspace/*
  if (pathname.startsWith("/workspace")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth routes: /login, /signup
  if (pathname === "/login" || pathname === "/signup") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/login",
    "/signup",
  ],
};

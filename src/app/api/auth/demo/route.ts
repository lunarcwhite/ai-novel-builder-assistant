import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function handleDemoAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const demoUser = {
    id: "usr_demo_author_01",
    email: "clara.penulis@novelbuilder.dev",
    displayName: "Clara V. Sterling",
  };

  cookieStore.set("novel_builder_dev_session", encodeURIComponent(JSON.stringify(demoUser)), {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/workspace";
  const redirectUrl = new URL(redirectTo, request.url);
  return NextResponse.redirect(redirectUrl, 303);
}

export async function POST(request: NextRequest) {
  return handleDemoAuth(request);
}

export async function GET(request: NextRequest) {
  return handleDemoAuth(request);
}

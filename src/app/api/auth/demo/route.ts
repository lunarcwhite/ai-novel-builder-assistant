import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
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

  const redirectUrl = new URL("/workspace", request.url);
  return NextResponse.redirect(redirectUrl, 303);
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (supabase && isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  const cookieStore = await cookies();
  cookieStore.delete("novel_builder_dev_session");
  return NextResponse.redirect(new URL("/login", request.url), 303);
}

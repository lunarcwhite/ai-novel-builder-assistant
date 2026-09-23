"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

const signupSchema = z.object({
  displayName: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export type AuthActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

/**
 * Handles user login.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/workspace";

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Input tidak valid." };
  }

  const supabase = await createClient();

  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } else {
    // Local development session fallback
    const cookieStore = await cookies();
    const devUser = {
      id: "usr_dev_" + Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split("@")[0],
    };
    cookieStore.set("novel_builder_dev_session", encodeURIComponent(JSON.stringify(devUser)), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
  }

  redirect(redirectTo);
}

/**
 * Handles new user registration.
 */
export async function signupAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const displayName = formData.get("displayName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = signupSchema.safeParse({ displayName, email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Input tidak valid." };
  }

  const supabase = await createClient();

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user && !data.session) {
      return {
        success: true,
        message: "Pendaftaran berhasil! Silakan periksa email Anda untuk memverifikasi akun.",
      };
    }
  } else {
    // Local dev session fallback
    const cookieStore = await cookies();
    const devUser = {
      id: "usr_dev_" + Math.random().toString(36).substring(2, 9),
      email,
      displayName,
    };
    cookieStore.set("novel_builder_dev_session", encodeURIComponent(JSON.stringify(devUser)), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  redirect("/workspace");
}

/**
 * Handles password reset request.
 */
export async function resetPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;

  const validation = resetPasswordSchema.safeParse({ email });
  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Input tidak valid." };
  }

  const supabase = await createClient();

  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }
  }

  return {
    success: true,
    message: "Instruksi pemulihan kata sandi telah dikirimkan ke email Anda jika terdaftar.",
  };
}

/**
 * Handles user logout.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  if (supabase && isSupabaseConfigured) {
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete("novel_builder_dev_session");

  redirect("/login");
}

/**
 * Instant demo login for local development testing.
 */
export async function demoLoginAction(): Promise<void> {
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

  redirect("/workspace");
}

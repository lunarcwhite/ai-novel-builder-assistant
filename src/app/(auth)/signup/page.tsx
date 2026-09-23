"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Feather, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    signupAction,
    null
  );

  return (
    <Card className="border-border/80 shadow-paper">
      <CardHeader className="space-y-1 pb-4">
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
          <Feather className="w-4 h-4" />
        </div>
        <CardTitle className="text-xl font-serif font-normal">Buat Ruang Kerja Penulis</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Mulai merancang karakter, dunia, dan manuskrip cerita Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state?.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && state?.message && (
          <div className="p-3 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-medium text-foreground">
              Nama Lengkap / Nama Pena
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Contoh: Clara Sterling"
              required
              autoComplete="name"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Alamat Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="penulis@contoh.com"
              required
              autoComplete="email"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              Kata Sandi (Minimal 6 karakter)
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="text-sm"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full text-xs font-medium mt-2">
            {isPending ? "Mendaftarkan..." : "Daftar & Mulai Menulis"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-0 justify-center text-xs text-muted-foreground">
        Sudah memiliki akun?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline ml-1">
          Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}

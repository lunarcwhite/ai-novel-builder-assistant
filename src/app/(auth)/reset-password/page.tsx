"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type AuthActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { KeyRound, AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    updatePasswordAction,
    null
  );

  return (
    <Card className="border-border/80 shadow-paper">
      <CardHeader className="space-y-1 pb-4">
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
          <KeyRound className="w-4 h-4" />
        </div>
        <CardTitle className="text-xl font-serif font-normal">Tetapkan Kata Sandi Baru</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Masukkan kata sandi baru untuk akun penulis Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state?.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              Kata Sandi Baru (Minimal 6 karakter)
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

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
              Konfirmasi Kata Sandi Baru
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="text-sm"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full text-xs font-medium mt-2">
            {isPending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-0 justify-center text-xs text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke halaman Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}

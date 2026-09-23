"use client";

import React, { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Feather, Sparkles, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/workspace";

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );

  return (
    <Card className="border-border/80 shadow-paper">
      <CardHeader className="space-y-1 pb-4">
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
          <Feather className="w-4 h-4" />
        </div>
        <CardTitle className="text-xl font-serif font-normal">Masuk ke Studio</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Masukkan akun Anda untuk melanjutkan penulisan novel.
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
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email Penulis
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Lupa sandi?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="text-sm"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full text-xs font-medium mt-2">
            {isPending ? "Memproses..." : "Masuk ke Workspace"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground">atau mode lokal</span>
          </div>
        </div>

        {/* Demo login for local testing */}
        <form action="/api/auth/demo" method="POST">
          <Button
            type="submit"
            variant="outline"
            className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Masuk Cepat Demo Author (Lokal)
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-0 justify-center text-xs text-muted-foreground">
        Belum memiliki akun?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline ml-1">
          Daftar sekarang
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border-border/80 shadow-paper p-8 text-center text-xs text-muted-foreground">
        Memuat studio login...
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}

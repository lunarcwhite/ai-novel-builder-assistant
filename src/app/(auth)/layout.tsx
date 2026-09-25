import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Editorial side banner (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-card/60 border-r border-border/70 p-12 flex-col justify-between relative overflow-hidden">
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 text-foreground group">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg shadow-subtle group-hover:bg-primary/90 transition-colors">
              N
            </div>
            <span className="font-semibold text-sm tracking-tight">Novel Builder</span>
          </Link>
        </div>

        <div className="max-w-md space-y-4 my-auto">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <blockquote className="font-serif text-2xl font-normal leading-relaxed text-foreground">
            &ldquo;The author owns the story. The AI may assist the creative process, but never take ownership of it.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground tracking-wide uppercase">
            Prinsip Utama: Filosofi Ruang Kerja Novel Builder
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          Ruang kerja terfokus untuk novelis mandiri.
        </div>
      </div>

      {/* Auth Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="lg:hidden w-full max-w-sm mb-6 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-base">
              N
            </div>
            <span className="font-semibold text-sm">Novel Builder</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

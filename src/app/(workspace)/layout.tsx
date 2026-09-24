import React from "react";
import Link from "next/link";
import { requireAuth } from "@/server/auth/guards";
import { Button } from "@/components/ui/button";
import CommandPaletteHost, { PaletteTriggerButton } from "@/components/command-palette";
import { LogOut } from "lucide-react";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Application Workspace Header */}
      <header className="h-14 border-b border-border/70 px-6 flex items-center justify-between bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/workspace" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg shadow-subtle group-hover:bg-primary/90 transition-colors">
              N
            </div>
            <span className="font-semibold text-sm tracking-tight">Novel Builder</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-xs text-muted-foreground font-medium">Studio Penulis</span>
        </div>

        {/* User Profile & Session Actions */}
        <div className="flex items-center gap-3">
          <PaletteTriggerButton />
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-foreground">{user.displayName}</div>
            <div className="text-[10px] text-muted-foreground">{user.email}</div>
          </div>

          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-serif text-sm font-semibold border border-border">
            {user.displayName.charAt(0).toUpperCase()}
          </div>

          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-card focus:border focus:border-border focus:text-xs"
        >
          Lewati ke konten utama
        </a>
        {children}
      </main>
      <CommandPaletteHost />
    </div>
  );
}

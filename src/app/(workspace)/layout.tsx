import React from "react";
import Link from "next/link";
import { requireAuth } from "@/server/auth/guards";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLink,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ToastProvider } from "@/components/ui/toast";
import CommandPaletteHost, { PaletteTriggerButton } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, ChevronDown, LogOut } from "lucide-react";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Accessible skip link: allows keyboard users to bypass navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-card focus:border focus:border-border focus:shadow-subtle focus:text-xs focus:font-medium focus:text-foreground"
      >
        Lewati ke konten utama
      </a>

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
        <div className="flex items-center gap-2 sm:gap-3">
          <PaletteTriggerButton />
          <ThemeToggle />
          <DropdownMenu
            label="Menu akun"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="text-right hidden sm:block">
                  <span className="block text-xs font-medium text-foreground">
                    {user.displayName}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{user.email}</span>
                </span>
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-serif text-sm font-semibold border border-border">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            }
          >
            <div className="px-3 py-2 sm:hidden">
              <div className="text-xs font-medium text-foreground">{user.displayName}</div>
              <div className="text-[10px] text-muted-foreground">{user.email}</div>
            </div>
            <DropdownMenuLink href="/workspace">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              Pustaka Novel
            </DropdownMenuLink>
            <DropdownMenuSeparator />
            <form action="/api/auth/logout" method="POST">
              <DropdownMenuItem
                type="submit"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </DropdownMenuItem>
            </form>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <ToastProvider>
        <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
          {children}
        </main>
        <CommandPaletteHost />
      </ToastProvider>
    </div>
  );
}

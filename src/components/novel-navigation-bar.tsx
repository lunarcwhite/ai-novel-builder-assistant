"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Globe, Feather, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovelNavigationBarProps {
  novelId: string;
  firstSceneId?: string | null;
}

export default function NovelNavigationBar({
  novelId,
  firstSceneId,
}: NovelNavigationBarProps) {
  const pathname = usePathname();

  const isOverview = pathname === `/workspace/${novelId}`;
  const isCharacters = pathname.startsWith(`/workspace/${novelId}/characters`);
  const isWorld = pathname.startsWith(`/workspace/${novelId}/world`);
  const isMemories = pathname.startsWith(`/workspace/${novelId}/memories`);

  const tabs = [
    {
      label: "Garis Besar & Naskah",
      href: `/workspace/${novelId}`,
      active: isOverview,
      icon: BookOpen,
    },
    {
      label: "Karakter & Relasi",
      href: `/workspace/${novelId}/characters`,
      active: isCharacters,
      icon: Users,
    },
    {
      label: "Dunia & Aturan",
      href: `/workspace/${novelId}/world`,
      active: isWorld,
      icon: Globe,
    },
    {
      label: "Memori Cerita",
      href: `/workspace/${novelId}/memories`,
      active: isMemories,
      icon: BrainCircuit,
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
      {/* Navigation tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                tab.active
                  ? "bg-primary text-primary-foreground shadow-subtle"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick link to Editor if scene available */}
      {firstSceneId && (
        <div className="shrink-0">
          <Link
            href={`/workspace/${novelId}/write/${firstSceneId}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-muted/40"
          >
            <Feather className="w-3 h-3 text-primary" />
            <span>Buka Editor Naskah</span>
          </Link>
        </div>
      )}
    </div>
  );
}

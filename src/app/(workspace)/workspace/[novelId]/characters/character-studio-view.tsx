"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Character,
  CharacterRelationship,
  CharacterRole,
  Novel,
} from "@/types";
import {
  UserPlus,
  Search,
  Users,
  Edit,
  Trash2,
  HeartHandshake,
  BookOpen,
  ArrowRight,
  Shield,
  Target,
  Flame,
  KeyRound,
  Compass,
  Sparkles,
  Feather,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CharacterFormDialog,
  RelationshipFormDialog,
  DeleteConfirmDialog,
} from "./character-dialogs";
import { cn } from "@/lib/utils";

interface AppearanceItem {
  sceneId: string;
  sceneTitle: string;
  chapterId: string;
  isPov: boolean;
}

interface CharacterStudioViewProps {
  novel: Novel;
  characters: Character[];
  relationships: CharacterRelationship[];
  appearancesMap: Record<string, AppearanceItem[]>;
}

export default function CharacterStudioView({
  novel,
  characters,
  relationships,
  appearancesMap,
}: CharacterStudioViewProps) {
  // State
  const [selectedCharId, setSelectedCharId] = useState<string>(
    characters[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"profile" | "arc" | "relations" | "appearances">(
    "profile"
  );

  // Dialog states
  const [isCharDialogOpen, setIsCharDialogOpen] = useState<boolean>(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isRelDialogOpen, setIsRelDialogOpen] = useState<boolean>(false);
  const [editingRel, setEditingRel] = useState<CharacterRelationship | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "character" | "relationship";
  } | null>(null);

  // Filtered characters
  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.occupation && c.occupation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === "all" || c.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [characters, searchQuery, roleFilter]);

  // Selected character details
  const selectedChar = useMemo(() => {
    return (
      characters.find((c) => c.id === selectedCharId) ||
      filteredCharacters[0] ||
      characters[0] ||
      null
    );
  }, [characters, selectedCharId, filteredCharacters]);

  // Relationships involving the selected character
  const charRelations = useMemo(() => {
    if (!selectedChar) return [];
    return relationships.filter(
      (r) =>
        r.from_character_id === selectedChar.id ||
        r.to_character_id === selectedChar.id
    );
  }, [relationships, selectedChar]);

  // Appearances for selected character
  const charAppearances = useMemo(() => {
    if (!selectedChar) return [];
    return appearancesMap[selectedChar.id] || [];
  }, [appearancesMap, selectedChar]);

  // Role Badge Helper
  const getRoleBadge = (role: CharacterRole) => {
    switch (role) {
      case "protagonist":
        return <Badge variant="accent" className="text-[10px]">Protagonis</Badge>;
      case "antagonist":
        return <Badge variant="destructive" className="text-[10px]">Antagonis</Badge>;
      case "deuteragonist":
        return <Badge variant="default" className="text-[10px] bg-primary/80">Deuteragonis</Badge>;
      case "supporting":
        return <Badge variant="outline" className="text-[10px]">Pendukung</Badge>;
      case "minor":
        return <Badge variant="secondary" className="text-[10px]">Figuran</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
    }
  };

  // Relationship Badge Helper
  const getRelBadge = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
      ally: { label: "Sekutu", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
      friend: { label: "Sahabat", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20" },
      mentor: { label: "Guru / Mentor", className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
      family: { label: "Keluarga", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
      love_interest: { label: "Romansa", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
      rival: { label: "Rival", className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20" },
      enemy: { label: "Musuh", className: "bg-destructive/10 text-destructive border-destructive/20" },
      custom: { label: "Khusus", className: "bg-muted text-muted-foreground" },
    };
    const item = map[type] || { label: type, className: "bg-muted" };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", item.className)}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-normal text-foreground">
            Character Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola profil kepribadian, busur perkembangan naratif, serta jejaring relasi tokoh novel Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => {
              setEditingRel(null);
              setIsRelDialogOpen(true);
            }}
            disabled={characters.length < 2}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-primary" />
            <span>Tambah Relasi</span>
          </Button>

          <Button
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={() => {
              setEditingCharacter(null);
              setIsCharDialogOpen(true);
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Karakter</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid (Left Roster + Right Detail Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Character Roster (4 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/80">
            <CardHeader className="p-4 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Daftar Tokoh ({characters.length})
                </CardTitle>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Cari tokoh atau profesi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-muted/30"
                />
              </div>

              {/* Role Filter Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  { id: "all", label: "Semua" },
                  { id: "protagonist", label: "Protagonis" },
                  { id: "antagonist", label: "Antagonis" },
                  { id: "deuteragonist", label: "Deuteragonis" },
                  { id: "supporting", label: "Pendukung" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoleFilter(item.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors",
                      roleFilter === item.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-2 pt-0 max-h-[620px] overflow-y-auto space-y-1.5">
              {filteredCharacters.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Tidak ada karakter yang cocok dengan filter pencarian.
                </div>
              ) : (
                filteredCharacters.map((c) => {
                  const isSelected = selectedChar?.id === c.id;
                  const appearancesCount = appearancesMap[c.id]?.length || 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCharId(c.id)}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer text-left space-y-1.5",
                        isSelected
                          ? "bg-accent/15 border-accent text-foreground shadow-subtle"
                          : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {c.name}
                        </span>
                        {getRoleBadge(c.role)}
                      </div>

                      {c.occupation && (
                        <div className="text-[11px] text-muted-foreground truncate font-medium">
                          {c.occupation}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1">
                        <span>{c.age || "Usia —"}</span>
                        <span>{appearancesCount} adegan naskah</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Character Detailed Workspace (8 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {selectedChar ? (
            <Card className="border-border/80 shadow-paper overflow-hidden">
              {/* Character Header Banner */}
              <div className="p-6 md:p-8 bg-card border-b border-border/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getRoleBadge(selectedChar.role)}
                      {selectedChar.age && (
                        <span className="text-xs text-muted-foreground">
                          • {selectedChar.age}
                        </span>
                      )}
                      {selectedChar.occupation && (
                        <span className="text-xs text-muted-foreground">
                          • {selectedChar.occupation}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                      {selectedChar.name}
                    </h2>

                    {selectedChar.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-serif italic">
                        &ldquo;{selectedChar.description}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Character Action Buttons */}
                  <div className="flex items-center gap-2 self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1.5"
                      onClick={() => {
                        setEditingCharacter(selectedChar);
                        setIsCharDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({
                          id: selectedChar.id,
                          name: selectedChar.name,
                          type: "character",
                        })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="pt-2 border-t border-border/50">
                  <Tabs
                    value={activeTab}
                    onValueChange={(id) => setActiveTab(id as typeof activeTab)}
                    ariaLabel="Navigasi detail karakter"
                    items={[
                      { id: "profile", label: "Profil & Motivasi", icon: Compass },
                      { id: "arc", label: "Busur Karakter (Arc)", icon: Sparkles },
                      {
                        id: "relations",
                        label: `Relasi (${charRelations.length})`,
                        icon: HeartHandshake,
                      },
                      {
                        id: "appearances",
                        label: `Kemunculan di Naskah (${charAppearances.length})`,
                        icon: BookOpen,
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 md:p-8 space-y-6">
                {/* ----------------------------------------------------- */}
                {/* TAB 1: PROFIL & MOTIVASI */}
                {/* ----------------------------------------------------- */}
                {activeTab === "profile" && (
                  <div className="space-y-6 text-xs animate-in fade-in">
                    {/* Psychological Foundation Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-primary font-medium">
                          <Target className="w-3.5 h-3.5" />
                          <span>Tujuan Utama (Goal)</span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {selectedChar.goal || "Belum ditentukan."}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Motivasi Emosional</span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {selectedChar.motivation || "Belum ditentukan."}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Ketakutan Terbesar (Fear)</span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {selectedChar.fear || "Belum ditentukan."}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Rahasia Terpendam (Secret)</span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {selectedChar.secret || "Belum ditentukan."}
                        </p>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">Kekuatan Utama:</span>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedChar.strengths || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">Kelemahan / Cacat Fatal:</span>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedChar.weaknesses || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Personality */}
                    <div className="space-y-1 pt-3 border-t border-border/40">
                      <span className="font-semibold text-foreground">Kepribadian & Watak:</span>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedChar.personality || "Belum ada rincian kepribadian."}
                      </p>
                    </div>

                    {/* Backstory */}
                    <div className="space-y-1 pt-3 border-t border-border/40">
                      <span className="font-semibold text-foreground">Latar Belakang Masa Lalu:</span>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedChar.backstory || "Belum ada latar belakang tertulis."}
                      </p>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------- */}
                {/* TAB 2: BUSUR KARAKTER (ARC) */}
                {/* ----------------------------------------------------- */}
                {activeTab === "arc" && (
                  <div className="space-y-6 text-xs animate-in fade-in">
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Visualisasi Busur Cerita (Character Arc)
                        </span>
                      </div>

                      {/* 3-Stage Arc Progression */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative pt-2">
                        <div className="p-3.5 rounded-lg bg-card border border-border/70 space-y-1.5 shadow-subtle">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Tahap 1: Titik Awal
                          </div>
                          <p className="text-foreground leading-relaxed">
                            Zona nyaman, keyakinan keliru (Lie), atau keterbatasan duniawi tokoh di awal novel.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-card border border-primary/40 space-y-1.5 shadow-subtle">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Tahap 2: Ujian Krisis
                          </div>
                          <p className="text-foreground leading-relaxed">
                            Konflik yang memaksa tokoh keluar dari zona nyaman dan menghadapi kelemahannya.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-card border border-border/70 space-y-1.5 shadow-subtle">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Tahap 3: Transformasi
                          </div>
                          <p className="text-foreground leading-relaxed">
                            Penerimaan kebenaran (Truth) dan hasil akhir perubahan nasib atau watak tokoh.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-semibold text-foreground text-sm">
                        Rencana Perjalanan Karakter:
                      </span>
                      {selectedChar.character_arc ? (
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedChar.character_arc}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                          Belum ada catatan busur karakter. Klik tombol Edit di atas untuk mulai merancang perjalanan emosional tokoh ini.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------- */}
                {/* TAB 3: RELASI ANTAR KARAKTER */}
                {/* ----------------------------------------------------- */}
                {activeTab === "relations" && (
                  <div className="space-y-4 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-muted-foreground">
                        Hubungan {selectedChar.name} dengan tokoh-tokoh lainnya dalam cerita:
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setEditingRel(null);
                          setIsRelDialogOpen(true);
                        }}
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-primary" />
                        <span>Tambah Hubungan</span>
                      </Button>
                    </div>

                    {charRelations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                        <Users className="w-6 h-6 mx-auto opacity-40" />
                        <p>Belum ada relasi yang tercatat untuk karakter ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {charRelations.map((r) => {
                          const isOrigin = r.from_character_id === selectedChar.id;
                          const otherName = isOrigin
                            ? r.to_character_name
                            : r.from_character_name;

                          return (
                            <div
                              key={r.id}
                              className="p-4 rounded-lg bg-card border border-border/70 shadow-subtle space-y-2.5 relative group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                  <span>{selectedChar.name}</span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-semibold text-primary">{otherName}</span>
                                </div>
                                {getRelBadge(r.relationship_type)}
                              </div>

                              {r.description && (
                                <p className="text-foreground leading-relaxed">
                                  {r.description}
                                </p>
                              )}

                              {r.history && (
                                <div className="text-[11px] text-muted-foreground">
                                  <span className="font-medium text-muted-foreground/90">Masa lalu: </span>
                                  {r.history}
                                </div>
                              )}

                              {r.current_state && (
                                <div className="text-[11px] text-muted-foreground">
                                  <span className="font-medium text-muted-foreground/90">Kondisi saat ini: </span>
                                  <span className="italic">{r.current_state}</span>
                                </div>
                              )}

                              <div className="pt-2 border-t border-border/40 flex justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => {
                                    setEditingRel(r);
                                    setIsRelDialogOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: r.id,
                                      name: `Relasi ${selectedChar.name} & ${otherName}`,
                                      type: "relationship",
                                    })
                                  }
                                >
                                  Hapus
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------------------------------------------- */}
                {/* TAB 4: KEMUNCULAN DI NASKAH (APPEARANCES) */}
                {/* ----------------------------------------------------- */}
                {activeTab === "appearances" && (
                  <div className="space-y-4 text-xs animate-in fade-in">
                    <div className="text-muted-foreground pb-2 border-b border-border/60">
                      Adegan-adegan naskah di mana <strong>{selectedChar.name}</strong> berperan sebagai sudut pandang (POV) atau hadir terlibat:
                    </div>

                    {charAppearances.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                        <BookOpen className="w-6 h-6 mx-auto opacity-40" />
                        <p>Karakter ini belum ditautkan ke adegan mana pun.</p>
                        <p className="text-[11px]">
                          Buka editor penulisan adegan naskah untuk menghubungkan karakter POV atau tokoh yang terlibat.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {charAppearances.map((app) => (
                          <div
                            key={app.sceneId}
                            className="p-3.5 rounded-lg bg-card border border-border/70 hover:border-accent/60 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {app.sceneTitle}
                                </span>
                                {app.isPov ? (
                                  <Badge variant="accent" className="text-[10px]">
                                    Karakter POV
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    Hadir di Adegan
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                ID Adegan: {app.sceneId}
                              </span>
                            </div>

                            <Link
                              href={`/workspace/${novel.id}/write/${app.sceneId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/60 hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-colors"
                            >
                              <Feather className="w-3.5 h-3.5" />
                              <span>Buka di Editor</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl space-y-3">
              <Users className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-sm font-medium">Belum ada karakter yang dipilih</div>
              <p className="text-xs max-w-sm mx-auto">
                Silakan buat karakter pertama Anda untuk mulai menyusun biografi, kepribadian, dan relasi naratif.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCharacter(null);
                  setIsCharDialogOpen(true);
                }}
              >
                Buat Karakter Pertama
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CharacterFormDialog
        novelId={novel.id}
        character={editingCharacter}
        isOpen={isCharDialogOpen}
        onClose={() => setIsCharDialogOpen(false)}
      />

      <RelationshipFormDialog
        novelId={novel.id}
        characters={characters}
        relationship={editingRel}
        defaultFromCharacterId={selectedChar?.id}
        isOpen={isRelDialogOpen}
        onClose={() => setIsRelDialogOpen(false)}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          novelId={novel.id}
          targetId={deleteTarget.id}
          targetName={deleteTarget.name}
          type={deleteTarget.type}
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

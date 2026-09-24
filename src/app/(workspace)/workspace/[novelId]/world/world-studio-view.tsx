"use client";

import React, { useState, useMemo } from "react";
import {
  Novel,
  Location,
  WorldRule,
  WorldLore,
} from "@/types";
import {
  MapPin,
  Scale,
  ScrollText,
  Plus,
  Edit,
  Trash2,
  Search,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LocationFormDialog,
  WorldRuleFormDialog,
  WorldLoreFormDialog,
  WorldDeleteConfirmDialog,
} from "./world-dialogs";
import { cn } from "@/lib/utils";

interface WorldStudioViewProps {
  novel: Novel;
  locations: Location[];
  worldRules: WorldRule[];
  worldLore: WorldLore[];
}

export default function WorldStudioView({
  novel,
  locations,
  worldRules,
  worldLore,
}: WorldStudioViewProps) {
  // Tabs: 'locations' | 'rules' | 'lore'
  const [activeTab, setActiveTab] = useState<"locations" | "rules" | "lore">("locations");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dialog states
  const [locDialogOpen, setLocDialogOpen] = useState<boolean>(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  const [ruleDialogOpen, setRuleDialogOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<WorldRule | null>(null);

  const [loreDialogOpen, setLoreDialogOpen] = useState<boolean>(false);
  const [editingLore, setEditingLore] = useState<WorldLore | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "location" | "rule" | "lore";
  } | null>(null);

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.geography && l.geography.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.atmosphere && l.atmosphere.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [locations, searchQuery]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return worldRules.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [worldRules, searchQuery]);

  // Categories list for lore
  const loreCategories = useMemo(() => {
    const set = new Set(worldLore.map((l) => l.category));
    return ["all", ...Array.from(set)];
  }, [worldLore]);

  // Filtered Lore
  const filteredLore = useMemo(() => {
    return worldLore.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "all" || l.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [worldLore, searchQuery, selectedCategory]);

  // Importance badge for rules
  const getImportanceBadge = (importance: number) => {
    if (importance === 5) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          Kritis (Level 5)
        </span>
      );
    }
    if (importance === 4) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          Tinggi (Level 4)
        </span>
      );
    }
    if (importance === 3) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
          Standar (Level 3)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border">
        Level {importance}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-normal text-foreground">
            Worldbuilding Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Bangun fondasi semesta cerita Anda: peta lokasi geografis, hukum dan kaidah dunia (rules), serta arsip ensiklopedia lore.
          </p>
        </div>

        {/* Dynamic Add Button depending on active tab */}
        <div>
          {activeTab === "locations" && (
            <Button
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => {
                setEditingLoc(null);
                setLocDialogOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Lokasi</span>
            </Button>
          )}

          {activeTab === "rules" && (
            <Button
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => {
                setEditingRule(null);
                setRuleDialogOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aturan Dunia</span>
            </Button>
          )}

          {activeTab === "lore" && (
            <Button
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => {
                setEditingLore(null);
                setLoreDialogOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Artikel Lore</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <Tabs
          value={activeTab}
          onValueChange={(id) => {
            setActiveTab(id as typeof activeTab);
            setSearchQuery("");
          }}
          ariaLabel="Navigasi studio dunia"
          items={[
            {
              id: "locations",
              label: `Lokasi (${locations.length})`,
              icon: MapPin,
            },
            {
              id: "rules",
              label: `Aturan Dunia (${worldRules.length})`,
              icon: Scale,
            },
            {
              id: "lore",
              label: `Lore & Ensiklopedia (${worldLore.length})`,
              icon: ScrollText,
            },
          ]}
        />

        {/* Global Tab Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder={`Cari di ${activeTab === "locations" ? "lokasi" : activeTab === "rules" ? "aturan" : "lore"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/30"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. LOKASI TAB */}
      {/* ========================================================= */}
      {activeTab === "locations" && (
        <div className="space-y-4">
          {filteredLocations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl space-y-3">
              <MapPin className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-sm font-medium">Belum ada lokasi yang tersimpan</div>
              <p className="text-xs max-w-sm mx-auto">
                Tambahkan lokasi cerita untuk menggambarkan tempat kejadian, suasana atmosfer, dan menautkannya ke adegan naskah.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingLoc(null);
                  setLocDialogOpen(true);
                }}
              >
                Tambah Lokasi Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((loc) => (
                <Card
                  key={loc.id}
                  className="border-border/80 shadow-subtle hover:border-accent/60 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-5 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-serif text-lg font-medium text-foreground">
                        {loc.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingLoc(loc);
                            setLocDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({
                              id: loc.id,
                              name: loc.name,
                              type: "location",
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {loc.geography && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Compass className="w-3 h-3 shrink-0" />
                        <span className="truncate">{loc.geography}</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {loc.atmosphere && (
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground leading-relaxed italic font-serif">
                          &ldquo;{loc.atmosphere}&rdquo;
                        </div>
                      )}

                      {loc.description && (
                        <p className="text-muted-foreground leading-relaxed">
                          {loc.description}
                        </p>
                      )}
                    </div>

                    {loc.notes && (
                      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground/90">
                        <span className="font-semibold text-foreground">Catatan: </span>
                        {loc.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ATURAN DUNIA (WORLD RULES) TAB */}
      {/* ========================================================= */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary shrink-0" />
            <span>
              Aturan Dunia mendefinisikan batasan sihir, hukum alam, hukum faksi, atau kaidah mutlak semesta cerita Anda yang akan diawasi oleh <em>Consistency Checker</em> di fase mendatang.
            </span>
          </div>

          {filteredRules.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl space-y-3">
              <Scale className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-sm font-medium">Belum ada aturan dunia</div>
              <p className="text-xs max-w-sm mx-auto">
                Tetapkan aturan logis yang harus dipatuhi karakter Anda agar cerita tetap konsisten dan kredibel.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingRule(null);
                  setRuleDialogOpen(true);
                }}
              >
                Buat Aturan Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-lg bg-card border border-border/80 shadow-subtle space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-serif font-medium text-base text-foreground">
                          {r.title}
                        </h3>
                        {getImportanceBadge(r.importance)}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingRule(r);
                            setRuleDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({
                              id: r.id,
                              name: r.title,
                              type: "rule",
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Rule Statement Box */}
                    <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground font-serif leading-relaxed">
                      {r.rule}
                    </div>

                    {r.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {r.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    Terdaftar sejak: {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LORE & ENSIKLOPEDIA TAB */}
      {/* ========================================================= */}
      {activeTab === "lore" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          {loreCategories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {loreCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "Semua Kategori" : cat}
                </button>
              ))}
            </div>
          )}

          {filteredLore.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl space-y-3">
              <ScrollText className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-sm font-medium">Belum ada catatan lore</div>
              <p className="text-xs max-w-sm mx-auto">
                Tulis artikel ensiklopedia mengenai mitologi masa lalu, sistem peradaban, agama, dan misteri yang melingkupi kisah Anda.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingLore(null);
                  setLoreDialogOpen(true);
                }}
              >
                Tulis Artikel Lore Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLore.map((item) => (
                <Card
                  key={item.id}
                  className="border-border/80 shadow-subtle hover:border-accent/60 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-5 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px]">
                          {item.category}
                        </Badge>
                        <CardTitle className="font-serif text-lg font-medium text-foreground">
                          {item.title}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingLore(item);
                            setLoreDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({
                              id: item.id,
                              name: item.title,
                              type: "lore",
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3 text-xs flex-1 flex flex-col justify-between">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-serif">
                      {item.content}
                    </p>

                    <div className="pt-3 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between items-center">
                      <span>Kategori: {item.category}</span>
                      <span>Diperbarui: {new Date(item.updated_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <LocationFormDialog
        novelId={novel.id}
        location={editingLoc}
        isOpen={locDialogOpen}
        onClose={() => setLocDialogOpen(false)}
      />

      <WorldRuleFormDialog
        novelId={novel.id}
        rule={editingRule}
        isOpen={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
      />

      <WorldLoreFormDialog
        novelId={novel.id}
        lore={editingLore}
        isOpen={loreDialogOpen}
        onClose={() => setLoreDialogOpen(false)}
      />

      {deleteTarget && (
        <WorldDeleteConfirmDialog
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

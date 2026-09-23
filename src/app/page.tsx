"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Feather, 
  Sparkles, 
  Layers, 
  Users, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"workspace" | "phases" | "architecture">("workspace");

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Application Header */}
      <header className="h-14 border-b border-border/70 px-6 flex items-center justify-between bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg shadow-subtle">
            N
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              Novel Builder
              <Badge variant="accent" className="text-[10px] tracking-normal font-sans py-0">
                Phase 0 Active
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground">AI Novel Writing Workspace</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border/50 text-xs">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-3 py-1 rounded transition-all font-medium ${
              activeTab === "workspace"
                ? "bg-card text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Workspace Preview
          </button>
          <button
            onClick={() => setActiveTab("phases")}
            className={`px-3 py-1 rounded transition-all font-medium ${
              activeTab === "phases"
                ? "bg-card text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Roadmap & Status
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1 rounded transition-all font-medium ${
              activeTab === "architecture"
                ? "bg-card text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            System Specs
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded border border-border/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Stack Ready</span>
          </div>
          <Button size="sm" variant="default" className="text-xs">
            Start Writing
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {activeTab === "workspace" && (
          <div className="space-y-6">
            {/* Hero / Studio Welcome */}
            <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-paper relative overflow-hidden">
              <div className="max-w-2xl space-y-3">
                <Badge variant="outline" className="text-xs uppercase tracking-wider text-muted-foreground">
                  The author owns the story
                </Badge>
                <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-foreground">
                  Ruang Kerja Penulisan Novel dengan Story Intelligence
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Fondasi proyek telah selesai diinisialisasi. Workspace ini menggabungkan naskah editorial, struktur cerita terorganisir, memori fakta novel, dan asisten AI non-destruktif.
                </p>
              </div>
            </div>

            {/* Studio Workspace Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Story Structure Navigation */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-border/80">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Struktur Naskah
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px]">Act I</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <div className="p-2 rounded bg-muted/60 text-xs font-medium flex items-center justify-between border-l-2 border-primary">
                      <span>Chapter 1: Bayang Kota Tua</span>
                      <span className="text-[10px] text-muted-foreground">1,820 w</span>
                    </div>
                    <div className="p-2 rounded hover:bg-muted/40 text-xs text-muted-foreground flex items-center justify-between cursor-pointer transition-colors">
                      <span>Chapter 2: Jamuan di Menara</span>
                      <span className="text-[10px]">2,150 w</span>
                    </div>
                    <div className="p-2 rounded hover:bg-muted/40 text-xs text-muted-foreground flex items-center justify-between cursor-pointer transition-colors">
                      <span>Chapter 3: Arsip Terlarang</span>
                      <span className="text-[10px]">Draft</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/80">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Character Bible
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <div>
                        <div className="font-medium text-foreground">Kaelen Voss</div>
                        <div className="text-[11px] text-muted-foreground">Protagonist • Scholar</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">POV</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Lady Seraphina</div>
                        <div className="text-[11px] text-muted-foreground">Antagonist • Royal Envoy</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column: Editorial Manuscript Preview */}
              <div className="lg:col-span-6">
                <Card className="h-full border-border/80 flex flex-col shadow-subtle">
                  <div className="border-b border-border/60 px-6 py-3 flex items-center justify-between bg-muted/20">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Feather className="w-3.5 h-3.5 text-primary" />
                      <span>Scene 1: Pertemuan di Gerbang Pasir</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: 2,500 kata
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 flex-1 manuscript-text text-foreground/90 space-y-4">
                    <h3 className="font-serif text-2xl font-normal text-foreground">
                      Bab 1: Bayang Kota Tua
                    </h3>
                    <p>
                      Kabut pagi belum sepenuhnya menguap saat Kaelen mengencangkan mantel wolnya yang berdebu. Dari puncak bukit kapur, menara-menara silinder kota Oakhaven menjulang tegak menembus selimut kelabu, tampak seperti jari-jari raksasa yang membatu di bawah langit fajar.
                    </p>
                    <p>
                      Di sakunya, segel perunggu itu terasa sedingin es. Tidak ada seorang pun di akademi yang tahu ia membawa dokumen itu melintasi perbatasan. Jika Lady Seraphina mendahuluinya sampai di gerbang barat, perjanjian damai yang dirintis selama satu dasawarsa akan hancur sebelum senja tiba.
                    </p>
                    <div className="p-3 my-4 rounded-md border border-primary/20 bg-primary/5 text-xs font-sans text-muted-foreground flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">AI Story Memory Context:</span>
                        <p className="mt-0.5">Kaelen memiliki janji rahasia dengan Dewan Penjaga untuk tidak membuka segel perunggu sebelum gerhana ketiga.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/60 px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/10 font-sans">
                    <span>1,820 kata • 8 menit baca</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tersimpan secara lokal (Autosave debounced)
                    </span>
                  </div>
                </Card>
              </div>

              {/* Right Column: Story Intelligence & Memories */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-border/80">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                      Story Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs space-y-2.5">
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">Segel Perunggu</span>
                        <Badge variant="outline" className="text-[9px]">Confirmed</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Peninggalan era Dinasti Pertama yang hanya bereaksi terhadap garis darah keturunan Penjaga.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">Hukum Sihir Oakhaven</span>
                        <Badge variant="outline" className="text-[9px]">World Rule</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Penggunaan alkimia transmutasi dilarang di dalam batas tembok kota sejak tahun 812.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/80">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Manuscript Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Non-destructive AI
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      AI tidak pernah menimpa teks naskah secara sepihak. Selalu disediakan opsi Accept, Insert, Replace, dan Dismiss.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "phases" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Status Rencana Implementasi</h2>
              <p className="text-sm text-muted-foreground">Pelacakan progress fase dari IMPLEMENTATION-PLAN.md</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">Phase 0 • Completed</Badge>
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Repository & Tooling Foundation</CardTitle>
                  <CardDescription className="text-xs">Next.js 15, TypeScript, Tailwind CSS, TipTap, Zod, Supabase, dan arsitektur folder modular.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Phase 1 • Next Up</Badge>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Authentication & User Profiles</CardTitle>
                  <CardDescription className="text-xs">Integrasi login, sign up, session management, dan isolasi tenant per-penulis.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Phase 2 • Planned</Badge>
                    <Layers className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Novel Library & Workspace Frame</CardTitle>
                  <CardDescription className="text-xs">Manajemen perpustakaan novel, detail metadata, dan shell ruang kerja interaktif.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Phase 3 • Planned</Badge>
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Novel Structure: Acts, Chapters, Scenes</CardTitle>
                  <CardDescription className="text-xs">Pengaturan bab, urutan scene, metadata POV karakter, dan outline cerita.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Phase 4 • Planned</Badge>
                    <Feather className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Writing Editor & Version History</CardTitle>
                  <CardDescription className="text-xs">Editor naskah TipTap dengan autosave debounced dan riwayat versi yang aman.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Phase 5 • Planned</Badge>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">Characters & Worldbuilding</CardTitle>
                  <CardDescription className="text-xs">Character bible, peta relasi antar tokoh, lokasi, dan aturan hukum dunia (world lore).</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Kepatuhan Arsitektur Sistem</h2>
              <p className="text-sm text-muted-foreground">Penerapan aturan teknis dari AGENTS.md dan docs/architecture.md</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Code2 className="w-4 h-4" />
                    Modular Monolith
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-1">
                  <p>Struktur folder berbasis fitur domain di <code className="text-foreground">src/features/*</code> mencegah ketergantungan silang yang berantakan.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <BrainCircuit className="w-4 h-4" />
                    AI Provider Agnostic
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-1">
                  <p>Interface <code className="text-foreground">AIProvider</code> di <code className="text-foreground">src/server/ai/provider.ts</code> mengisolasi API key dan SDK provider eksternal.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Manuscript Safety
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-1">
                  <p>Aturan penyimpanan lokal debounced dan pembuatan version snapshot sebelum operasi AI destructif.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/70 py-4 px-6 text-center text-xs text-muted-foreground bg-card/40">
        AI Novel Writing Workspace • Built strictly adhering to SOUL.md & AGENTS.md
      </footer>
    </main>
  );
}

import React from "react";
import Link from "next/link";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { deleteNovelAction } from "@/server/actions/novels";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterNovelsForLibrary } from "@/lib/library-search";
import {
  Plus,
  BookOpen,
  Trash2,
  FileText,
  ArrowRight,
  Search,
  SearchX,
} from "lucide-react";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireAuth();
  const { q } = await searchParams;
  const libraryQuery = q?.trim() ?? "";
  const novels = await NovelService.listUserNovels(user.id);
  const visible = filterNovelsForLibrary(novels, libraryQuery);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="text-[10px]">
              Sesi Terautentikasi
            </Badge>
            <span className="text-xs text-muted-foreground">ID Penulis: {user.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-normal text-foreground">
            Koleksi Novel, {user.displayName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kelola karya fiksi Anda, tentukan premis cerita, dan buka studio penulisan dengan Story Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/workspace/new">
            <Button className="text-xs flex items-center gap-1.5 shadow-subtle">
              <Plus className="w-4 h-4" />
              Buat Novel Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Novel Library Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Karya Aktif ({visible.length}{libraryQuery ? ` dari ${novels.length}` : ""})
          </h2>
          {novels.length > 1 && (
            <form action="/workspace" method="get" className="relative w-full sm:w-64" role="search">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                name="q"
                defaultValue={libraryQuery}
                placeholder="Cari judul, genre, premis…"
                aria-label="Cari novel di perpustakaan"
                className="h-8 pl-8 text-xs bg-card"
              />
            </form>
          )}
        </div>

        {visible.length === 0 ? (
          novels.length === 0 ? (
          /* Empty State */
          <div className="border border-dashed border-border/80 rounded-xl p-12 text-center space-y-4 bg-card/30">
            <div className="w-12 h-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-medium">Belum Ada Novel di Perpustakaan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Mulai petualangan kreatif Anda hari ini. Buat novel pertama Anda dan susun fondasi ceritanya.
              </p>
            </div>
            <Link href="/workspace/new" className="inline-block pt-2">
              <Button size="sm" className="text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Mulai Rancang Novel Pertama
              </Button>
            </Link>
          </div>
          ) : (
          /* No search results */
          <div className="border border-dashed border-border/80 rounded-xl p-12 text-center space-y-4 bg-card/30">
            <div className="w-12 h-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <SearchX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-medium">Tidak Ada Hasil</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Tidak ada novel yang cocok dengan “{libraryQuery}”. Coba kata kunci lain.
              </p>
            </div>
            <Link href="/workspace" className="inline-block pt-2">
              <Button size="sm" variant="outline" className="text-xs">
                Tampilkan Semua Novel
              </Button>
            </Link>
          </div>
          )
        ) : (
          /* Novel Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((novel) => {
              const { progressPercent, readingTimeMinutes } = NovelService.calculateStats(
                novel.word_count,
                novel.target_word_count
              );

              return (
                <Card
                  key={novel.id}
                  className="border-border/80 shadow-subtle hover:shadow-paper hover:border-primary/40 transition-all flex flex-col justify-between group"
                >
                  <CardHeader className="p-5 pb-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="accent" className="capitalize text-[10px]">
                        {novel.status.replace("_", " ")}
                      </Badge>
                      {novel.genre && (
                        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[130px]">
                          {novel.genre}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link href={`/workspace/${novel.id}`}>
                        <CardTitle className="font-serif text-lg font-medium group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
                          {novel.title}
                        </CardTitle>
                      </Link>
                      {novel.premise ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 italic font-serif leading-relaxed">
                          &ldquo;{novel.premise}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 mt-1.5 italic">
                          Belum ada premis tertulis.
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-1 pt-2 border-t border-border/40">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {novel.word_count.toLocaleString()} / {novel.target_word_count.toLocaleString()} kata
                        </span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-border/60 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 px-5 border-t border-border/40 flex items-center justify-between text-xs bg-muted/10">
                    <span className="text-[11px] text-muted-foreground">
                      ±{readingTimeMinutes} mnt baca
                    </span>

                    <div className="flex items-center gap-2">
                      <form action={deleteNovelAction}>
                        <input type="hidden" name="id" value={novel.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </form>

                      <Link href={`/workspace/${novel.id}`}>
                        <Button size="sm" variant="default" className="text-xs h-8 flex items-center gap-1">
                          Buka Studio
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

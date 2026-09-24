import { Feather } from "lucide-react";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-muted/60 ${className}`}
    />
  );
}

export default function WorkspaceLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Memuat studio">
      {/* Welcome banner skeleton */}
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-3">
        <SkeletonLine className="h-3 w-40" />
        <SkeletonLine className="h-7 w-72 max-w-full" />
        <SkeletonLine className="h-3 w-full max-w-xl" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-4">
        <SkeletonLine className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border/80 bg-card p-5 space-y-3"
            >
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="h-5 w-full" />
              <SkeletonLine className="h-3 w-4/5" />
              <SkeletonLine className="h-1 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Screen-reader status */}
      <p role="status" className="sr-only">
        <Feather className="w-4 h-4" />
        Memuat studio penulis…
      </p>
    </div>
  );
}

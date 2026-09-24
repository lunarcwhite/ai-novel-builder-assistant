-- Migration: 010_plot_threads_timeline.sql
-- Description: Creates plot_threads and timeline_events for Phase 9 (Story Intelligence).
-- Plot threads track planned/active/resolved/abandoned arcs (SOUL.md: author decides
-- resolution; the system never auto-resolves). Timeline events record story chronology
-- with flexible precision — date_value is text deliberately (fictional dates).
-- NOTE: plot_points deliberately NOT created (YAGNI — add when a feature needs it).

-- 1. Plot Threads Table
create table if not exists public.plot_threads (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    title text not null,
    description text,
    status text not null default 'planned'
        check (status in ('planned', 'active', 'resolved', 'abandoned')),
    importance smallint not null default 3
        check (importance between 1 and 5),
    introduced_chapter_id uuid
        references public.chapters(id) on delete set null,
    resolved_chapter_id uuid
        references public.chapters(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists plot_threads_novel_id_idx on public.plot_threads(novel_id);
create index if not exists plot_threads_novel_status_idx on public.plot_threads(novel_id, status);
create index if not exists plot_threads_novel_importance_idx on public.plot_threads(novel_id, importance desc);

drop trigger if exists set_plot_threads_updated_at on public.plot_threads;
create trigger set_plot_threads_updated_at
    before update on public.plot_threads
    for each row
    execute function public.handle_updated_at();

-- 2. Timeline Events Table
create table if not exists public.timeline_events (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    title text not null,
    description text,
    date_value text,
    date_precision text not null default 'unknown'
        check (date_precision in ('exact', 'day', 'month', 'year', 'relative', 'unknown')),
    relative_time text,
    chapter_id uuid
        references public.chapters(id) on delete set null,
    location_id uuid
        references public.locations(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists timeline_events_novel_id_idx on public.timeline_events(novel_id);
create index if not exists timeline_events_novel_chapter_idx on public.timeline_events(novel_id, chapter_id);
create index if not exists timeline_events_novel_created_idx on public.timeline_events(novel_id, created_at);

drop trigger if exists set_timeline_events_updated_at on public.timeline_events;
create trigger set_timeline_events_updated_at
    before update on public.timeline_events
    for each row
    execute function public.handle_updated_at();

-- 3. Row Level Security: ownership via novels -> user (AGENTS.md Rule 5.3)
alter table public.plot_threads enable row level security;
alter table public.timeline_events enable row level security;

drop policy if exists "Users can manage plot threads of own novels" on public.plot_threads;
create policy "Users can manage plot threads of own novels"
on public.plot_threads for all
using (exists (select 1 from public.novels where id = plot_threads.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = plot_threads.novel_id and user_id = auth.uid()));

drop policy if exists "Users can manage timeline events of own novels" on public.timeline_events;
create policy "Users can manage timeline events of own novels"
on public.timeline_events for all
using (exists (select 1 from public.novels where id = timeline_events.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = timeline_events.novel_id and user_id = auth.uid()));

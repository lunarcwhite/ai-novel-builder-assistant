-- Migration: 003_acts_chapters_scenes.sql
-- Description: Creates acts, chapters, and scenes tables with hierarchy, status checks, and indexes

-- 1. Acts Table (Babak Cerita)
create table if not exists public.acts (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    title text not null,
    description text,
    position integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists acts_novel_id_idx on public.acts(novel_id);
create index if not exists acts_order_idx on public.acts(novel_id, position);

drop trigger if exists set_acts_updated_at on public.acts;
create trigger set_acts_updated_at
    before update on public.acts
    for each row
    execute function public.handle_updated_at();

-- 2. Chapters Table (Bab Cerita)
create table if not exists public.chapters (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    act_id uuid references public.acts(id) on delete set null,
    title text not null,
    summary text,
    objective text,
    conflict text,
    emotional_beat text,
    outcome text,
    position integer not null,
    status text not null default 'planned' check (status in ('planned', 'draft', 'in_progress', 'completed', 'revising')),
    word_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists chapters_novel_id_idx on public.chapters(novel_id);
create index if not exists chapters_act_id_idx on public.chapters(act_id);
create index if not exists chapters_order_idx on public.chapters(novel_id, position);

drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at
    before update on public.chapters
    for each row
    execute function public.handle_updated_at();

-- 3. Scenes Table (Adegan Naskah)
create table if not exists public.scenes (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    chapter_id uuid not null references public.chapters(id) on delete cascade,
    title text not null,
    summary text,
    purpose text,
    pov_character_id uuid, -- Reference added in Phase 5
    location_id uuid,      -- Reference added in Phase 5
    position integer not null,
    status text not null default 'planned' check (status in ('planned', 'draft', 'in_progress', 'completed', 'revising')),
    content text,
    word_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists scenes_novel_id_idx on public.scenes(novel_id);
create index if not exists scenes_chapter_id_idx on public.scenes(chapter_id);
create index if not exists scenes_order_idx on public.scenes(chapter_id, position);

drop trigger if exists set_scenes_updated_at on public.scenes;
create trigger set_scenes_updated_at
    before update on public.scenes
    for each row
    execute function public.handle_updated_at();

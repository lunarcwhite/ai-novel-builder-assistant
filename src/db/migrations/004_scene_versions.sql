-- Migration: 004_scene_versions.sql
-- Description: Creates scene_versions table for manuscript snapshots, history, and recovery

create table if not exists public.scene_versions (
    id uuid primary key default gen_random_uuid(),
    scene_id uuid not null references public.scenes(id) on delete cascade,
    version_number integer not null,
    title text,
    content text not null,
    word_count integer not null default 0,
    created_by uuid references public.user_profiles(id) on delete set null,
    change_type text not null default 'manual' check (change_type in ('manual', 'ai_insert', 'ai_replace', 'restore', 'import', 'checkpoint')),
    notes text,
    created_at timestamptz not null default now(),
    unique (scene_id, version_number)
);

create index if not exists scene_versions_scene_id_idx on public.scene_versions(scene_id);
create index if not exists scene_versions_created_at_idx on public.scene_versions(created_at desc);

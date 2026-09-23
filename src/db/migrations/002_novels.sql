-- Migration: 002_novels.sql
-- Description: Creates novels table with tenant ownership and indexes

create table if not exists public.novels (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    slug text not null,
    genre text,
    status text not null default 'planning' check (status in ('planning', 'in_progress', 'first_draft', 'revising', 'completed', 'archived')),
    premise text,
    theme text,
    tone text,
    target_audience text,
    description text,
    word_count integer not null default 0,
    target_word_count integer not null default 50000,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, slug)
);

-- Indexes for efficient querying by user, status, and latest update
create index if not exists novels_user_id_idx on public.novels(user_id);
create index if not exists novels_status_idx on public.novels(status);
create index if not exists novels_updated_at_idx on public.novels(updated_at desc);

-- Trigger to automatically update updated_at timestamp
drop trigger if exists set_novels_updated_at on public.novels;
create trigger set_novels_updated_at
    before update on public.novels
    for each row
    execute function public.handle_updated_at();

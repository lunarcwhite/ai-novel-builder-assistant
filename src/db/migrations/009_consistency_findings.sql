-- Migration: 009_consistency_findings.sql
-- Description: Creates consistency_findings for Phase 8 (Consistency Engine).
-- Findings are tentative observations with evidence (source A / source B),
-- never verdicts. Read-only against the manuscript: the checker never
-- writes to scenes. Timeline/plot types are reserved for Phase 9+.

-- NOTE: Postgres CREATE TYPE has no IF NOT EXISTS clause; guard via
-- duplicate_object so the migration is safely re-runnable.
DO $$ BEGIN
  create type consistency_severity as enum ('potential', 'notable', 'high_attention');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type consistency_status as enum ('open', 'reviewed', 'dismissed', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.consistency_findings (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    type text not null check (type in ('character_contradiction', 'timeline_inconsistency', 'lore_conflict', 'plot_hole')),
    severity consistency_severity not null default 'potential',
    description text not null,
    status consistency_status not null default 'open',
    source_ids jsonb not null default '[]'::jsonb,
    related_entity_ids jsonb not null default '[]'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists consistency_findings_novel_id_idx on public.consistency_findings(novel_id);
create index if not exists consistency_findings_novel_status_idx on public.consistency_findings(novel_id, status);
create index if not exists consistency_findings_novel_type_idx on public.consistency_findings(novel_id, type);

drop trigger if exists set_consistency_findings_updated_at on public.consistency_findings;
create trigger set_consistency_findings_updated_at
    before update on public.consistency_findings
    for each row
    execute function public.handle_updated_at();

-- Row Level Security: ownership via novels -> user (AGENTS.md Rule 5.3)
alter table public.consistency_findings enable row level security;

drop policy if exists "Users can manage findings of own novels" on public.consistency_findings;
create policy "Users can manage findings of own novels"
on public.consistency_findings for all
using (exists (select 1 from public.novels where id = consistency_findings.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = consistency_findings.novel_id and user_id = auth.uid()));

-- Migration: 007_rls.sql
-- Description: Enables Row Level Security and ownership policies for all story tables.
-- Run AFTER 001-006 in Supabase SQL Editor.
-- Prinsip: setiap entity harus terjangkau via novel -> user (AGENTS.md Rule 5.3).

create extension if not exists pgcrypto;

-- 1. Enable RLS on all public story tables
alter table public.user_profiles enable row level security;
alter table public.novels enable row level security;
alter table public.acts enable row level security;
alter table public.chapters enable row level security;
alter table public.scenes enable row level security;
alter table public.scene_versions enable row level security;
alter table public.characters enable row level security;
alter table public.character_relationships enable row level security;
alter table public.locations enable row level security;
alter table public.world_rules enable row level security;
alter table public.world_lore enable row level security;
alter table public.scene_characters enable row level security;
alter table public.story_memories enable row level security;

-- 2. user_profiles: user hanya bisa kelola profil sendiri
drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
on public.user_profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles for update
using (auth.uid() = id);

-- 3. novels: pemilik penuh
drop policy if exists "Users can manage own novels" on public.novels;
create policy "Users can manage own novels"
on public.novels for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. Tabel anak yang punya novel_id langsung
-- acts
drop policy if exists "Users can manage acts of own novels" on public.acts;
create policy "Users can manage acts of own novels"
on public.acts for all
using (exists (select 1 from public.novels where id = acts.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = acts.novel_id and user_id = auth.uid()));

-- chapters
drop policy if exists "Users can manage chapters of own novels" on public.chapters;
create policy "Users can manage chapters of own novels"
on public.chapters for all
using (exists (select 1 from public.novels where id = chapters.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = chapters.novel_id and user_id = auth.uid()));

-- scenes
drop policy if exists "Users can manage scenes of own novels" on public.scenes;
create policy "Users can manage scenes of own novels"
on public.scenes for all
using (exists (select 1 from public.novels where id = scenes.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = scenes.novel_id and user_id = auth.uid()));

-- characters
drop policy if exists "Users can manage characters of own novels" on public.characters;
create policy "Users can manage characters of own novels"
on public.characters for all
using (exists (select 1 from public.novels where id = characters.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = characters.novel_id and user_id = auth.uid()));

-- character_relationships
drop policy if exists "Users can manage relationships of own novels" on public.character_relationships;
create policy "Users can manage relationships of own novels"
on public.character_relationships for all
using (exists (select 1 from public.novels where id = character_relationships.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = character_relationships.novel_id and user_id = auth.uid()));

-- locations
drop policy if exists "Users can manage locations of own novels" on public.locations;
create policy "Users can manage locations of own novels"
on public.locations for all
using (exists (select 1 from public.novels where id = locations.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = locations.novel_id and user_id = auth.uid()));

-- world_rules
drop policy if exists "Users can manage world rules of own novels" on public.world_rules;
create policy "Users can manage world rules of own novels"
on public.world_rules for all
using (exists (select 1 from public.novels where id = world_rules.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = world_rules.novel_id and user_id = auth.uid()));

-- world_lore
drop policy if exists "Users can manage world lore of own novels" on public.world_lore;
create policy "Users can manage world lore of own novels"
on public.world_lore for all
using (exists (select 1 from public.novels where id = world_lore.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = world_lore.novel_id and user_id = auth.uid()));

-- scene_characters
drop policy if exists "Users can manage scene characters of own novels" on public.scene_characters;
create policy "Users can manage scene characters of own novels"
on public.scene_characters for all
using (exists (select 1 from public.novels where id = scene_characters.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = scene_characters.novel_id and user_id = auth.uid()));

-- story_memories
drop policy if exists "Users can manage memories of own novels" on public.story_memories;
create policy "Users can manage memories of own novels"
on public.story_memories for all
using (exists (select 1 from public.novels where id = story_memories.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = story_memories.novel_id and user_id = auth.uid()));

-- 5. scene_versions: otorisasi via scenes -> novels (tidak punya novel_id langsung)
drop policy if exists "Users can manage versions of own scenes" on public.scene_versions;
create policy "Users can manage versions of own scenes"
on public.scene_versions for all
using (
  exists (
    select 1 from public.scenes s
    join public.novels n on n.id = s.novel_id
    where s.id = scene_versions.scene_id and n.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.scenes s
    join public.novels n on n.id = s.novel_id
    where s.id = scene_versions.scene_id and n.user_id = auth.uid()
  )
);

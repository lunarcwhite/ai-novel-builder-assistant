-- Migration: 005_characters_and_world.sql
-- Description: Creates characters, character_relationships, locations, world_rules, world_lore, and scene_characters tables

-- 1. Characters Table
create table if not exists public.characters (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    name text not null,
    role text not null default 'supporting' check (role in ('protagonist', 'antagonist', 'deuteragonist', 'supporting', 'minor')),
    age text,
    occupation text,
    description text,
    personality text,
    motivation text,
    goal text,
    fear text,
    strengths text,
    weaknesses text,
    secret text,
    backstory text,
    character_arc text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists characters_novel_id_idx on public.characters(novel_id);
create index if not exists characters_name_idx on public.characters(novel_id, name);
create index if not exists characters_role_idx on public.characters(novel_id, role);

drop trigger if exists set_characters_updated_at on public.characters;
create trigger set_characters_updated_at
    before update on public.characters
    for each row
    execute function public.handle_updated_at();

-- 2. Character Relationships Table
create table if not exists public.character_relationships (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    from_character_id uuid not null references public.characters(id) on delete cascade,
    to_character_id uuid not null references public.characters(id) on delete cascade,
    relationship_type text not null check (relationship_type in ('ally', 'rival', 'enemy', 'mentor', 'family', 'love_interest', 'friend', 'custom')),
    description text,
    history text,
    current_state text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (from_character_id <> to_character_id),
    unique (novel_id, from_character_id, to_character_id, relationship_type)
);

create index if not exists character_relationships_novel_idx on public.character_relationships(novel_id);
create index if not exists character_relationships_from_idx on public.character_relationships(from_character_id);
create index if not exists character_relationships_to_idx on public.character_relationships(to_character_id);

drop trigger if exists set_character_relationships_updated_at on public.character_relationships;
create trigger set_character_relationships_updated_at
    before update on public.character_relationships
    for each row
    execute function public.handle_updated_at();

-- 3. Locations Table
create table if not exists public.locations (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    name text not null,
    description text,
    geography text,
    atmosphere text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists locations_novel_id_idx on public.locations(novel_id);
create index if not exists locations_name_idx on public.locations(novel_id, name);

drop trigger if exists set_locations_updated_at on public.locations;
create trigger set_locations_updated_at
    before update on public.locations
    for each row
    execute function public.handle_updated_at();

-- 4. World Rules Table
create table if not exists public.world_rules (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    title text not null,
    rule text not null,
    description text,
    importance smallint not null default 3 check (importance between 1 and 5),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists world_rules_novel_id_idx on public.world_rules(novel_id);
create index if not exists world_rules_importance_idx on public.world_rules(novel_id, importance desc);

drop trigger if exists set_world_rules_updated_at on public.world_rules;
create trigger set_world_rules_updated_at
    before update on public.world_rules
    for each row
    execute function public.handle_updated_at();

-- 5. World Lore Table
create table if not exists public.world_lore (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    category text not null default 'general',
    title text not null,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists world_lore_novel_id_idx on public.world_lore(novel_id);
create index if not exists world_lore_category_idx on public.world_lore(novel_id, category);

drop trigger if exists set_world_lore_updated_at on public.world_lore;
create trigger set_world_lore_updated_at
    before update on public.world_lore
    for each row
    execute function public.handle_updated_at();

-- 6. Scene Characters Join Table (Characters Involved in Scene)
create table if not exists public.scene_characters (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    scene_id uuid not null references public.scenes(id) on delete cascade,
    character_id uuid not null references public.characters(id) on delete cascade,
    role_in_scene text default 'present',
    created_at timestamptz not null default now(),
    unique (scene_id, character_id)
);

create index if not exists scene_characters_novel_idx on public.scene_characters(novel_id);
create index if not exists scene_characters_scene_idx on public.scene_characters(scene_id);
create index if not exists scene_characters_character_idx on public.scene_characters(character_id);

-- 7. Add Foreign Key constraints to scenes table safely
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'fk_scenes_pov_character'
    ) then
        alter table public.scenes
            add constraint fk_scenes_pov_character
            foreign key (pov_character_id) references public.characters(id) on delete set null;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_scenes_location'
    ) then
        alter table public.scenes
            add constraint fk_scenes_location
            foreign key (location_id) references public.locations(id) on delete set null;
    end if;
end $$;

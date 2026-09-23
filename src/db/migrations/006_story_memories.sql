-- Migration: 006_story_memories.sql
-- Description: Creates story_memories table with pgvector support, indexes, triggers, and match RPC function

-- 1. Conditionally enable pgvector extension if supported
create extension if not exists vector;

-- 2. Story Memories Table
create table if not exists public.story_memories (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    type text not null check (type in ('character_fact', 'relationship_fact', 'world_fact', 'timeline_fact', 'plot_fact', 'story_fact')),
    content text not null,
    importance smallint not null default 3 check (importance between 1 and 5),
    status text not null default 'proposed' check (status in ('proposed', 'confirmed', 'rejected', 'archived')),
    source_type text not null default 'manual' check (source_type in ('manual', 'scene', 'chapter', 'character', 'world_rule', 'timeline_event', 'ai_extraction')),
    source_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    embedding vector(1536),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Indexes for filtered relational retrieval and sorting
create index if not exists story_memories_novel_id_idx on public.story_memories(novel_id);
create index if not exists story_memories_type_idx on public.story_memories(novel_id, type);
create index if not exists story_memories_status_idx on public.story_memories(novel_id, status);
create index if not exists story_memories_importance_idx on public.story_memories(novel_id, importance desc);
create index if not exists story_memories_source_idx on public.story_memories(source_type, source_id);

-- 4. Vector HNSW Index (Conditional on vector extension support)
do $$
begin
    if exists (select 1 from pg_type where typname = 'vector') then
        create index if not exists story_memories_embedding_idx
        on public.story_memories
        using hnsw (embedding vector_cosine_ops);
    end if;
exception when others then
    -- Fallback silently if hnsw is unavailable on this postgres distribution
    null;
end $$;

-- 5. Updated_at Trigger
drop trigger if exists set_story_memories_updated_at on public.story_memories;
create trigger set_story_memories_updated_at
    before update on public.story_memories
    for each row
    execute function public.handle_updated_at();

-- 6. RPC function for semantic similarity retrieval with metadata filters
create or replace function public.match_story_memories (
    query_novel_id uuid,
    query_embedding vector(1536),
    match_threshold float default 0.6,
    match_count int default 10,
    filter_types text[] default null,
    filter_statuses text[] default null
)
returns table (
    id uuid,
    novel_id uuid,
    type text,
    content text,
    importance smallint,
    status text,
    source_type text,
    source_id uuid,
    metadata jsonb,
    similarity float,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
as $$
begin
    return query
    select
        sm.id,
        sm.novel_id,
        sm.type,
        sm.content,
        sm.importance,
        sm.status,
        sm.source_type,
        sm.source_id,
        sm.metadata,
        1 - (sm.embedding <=> query_embedding) as similarity,
        sm.created_at,
        sm.updated_at
    from public.story_memories sm
    where sm.novel_id = query_novel_id
      and (sm.embedding is not null)
      and (1 - (sm.embedding <=> query_embedding)) >= match_threshold
      and (filter_types is null or sm.type = any(filter_types))
      and (filter_statuses is null or sm.status = any(filter_statuses))
    order by similarity desc
    limit match_count;
end;
$$;

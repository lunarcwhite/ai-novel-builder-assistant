-- Migration: 008_ai_assistant.sql
-- Description: Creates ai_conversations, ai_messages, and ai_usage_logs tables
-- for Phase 7 (AI Assistant). Manuscript is never written by AI directly;
-- suggestions are stored as messages and applied only via explicit user action.

-- 1. AI Conversations Table (one thread, bound to a novel)
create table if not exists public.ai_conversations (
    id uuid primary key default gen_random_uuid(),
    novel_id uuid not null references public.novels(id) on delete cascade,
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    title text,
    context jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_novel_id_idx on public.ai_conversations(novel_id);
create index if not exists ai_conversations_user_idx on public.ai_conversations(user_id);
create index if not exists ai_conversations_updated_idx on public.ai_conversations(novel_id, updated_at desc);

drop trigger if exists set_ai_conversations_updated_at on public.ai_conversations;
create trigger set_ai_conversations_updated_at
    before update on public.ai_conversations
    for each row
    execute function public.handle_updated_at();

-- 2. AI Messages Table (prompt + response history per conversation)
create table if not exists public.ai_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
    role text not null check (role in ('system', 'user', 'assistant')),
    content text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_id_idx on public.ai_messages(conversation_id);
create index if not exists ai_messages_created_idx on public.ai_messages(conversation_id, created_at);

-- 3. AI Usage Logs Table (cost monitoring — metadata only, never manuscript)
create table if not exists public.ai_usage_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    novel_id uuid references public.novels(id) on delete cascade,
    provider text not null,
    model text not null,
    operation text not null,
    input_tokens integer not null default 0,
    output_tokens integer not null default 0,
    estimated_cost numeric(12, 6),
    latency_ms integer,
    status text not null,
    created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_idx on public.ai_usage_logs(user_id, created_at desc);
create index if not exists ai_usage_logs_novel_idx on public.ai_usage_logs(novel_id, created_at desc);

-- 4. Row Level Security (ownership via novels -> user; usage via user_id)
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage_logs enable row level security;

drop policy if exists "Users can manage AI conversations of own novels" on public.ai_conversations;
create policy "Users can manage AI conversations of own novels"
on public.ai_conversations for all
using (exists (select 1 from public.novels where id = ai_conversations.novel_id and user_id = auth.uid()))
with check (exists (select 1 from public.novels where id = ai_conversations.novel_id and user_id = auth.uid()));

drop policy if exists "Users can manage AI messages of own novels" on public.ai_messages;
create policy "Users can manage AI messages of own novels"
on public.ai_messages for all
using (
  exists (
    select 1 from public.ai_conversations c
    join public.novels n on n.id = c.novel_id
    where c.id = ai_messages.conversation_id and n.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.ai_conversations c
    join public.novels n on n.id = c.novel_id
    where c.id = ai_messages.conversation_id and n.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own AI usage" on public.ai_usage_logs;
create policy "Users can view own AI usage"
on public.ai_usage_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

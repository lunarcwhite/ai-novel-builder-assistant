# DATABASE-SCHEMA.md — AI Novel Writing Workspace

**Status:** Draft  
**Version:** 0.1  
**Related:** `prd.md`, `design.md`, `architecture.md`

---

# 1. Database Strategy

Database utama:

```text
PostgreSQL
+
pgvector
```

Prinsip:

1. relational data menjadi source of truth;
2. vector data hanya digunakan untuk retrieval;
3. setiap AI-generated knowledge memiliki source;
4. manuscript dan structured story data dipisahkan;
5. seluruh entity story selalu terikat pada `novel_id`;
6. ownership diverifikasi melalui `user_id`;
7. soft delete hanya digunakan pada entity yang membutuhkan recovery;
8. foreign key digunakan secara eksplisit.

---

# 2. Entity Overview

```text
users
 │
 └── user_profiles
 │
 └── novels
      │
      ├── acts
      │    └── chapters
      │         └── scenes
      │              └── scene_versions
      │
      ├── characters
      │    └── character_relationships
      │
      ├── locations
      ├── factions
      ├── world_rules
      ├── world_lore
      │
      ├── plot_threads
      ├── plot_points
      │
      ├── timeline_events
      │
      ├── story_memories
      │
      ├── consistency_findings
      │
      ├── ai_conversations
      │    └── ai_messages
      │
      └── ai_usage_logs
```

---

# 3. Conventions

## Primary Key

Gunakan UUID:

```sql
uuid
```

Recommended:

```sql
gen_random_uuid()
```

Keuntungan:

- aman untuk distributed systems;
- tidak mengekspos jumlah record;
- cocok untuk future collaboration;
- mudah digunakan di client.

---

## Timestamp

Semua tabel utama:

```text
created_at timestamptz
updated_at timestamptz
```

Gunakan UTC di database.

---

## Naming

Database menggunakan:

```text
snake_case
```

Contoh:

```text
character_relationships
story_memories
timeline_events
```

---

# 4. PostgreSQL Extensions

Required:

```sql
create extension if not exists pgcrypto;
create extension if not exists vector;
```

---

# 5. Enums

Gunakan PostgreSQL enum hanya untuk status yang relatif stabil.

Untuk domain yang mungkin sering berkembang, gunakan varchar + application validation.

---

## novel_status

```sql
planning
writing
revising
completed
archived
```

---

## chapter_status

```sql
planned
draft
in_progress
completed
revising
```

---

## scene_status

```sql
planned
draft
in_progress
completed
revising
```

---

## memory_type

```sql
character_fact
relationship_fact
world_fact
timeline_fact
plot_fact
story_fact
```

---

## memory_status

```sql
proposed
confirmed
rejected
archived
```

---

## plot_thread_status

```sql
planned
active
resolved
abandoned
```

---

## plot_point_type

```sql
inciting_incident
turning_point
midpoint
climax
resolution
revelation
custom
```

---

## timeline_precision

```sql
exact
day
month
year
relative
unknown
```

---

## consistency_severity

```sql
potential
notable
high_attention
```

---

## consistency_status

```sql
open
reviewed
dismissed
resolved
```

---

## ai_message_role

```sql
system
user
assistant
```

---

# 6. User Profile

Authentication provider manages the primary identity.

Application-specific profile:

```sql
create table user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

If Auth.js is used instead of Supabase Auth, replace the reference with the application's `users` table.

---

# 7. Novels

```sql
create table novels (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    title text not null,
    slug text not null,

    genre text,
    status novel_status not null default 'planning',

    premise text,
    theme text,
    tone text,
    target_audience text,
    description text,

    word_count integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, slug)
);
```

Indexes:

```sql
create index novels_user_id_idx
    on novels(user_id);

create index novels_status_idx
    on novels(status);

create index novels_updated_at_idx
    on novels(updated_at desc);
```

---

# 8. Acts

```sql
create table acts (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    title text not null,
    description text,

    position integer not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (novel_id, position)
);
```

Index:

```sql
create index acts_novel_id_idx
    on acts(novel_id);
```

---

# 9. Chapters

```sql
create table chapters (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    act_id uuid
        references acts(id) on delete set null,

    title text not null,

    summary text,
    objective text,
    conflict text,
    emotional_beat text,
    outcome text,

    position integer not null,

    status chapter_status not null default 'planned',

    word_count integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create index chapters_novel_id_idx
    on chapters(novel_id);

create index chapters_act_id_idx
    on chapters(act_id);

create index chapters_order_idx
    on chapters(novel_id, position);
```

---

# 10. Scenes

```sql
create table scenes (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    chapter_id uuid not null
        references chapters(id) on delete cascade,

    title text not null,

    summary text,
    purpose text,

    pov_character_id uuid
        references characters(id) on delete set null,

    location_id uuid
        references locations(id) on delete set null,

    position integer not null,

    status scene_status not null default 'planned',

    content text,

    word_count integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (chapter_id, position)
);
```

Note:

Foreign keys to `characters` and `locations` are declared after those tables are created, or added later using `alter table`.

Indexes:

```sql
create index scenes_novel_id_idx
    on scenes(novel_id);

create index scenes_chapter_id_idx
    on scenes(chapter_id);

create index scenes_pov_character_id_idx
    on scenes(pov_character_id);

create index scenes_location_id_idx
    on scenes(location_id);

create index scenes_order_idx
    on scenes(chapter_id, position);
```

---

# 11. Characters

```sql
create table characters (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    name text not null,

    role text,
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
```

Indexes:

```sql
create index characters_novel_id_idx
    on characters(novel_id);

create index characters_name_idx
    on characters(novel_id, name);
```

---

# 12. Character Relationships

```sql
create table character_relationships (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    from_character_id uuid not null
        references characters(id) on delete cascade,

    to_character_id uuid not null
        references characters(id) on delete cascade,

    relationship_type text not null,

    description text,
    history text,
    current_state text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (from_character_id <> to_character_id),

    unique (
        novel_id,
        from_character_id,
        to_character_id,
        relationship_type
    )
);
```

Indexes:

```sql
create index character_relationships_from_idx
    on character_relationships(from_character_id);

create index character_relationships_to_idx
    on character_relationships(to_character_id);

create index character_relationships_novel_idx
    on character_relationships(novel_id);
```

---

# 13. Locations

```sql
create table locations (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    name text not null,

    description text,
    geography text,
    atmosphere text,
    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create index locations_novel_id_idx
    on locations(novel_id);

create index locations_name_idx
    on locations(novel_id, name);
```

---

# 14. Factions

```sql
create table factions (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    name text not null,

    description text,
    purpose text,

    leader_character_id uuid
        references characters(id) on delete set null,

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 15. World Rules

```sql
create table world_rules (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    title text not null,
    rule text not null,

    description text,

    importance smallint not null default 3
        check (importance between 1 and 5),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Indexes:

```sql
create index world_rules_novel_id_idx
    on world_rules(novel_id);
```

---

# 16. World Lore

```sql
create table world_lore (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    category text not null,

    title text not null,
    content text not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 17. Plot Threads

```sql
create table plot_threads (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    title text not null,
    description text,

    status plot_thread_status not null default 'planned',

    importance smallint not null default 3
        check (importance between 1 and 5),

    introduced_chapter_id uuid
        references chapters(id) on delete set null,

    resolved_chapter_id uuid
        references chapters(id) on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 18. Plot Points

```sql
create table plot_points (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    act_id uuid
        references acts(id) on delete set null,

    chapter_id uuid
        references chapters(id) on delete set null,

    title text not null,
    description text,

    type plot_point_type not null default 'custom',

    position integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 19. Timeline Events

Fictional stories may use exact dates, relative time, or no dates.

```sql
create table timeline_events (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    title text not null,
    description text,

    date_value text,
    date_precision timeline_precision not null default 'unknown',

    relative_time text,

    chapter_id uuid
        references chapters(id) on delete set null,

    location_id uuid
        references locations(id) on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

`date_value` sengaja berupa text karena cerita tidak selalu menggunakan Gregorian dates.

---

# 20. Story Memories

Ini adalah salah satu tabel terpenting.

```sql
create table story_memories (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    type memory_type not null,

    content text not null,

    importance smallint not null default 3
        check (importance between 1 and 5),

    status memory_status not null default 'proposed',

    source_type text,
    source_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    embedding vector(1536),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Catatan:

`vector(1536)` harus disesuaikan dengan embedding model yang dipilih.

Jangan mengunci ukuran embedding sebelum provider/model final dipilih.

---

# 21. Story Memory Metadata

Contoh:

```json
{
  "character_ids": [
    "uuid"
  ],
  "location_ids": [
    "uuid"
  ],
  "chapter_number": 12,
  "confidence": 0.94
}
```

Metadata berguna untuk filtered retrieval.

---

# 22. Vector Index

Jika menggunakan cosine similarity:

```sql
create index story_memories_embedding_idx
on story_memories
using hnsw (embedding vector_cosine_ops);
```

HNSW cocok untuk retrieval cepat.

Namun index sebaiknya dibuat setelah volume data cukup atau setelah benchmark awal.

---

# 23. Scene Versions

```sql
create table scene_versions (
    id uuid primary key default gen_random_uuid(),

    scene_id uuid not null
        references scenes(id) on delete cascade,

    version_number integer not null,

    content text not null,

    word_count integer not null default 0,

    created_by uuid,

    change_type text not null default 'manual',

    created_at timestamptz not null default now(),

    unique (scene_id, version_number)
);
```

`change_type`:

```text
manual
ai_insert
ai_replace
restore
import
```

---

# 24. AI Conversations

Conversation terikat ke novel.

```sql
create table ai_conversations (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

    user_id uuid not null,

    title text,

    context jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Context contoh:

```json
{
  "chapter_id": "...",
  "scene_id": "...",
  "selected_text": true
}
```

---

# 25. AI Messages

```sql
create table ai_messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references ai_conversations(id) on delete cascade,

    role ai_message_role not null,

    content text not null,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);
```

Metadata dapat menyimpan:

```json
{
  "operation": "continue_scene",
  "model": "model-name",
  "input_tokens": 1200,
  "output_tokens": 600
}
```

---

# 26. Consistency Findings

Implemented in `src/db/migrations/009_consistency_findings.sql` (Phase 8).
Findings are tentative observations with evidence, never verdicts.
The checker is read-only against the manuscript.

```sql
create type consistency_severity as enum ('potential', 'notable', 'high_attention');
create type consistency_status as enum ('open', 'reviewed', 'dismissed', 'resolved');

create table consistency_findings (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references novels(id) on delete cascade,

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

create index consistency_findings_novel_id_idx on consistency_findings(novel_id);
create index consistency_findings_novel_status_idx on consistency_findings(novel_id, status);
create index consistency_findings_novel_type_idx on consistency_findings(novel_id, type);
```

Trigger `set_consistency_findings_updated_at` memakai `handle_updated_at()`.
RLS: `Users can manage findings of own novels` (ownership via `novels.user_id`).

`type` `timeline_inconsistency` / `plot_hole` dicadangkan untuk Phase 9+
(belum ada tabel timeline/plot) — checker Phase 8 hanya menghasilkan
`character_contradiction` + `lore_conflict`.

Contoh:

```json
{
  "source_ids": [
    {
      "type": "chapter",
      "id": "uuid"
    },
    {
      "type": "world_rule",
      "id": "uuid"
    }
  ]
}
```

---

# 27. AI Usage Logs

Untuk cost monitoring:

```sql
create table ai_usage_logs (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,
    novel_id uuid,

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
```

Indexes:

```sql
create index ai_usage_logs_user_idx
    on ai_usage_logs(user_id, created_at desc);

create index ai_usage_logs_novel_idx
    on ai_usage_logs(novel_id, created_at desc);
```

---

# 28. Optional: Manuscript Documents

Untuk MVP, scene content cukup disimpan di `scenes.content`.

Jika editor berkembang menjadi document-centric architecture, tambahkan:

```sql
documents
document_blocks
```

Jangan menambah ini sebelum kebutuhan benar-benar muncul.

---

# 29. Entity Ownership

Semua entity story harus mempunyai:

```text
novel_id
```

Contoh:

```text
characters.novel_id
locations.novel_id
chapters.novel_id
story_memories.novel_id
```

Hal ini membuat authorization lebih mudah.

---

# 30. Ownership Verification

Query tidak boleh:

```sql
select *
from chapters
where id = :chapter_id;
```

Tanpa ownership verification.

Gunakan:

```sql
select c.*
from chapters c
join novels n
    on n.id = c.novel_id
where c.id = :chapter_id
and n.user_id = :user_id;
```

Atau implementasikan ownership check di service/repository layer.

---

# 31. Row Level Security

Jika menggunakan Supabase, aktifkan RLS.

Contoh konsep:

```sql
create policy "Users can access their novels"
on novels
for all
using (
    auth.uid() = user_id
);
```

Untuk child entities:

```text
scene
 → chapter
 → novel
 → user
```

Policy harus memastikan parent novel dimiliki user.

---

# 32. Updated At Trigger

Daripada mengatur `updated_at` manual di setiap query, gunakan trigger.

Concept:

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
```

Apply ke tabel yang relevan.

---

# 33. Word Count

Jangan menjadikan `word_count` sebagai source of truth.

Source of truth:

```text
scene.content
```

`word_count` adalah cached value.

Flow:

```text
Content changed
     ↓
calculate word count
     ↓
update scenes.word_count
     ↓
aggregate chapter
     ↓
aggregate novel
```

---

# 34. Novel Word Count

Jangan update novel word count melalui setiap keystroke.

Gunakan:

```text
scene update
    ↓
debounced persistence
    ↓
background / server calculation
    ↓
novel word count
```

MVP dapat menggunakan query aggregate ketika diperlukan.

---

# 35. Deletion Strategy

### Novel

```text
ON DELETE CASCADE
```

Semua story entity ikut terhapus.

Namun UI harus meminta confirmation.

### Scene

Versions ikut terhapus:

```text
scene
 ↓
scene_versions
```

### Character

References seperti POV dapat:

```text
ON DELETE SET NULL
```

karena scene tidak boleh ikut terhapus hanya karena karakter dihapus.

---

# 36. Cross-Novel Integrity

Database tidak cukup hanya memastikan:

```text
character_id exists
```

Kita juga harus memastikan character berada pada novel yang sama.

Contoh:

```text
Scene belongs to Novel A
Character belongs to Novel B
```

Tidak boleh terjadi.

Implementasi:

1. service validation;
2. transaction;
3. composite foreign keys bila diperlukan untuk critical relations.

MVP menggunakan service validation terlebih dahulu.

---

# 37. Transaction Boundaries

Contoh:

Create chapter:

```text
BEGIN

create chapter

create default scene

create initial version

COMMIT
```

Create AI replacement:

```text
BEGIN

create scene version

update scene content

COMMIT
```

Jika salah satu gagal, semua rollback.

---

# 38. Recommended Migration Order

Urutan migration:

```text
001_extensions
002_user_profiles
003_novels
004_acts
005_characters
006_locations
007_chapters
008_scenes
009_character_relationships
010_factions
011_world_rules
012_world_lore
013_plot_threads
014_plot_points
015_timeline_events
016_scene_versions
017_story_memories
018_ai_conversations
019_ai_messages
020_consistency_findings
021_ai_usage_logs
022_indexes
023_triggers
024_rls
```

Catatan:

Jika foreign key membuat circular dependency, pecah constraint menjadi migration berikutnya.

---

# 39. ERD

```text
USER
 │
 ▼
NOVEL
 │
 ├───────────────┐
 │               │
 ▼               ▼
ACT            CHARACTER
 │               │
 ▼               ├──────────────┐
CHAPTER          │              │
 │               ▼              ▼
 ▼          RELATIONSHIP      SCENE
SCENE                         │
 │                            │
 ├──────────────┐             ▼
 │              │        SCENE_VERSION
 ▼              ▼
CHARACTER     LOCATION


NOVEL
 │
 ├── WORLD_RULE
 ├── WORLD_LORE
 ├── FACTION
 ├── PLOT_THREAD
 ├── PLOT_POINT
 ├── TIMELINE_EVENT
 ├── STORY_MEMORY
 ├── CONSISTENCY_FINDING
 │
 └── AI_CONVERSATION
          │
          ▼
      AI_MESSAGE
```

---

# 40. Story Memory Retrieval Query

Conceptual query:

```sql
select
    id,
    content,
    type,
    importance,
    1 - (embedding <=> :query_embedding) as similarity
from story_memories
where novel_id = :novel_id
  and status = 'confirmed'
order by embedding <=> :query_embedding
limit 20;
```

Kemudian application layer melakukan reranking.

---

# 41. Hybrid Retrieval

Jangan hanya menggunakan vector similarity.

Flow:

```text
                    Query
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
       Vector Search       Keyword Search
            │                   │
            └─────────┬─────────┘
                      ▼
                 Merge Results
                      │
                      ▼
                    Rank
                      │
                      ▼
                Context Builder
```

---

# 42. Memory Deduplication

Ketika AI mengusulkan memory baru:

```text
New Candidate
      ↓
Vector Search Existing Memories
      ↓
Similar Memory?
      │
   ┌──┴──┐
   │     │
  Yes    No
   │     │
Compare  Create
   │     proposed
   ▼
Update / Reject
```

Jangan membuat duplicate memory untuk fakta yang sama.

---

# 43. Memory Conflict

Contoh:

Existing:

```text
Daniel has never visited the city.
```

New candidate:

```text
Daniel visited the city when he was 10.
```

Jangan otomatis mengganti memory.

Buat conflict:

```text
Potential memory conflict detected.
```

User memilih:

```text
Keep existing
Keep new
Edit
Keep both
```

---

# 44. Story Facts vs Manuscript

Manuscript dapat mengandung informasi yang belum dikonfirmasi.

Contoh:

```text
Chapter 20:
Daniel may be the killer.
```

Ini bukan fakta.

Jangan otomatis menyimpan:

```text
Daniel is the killer.
```

Memory extraction harus memahami:

- confirmed fact;
- speculation;
- dialogue;
- character belief;
- narration;
- possibility.

Untuk MVP, memory AI selalu berstatus:

```text
proposed
```

sampai user mengonfirmasi.

---

# 45. Database Source of Truth

Prioritas:

```text
1. Explicit author-defined structured data
2. Confirmed story memories
3. Published/current manuscript
4. Proposed memories
5. AI inference
```

AI inference tidak boleh menjadi source of truth.

---

# 46. Why This Schema Is Designed This Way

Aplikasi memiliki dua jenis data:

## Structured Story Data

```text
Characters
Locations
World Rules
Timeline
Plot
```

Bagus untuk:

- filters;
- relationships;
- deterministic checks;
- UI.

## Unstructured Story Data

```text
Scene manuscript
Lore
Notes
Memories
AI context
```

Bagus untuk:

- semantic search;
- AI;
- narrative analysis.

Keduanya harus hidup berdampingan.

---

# 47. MVP Database Simplification

Walaupun schema di atas cukup lengkap, MVP tidak harus mengaktifkan semuanya sekaligus.

### Phase 1

```text
users
novels
acts
chapters
scenes
scene_versions
```

### Phase 2

```text
characters
character_relationships
locations
world_rules
```

### Phase 3

```text
timeline_events
plot_threads
plot_points
world_lore
```

### Phase 4

```text
story_memories
pgvector
ai_conversations
ai_messages
```

### Phase 5

```text
consistency_findings
ai_usage_logs
```

---

# 48. Recommended Initial MVP Tables

Jika ingin mulai coding secepat mungkin, gunakan hanya:

```text
user_profiles
novels
acts
chapters
scenes
scene_versions
characters
character_relationships
locations
world_rules
story_memories
ai_conversations
ai_messages
```

Ini sudah cukup untuk membangun core product.

---

# 49. Future Tables

Nanti dapat ditambahkan:

```text
factions
world_lore
plot_threads
plot_points
timeline_events
consistency_findings
ai_usage_logs

research_sources
research_notes

projects
collaborators
permissions

exports
subscriptions
usage_limits
```

Jangan memasukkannya ke MVP tanpa kebutuhan.

---

# 50. Final Database Architecture

```text
                         USER
                           │
                           ▼
                         NOVEL
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
    WRITING              STORY                WORLD
       │                   │                    │
   ┌───┴───┐          ┌────┼────┐         ┌────┼────┐
   ▼       ▼          ▼    ▼    ▼         ▼    ▼    ▼
 ACTS   VERSIONS   CHARACTERS PLOT    LOCATIONS RULES LORE
   │
   ▼
CHAPTERS
   │
   ▼
 SCENES
   │
   ▼
MANUSCRIPT
   │
   └─────────────────────┐
                         ▼
                   STORY MEMORY
                         │
                         ▼
                     PGVECTOR
                         │
                         ▼
                 CONTEXT RETRIEVAL
                         │
                         ▼
                    AI ENGINE
```

---

# 51. Next Step

Setelah schema ini, tahap teknis berikutnya adalah:

```text
DATABASE-SCHEMA.md
       ↓
MIGRATIONS
       ↓
SEED DATA
       ↓
PROJECT SCAFFOLD
       ↓
AUTH
       ↓
NOVEL CRUD
       ↓
CHAPTER / SCENE EDITOR
```

Sebelum implementasi AI, core manuscript harus sudah dapat ditulis, disimpan, di-version, dan diambil kembali dengan aman.

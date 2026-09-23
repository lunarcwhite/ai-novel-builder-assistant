# ARCHITECTURE.md — AI Novel Writing Workspace

**Status:** Draft  
**Version:** 0.1  
**Related documents:** `prd.md`, `design.md`

---

# 1. Architecture Goals

Arsitektur aplikasi harus:

1. sederhana untuk MVP;
2. mampu berkembang menjadi SaaS;
3. tidak bergantung pada satu AI provider;
4. mampu menangani novel panjang;
5. menjaga konteks cerita;
6. menjaga data tulisan tetap aman;
7. mendukung autosave dan version history;
8. mudah di-deploy dengan biaya rendah;
9. menghindari microservices sebelum benar-benar diperlukan.

Prinsip utama:

> **Modular monolith first, services later.**

---

# 2. Recommended Stack

## Frontend + Application Server

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
TipTap
```

Next.js menangani:

- UI;
- server components;
- server actions;
- API routes;
- authentication integration;
- AI orchestration pada MVP.

---

## Database

```text
PostgreSQL
pgvector
```

PostgreSQL menyimpan:

- application data;
- manuscript;
- structured story data;
- story memories;
- embeddings.

Tidak perlu vector database terpisah pada MVP.

---

## Authentication

Recommended:

```text
Supabase Auth
```

Alternatif:

```text
Auth.js
```

Pilihan final dapat ditentukan ketika deployment strategy diputuskan.

---

## Storage

Untuk:

- manuscript export;
- cover images;
- user files;
- future research attachments.

Gunakan object storage.

Recommended MVP:

```text
Supabase Storage
```

---

## AI

Gunakan provider abstraction.

```text
AIProvider
├── OpenAIProvider
├── AnthropicProvider
└── FutureProvider
```

Application code tidak boleh bergantung langsung pada SDK provider di seluruh codebase.

---

# 3. High-Level Architecture

```text
                         USER
                           │
                           ▼
                    ┌──────────────┐
                    │   Next.js    │
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Application  │
                    │    Layer     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Story Engine      Writing Engine    AI Engine
          │                │                │
          └────────────────┼────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
          PostgreSQL              AI Provider
           + pgvector
```

---

# 4. Architecture Layers

Gunakan logical layers.

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── server/
│   ├── services/
│   ├── repositories/
│   ├── ai/
│   └── jobs/
└── db/
```

---

# 5. Feature-Based Organization

Fitur utama dipisahkan secara modular.

```text
features/
├── novels/
├── chapters/
├── scenes/
├── characters/
├── world/
├── timeline/
├── plot/
├── memories/
├── ai/
├── consistency/
└── analysis/
```

Setiap feature dapat memiliki:

```text
components/
actions/
queries/
schemas/
types/
```

Tujuannya agar code tidak berubah menjadi satu folder `utils` besar.

---

# 6. Database Model

Core relationship:

```text
users
  │
  └── novels
        │
        ├── acts
        │    └── chapters
        │         └── scenes
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
        └── ai_conversations
```

---

# 7. Core Tables

## users

Managed by authentication provider.

Application profile:

```text
user_profiles
----------------
id
display_name
avatar_url
created_at
updated_at
```

---

## novels

```text
novels
-----------------------------
id
user_id
title
slug
genre
status
premise
theme
tone
target_audience
description
word_count
created_at
updated_at
```

Indexes:

```text
user_id
slug
status
```

---

# 8. Acts

```text
acts
-----------------------------
id
novel_id
title
description
position
created_at
updated_at
```

Unique:

```text
(novel_id, position)
```

---

# 9. Chapters

```text
chapters
-----------------------------
id
novel_id
act_id
title
summary
objective
conflict
emotional_beat
outcome
position
status
word_count
created_at
updated_at
```

Index:

```text
novel_id
act_id
position
```

---

# 10. Scenes

```text
scenes
-----------------------------
id
novel_id
chapter_id
title
summary
purpose
pov_character_id
location_id
position
content
word_count
status
created_at
updated_at
```

Index:

```text
chapter_id
novel_id
position
```

---

# 11. Characters

```text
characters
-----------------------------
id
novel_id
name
role
age
occupation
description
personality
motivation
goal
fear
strengths
weaknesses
secret
backstory
character_arc
created_at
updated_at
```

Index:

```text
novel_id
```

---

# 12. Character Relationships

```text
character_relationships
-----------------------------
id
novel_id
from_character_id
to_character_id
relationship_type
description
history
current_state
created_at
updated_at
```

Constraint:

```text
novel_id
from_character_id
to_character_id
```

---

# 13. Locations

```text
locations
-----------------------------
id
novel_id
name
description
geography
atmosphere
notes
created_at
updated_at
```

---

# 14. Factions

```text
factions
-----------------------------
id
novel_id
name
description
purpose
leader_character_id
notes
created_at
updated_at
```

---

# 15. World Rules

```text
world_rules
-----------------------------
id
novel_id
title
rule
description
importance
created_at
updated_at
```

Example:

```text
title:
Magic limitation

rule:
Only Moon Blood descendants can use magic.
```

---

# 16. World Lore

```text
world_lore
-----------------------------
id
novel_id
category
title
content
created_at
updated_at
```

Categories:

```text
history
religion
culture
technology
magic
politics
mythology
other
```

---

# 17. Plot Threads

```text
plot_threads
-----------------------------
id
novel_id
title
description
status
importance
introduced_chapter_id
resolved_chapter_id
created_at
updated_at
```

Status:

```text
planned
active
resolved
abandoned
```

---

# 18. Plot Points

```text
plot_points
-----------------------------
id
novel_id
act_id
chapter_id
title
description
type
position
created_at
updated_at
```

Types:

```text
inciting_incident
turning_point
midpoint
climax
resolution
revelation
custom
```

---

# 19. Timeline Events

```text
timeline_events
-----------------------------
id
novel_id
title
description
date_value
date_precision
relative_time
chapter_id
location_id
created_at
updated_at
```

`date_precision`:

```text
exact
day
month
year
relative
unknown
```

Do not assume every fictional world uses real-world dates.

---

# 20. Story Memories

Story memory is one of the most important entities.

```text
story_memories
--------------------------------
id
novel_id
type
content
importance
status
source_type
source_id
embedding
metadata
created_at
updated_at
```

Types:

```text
character_fact
relationship_fact
world_fact
timeline_fact
plot_fact
story_fact
```

Status:

```text
proposed
confirmed
rejected
archived
```

---

# 21. Memory Sources

Every memory should preferably have a source.

Example:

```text
Memory:
Anna's brother died when Anna was 12.

Source:
chapter
chapter_id = 2
```

Possible sources:

```text
chapter
scene
character
world_rule
timeline_event
manual
```

This makes AI findings explainable.

---

# 22. Embedding Strategy

Not every database record requires an embedding.

Embed:

- story memories;
- chapter summaries;
- scene summaries;
- important character profiles;
- world rules;
- lore;
- timeline events;
- plot threads.

Do not automatically embed every tiny UI field.

---

# 23. Embedding Record

Recommended metadata:

```json
{
  "novel_id": "...",
  "entity_type": "story_memory",
  "entity_id": "...",
  "importance": 0.9,
  "chapter_id": "...",
  "character_ids": [],
  "location_ids": []
}
```

This metadata enables filtered retrieval.

---

# 24. Retrieval Pipeline

When user asks:

> "Why is Daniel afraid of the hospital?"

Pipeline:

```text
User Question
      ↓
Intent Detection
      ↓
Entity Detection
      ↓
Current Context
      ↓
Metadata Filters
      ↓
Vector Search
      ↓
Keyword Search
      ↓
Rank / Merge
      ↓
Context Builder
      ↓
LLM
```

---

# 25. Hybrid Retrieval

Use both:

### Semantic search

Good for:

```text
"Why does Daniel avoid hospitals?"
```

and finding:

```text
"Daniel's brother died at St. Mary's."
```

### Keyword search

Good for:

- exact names;
- locations;
- chapter numbers;
- unique terminology.

Final context should combine both.

---

# 26. Context Builder

Context should be divided.

```text
SYSTEM RULES

NOVEL CONTEXT

CURRENT CHAPTER

CURRENT SCENE

RELEVANT CHARACTERS

RELEVANT WORLD RULES

RELEVANT TIMELINE

RELEVANT MEMORIES

RELEVANT PREVIOUS SCENES

USER REQUEST
```

Example:

```text
SYSTEM:
You are a writing assistant.
The author owns all creative decisions.

NOVEL:
Genre: Fantasy Mystery
Tone: Dark but emotional

CURRENT SCENE:
Chapter 12 / Scene 3

CHARACTERS:
Anna...
Daniel...

WORLD RULE:
...

RELEVANT MEMORY:
...

USER:
Is Daniel's reaction consistent?
```

---

# 27. Context Budget

Never send unlimited context.

Use priority.

```text
Priority 1
Current selection / scene

Priority 2
Current chapter

Priority 3
Relevant characters

Priority 4
Relevant story memories

Priority 5
World rules

Priority 6
Timeline

Priority 7
Other related content
```

Stop when context budget is reached.

---

# 28. AI Provider Abstraction

Use:

```typescript
interface AIProvider {
    generateText(input: GenerateTextInput): Promise<GenerateTextResult>

    generateStructured<T>(
        input: StructuredGenerationInput
    ): Promise<T>

    embed(input: string): Promise<number[]>
}
```

Application code:

```text
AIService
   ↓
AIProvider
   ↓
OpenAI / Anthropic / Other
```

Never call provider SDK directly from React components.

---

# 29. AI Operations

Define explicit operations.

```text
AI_OPERATION
├── brainstorm
├── continue_scene
├── rewrite
├── expand
├── shorten
├── improve_prose
├── improve_dialogue
├── summarize
├── critique
├── consistency_check
├── story_analysis
└── memory_extraction
```

Each operation gets its own prompt contract.

---

# 30. Structured AI Outputs

For analysis, do not rely on free-form text.

Example:

```json
{
  "findings": [
    {
      "type": "timeline_conflict",
      "severity": "potential",
      "description": "...",
      "sources": [
        {
          "type": "chapter",
          "id": "..."
        }
      ]
    }
  ]
}
```

This makes findings renderable by the UI.

---

# 31. AI Writing Pipeline

For:

```text
Continue Scene
```

Pipeline:

```text
User Action
    ↓
Current Scene
    ↓
Context Retrieval
    ↓
Prompt Builder
    ↓
LLM
    ↓
Draft Suggestion
    ↓
User Review
    ↓
Insert / Replace / Dismiss
```

AI output is never automatically persisted as final manuscript content.

---

# 32. Memory Extraction Pipeline

After manuscript changes:

```text
Scene Saved
    ↓
Queue Memory Extraction
    ↓
AI analyzes new content
    ↓
Potential Facts
    ↓
Deduplicate
    ↓
Compare Existing Memory
    ↓
Create Proposed Memory
    ↓
User Confirmation
```

For MVP, use explicit confirmation.

Later, users may enable trusted automatic memory extraction.

---

# 33. Consistency Checking Pipeline

```text
Run Check
    ↓
Determine Scope
    ↓
Retrieve Relevant Facts
    ↓
Retrieve Timeline
    ↓
Retrieve World Rules
    ↓
Analyze New/Target Content
    ↓
Structured Findings
    ↓
Persist Findings
    ↓
Display Evidence
```

Scope options:

```text
Current Scene
Current Chapter
Selected Chapters
Entire Novel
```

---

# 34. Consistency Finding Model

```text
consistency_findings
--------------------------------
id
novel_id
type
severity
description
status
source_ids
related_entity_ids
created_at
updated_at
```

Severity:

```text
potential
notable
high_attention
```

Avoid presenting severity as objective literary judgment.

---

# 35. Versioning

Manuscript content must be versioned.

```text
scene
  │
  ├── version 1
  ├── version 2
  ├── version 3
  └── current
```

Table:

```text
scene_versions
--------------------------------
id
scene_id
version_number
content
word_count
created_by
change_type
created_at
```

Change type:

```text
manual
ai_insert
ai_replace
restore
import
```

---

# 36. Autosave

Editor behavior:

```text
User types
   ↓
Debounce
   ↓
Save draft
   ↓
Update scene
   ↓
Periodic version snapshot
```

Do not create a full version on every keystroke.

Suggested:

- autosave: short debounce;
- version snapshot: explicit action or periodic interval;
- before AI replace: create version.

---

# 37. Search Architecture

MVP:

```text
PostgreSQL full-text search
+
pgvector
```

Search across:

```text
novels
chapters
scenes
characters
locations
world_rules
world_lore
story_memories
timeline_events
plot_threads
```

Future:

Elasticsearch/OpenSearch only if PostgreSQL search becomes insufficient.

---

# 38. API / Server Actions

Use domain-oriented actions.

Example:

```text
createNovel()
updateNovel()

createChapter()
updateChapter()

createScene()
updateScene()
saveSceneDraft()

createCharacter()
updateCharacter()

createStoryMemory()
confirmStoryMemory()

askStoryAI()
runConsistencyCheck()
analyzeStory()
```

Do not create generic endpoints such as:

```text
/updateEverything
```

---

# 39. Authorization

Every query must be scoped by authenticated user.

Pattern:

```text
request
 ↓
authenticated user
 ↓
novel ownership check
 ↓
entity access
 ↓
operation
```

Never trust `novel_id` from client without ownership verification.

---

# 40. Security

Important:

- server-side AI keys only;
- validate all input;
- sanitize rich text;
- prevent unauthorized novel access;
- rate-limit AI operations;
- protect file uploads;
- audit destructive actions;
- encrypt sensitive data where appropriate.

---

# 41. AI Cost Control

AI can become the largest operating cost.

Use:

### Small/cheap model

For:

- classification;
- memory extraction;
- summarization;
- metadata generation.

### More capable model

For:

- creative writing;
- complex story analysis;
- consistency reasoning.

Never use the most expensive model for every operation.

---

# 42. Caching

Cache:

- chapter summaries;
- character summaries;
- world summaries;
- embeddings;
- stable story context.

Do not repeatedly regenerate unchanged summaries.

---

# 43. Background Jobs

Some operations should be asynchronous:

```text
Memory extraction
Embedding generation
Large consistency checks
Novel analysis
Export generation
```

MVP can use a simple database-backed job strategy or hosted job system.

Do not introduce Redis unless the actual workload requires it.

---

# 44. Deployment Architecture

Recommended low-complexity deployment:

```text
                 Internet
                    │
                    ▼
             Vercel / Similar
                    │
                    ▼
                Next.js
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Supabase DB          AI Provider
     PostgreSQL
     + pgvector
          │
          ▼
      Supabase Storage
```

This keeps infrastructure small.

---

# 45. Environment Variables

Example:

```text
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=
AI_API_KEY=

EMBEDDING_MODEL=
AI_MODEL=
```

Never expose secret keys through `NEXT_PUBLIC_*`.

---

# 46. Folder Structure

Recommended:

```text
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   └── novel/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── novels/
│   ├── chapters/
│   ├── scenes/
│   ├── characters/
│   ├── world/
│   ├── timeline/
│   ├── plot/
│   ├── memories/
│   ├── ai/
│   ├── consistency/
│   └── analysis/
│
├── server/
│   ├── ai/
│   ├── services/
│   ├── repositories/
│   └── jobs/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── seed/
│
├── lib/
│   ├── auth/
│   ├── editor/
│   ├── search/
│   └── utils/
│
└── types/
```

---

# 47. Domain Service Examples

Avoid putting complex business logic in UI components.

Example:

```text
StoryContextService
MemoryService
ConsistencyService
TimelineService
CharacterService
ChapterService
AIService
```

Example:

```typescript
const context =
    await storyContextService.build({
        novelId,
        sceneId,
        query,
    })
```

---

# 48. Repository Layer

Database access should be centralized enough to prevent duplicated queries.

Example:

```text
NovelRepository
ChapterRepository
SceneRepository
CharacterRepository
MemoryRepository
TimelineRepository
```

Services use repositories.

```text
UI
 ↓
Action
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# 49. Eventual Event Architecture

Not required in MVP, but design for events:

```text
SceneUpdated
CharacterUpdated
WorldRuleCreated
MemoryConfirmed
ChapterPublished
```

Events can later trigger:

```text
embedding generation
memory extraction
search indexing
analytics
```

---

# 50. Story Context as a First-Class Domain

Do not treat context as a helper utility.

Create an explicit subsystem:

```text
Story Context Engine

├── Entity Resolver
├── Retrieval
├── Ranking
├── Context Budgeting
├── Context Builder
└── Prompt Builder
```

This subsystem becomes the foundation for AI features.

---

# 51. Context Resolution

Given:

```text
novel_id
chapter_id
scene_id
user_query
```

resolve:

```text
Current Scene
Current Chapter
Current POV
Characters in Scene
Location
Previous Scene
Next Scene outline
Relevant Memories
Relevant Rules
Relevant Timeline
Relevant Plot Threads
```

Then retrieve additional semantic context.

---

# 52. Retrieval Ranking

Suggested conceptual ranking:

```text
Current Scene              highest
Current Chapter            very high
Explicitly mentioned       very high
Relevant Character         high
World Rule                 high
Recent Events              medium-high
Semantic similarity        medium
Old unrelated content      low
```

The exact weighting should be measured rather than permanently hardcoded.

---

# 53. Long Novel Strategy

For a 100+ chapter novel:

Do not retrieve:

```text
100 chapters
```

Instead maintain layers:

```text
RAW MANUSCRIPT
      ↓
SCENE SUMMARY
      ↓
CHAPTER SUMMARY
      ↓
ACT SUMMARY
      ↓
NOVEL SUMMARY

+

STORY MEMORY

+

STRUCTURED ENTITIES
```

This creates hierarchical context.

---

# 54. Summarization Strategy

When a chapter is completed:

```text
Scenes
 ↓
Chapter Summary
 ↓
Important Facts
 ↓
Character Changes
 ↓
Timeline Events
 ↓
Plot Thread Changes
```

These become structured context.

---

# 55. AI Memory Hierarchy

```text
Level 0
Raw manuscript

Level 1
Scene summary

Level 2
Chapter summary

Level 3
Act summary

Level 4
Novel summary

Cross-cutting:
Characters
World
Timeline
Plot
Story Memories
```

This is preferable to relying only on vector search.

---

# 56. Data Consistency

Structured data is authoritative where explicitly defined.

Example:

```text
World Rule:
Magic requires Moon Blood.
```

If manuscript contradicts this, consistency checker reports:

```text
Potential contradiction with author-defined world rule.
```

AI should not silently rewrite the rule.

---

# 57. AI Prompt Hierarchy

Prompt priority:

```text
1. System safety / behavior
2. Product instructions
3. Author-defined story facts
4. Current manuscript
5. Retrieved context
6. User request
7. AI creativity
```

When contexts conflict, higher-priority author-defined facts should be surfaced rather than silently overridden.

---

# 58. AI Hallucination Control

AI responses should distinguish:

```text
Known from manuscript
Known from story memory
Inference
Suggestion
Creative proposal
```

Example:

```text
Based on your established story:
...

Possible interpretation:
...

One possible direction:
...
```

This distinction is especially important for continuity.

---

# 59. AI Provider Failure

If AI fails:

```text
AI request failed.

Your manuscript was not changed.

[Retry]
```

The application remains usable without AI.

---

# 60. Offline / Degraded Mode

MVP does not need full offline editing.

But editor should preserve unsaved local draft state when possible.

If network temporarily fails:

```text
Connection interrupted.
Your recent changes are stored locally and will sync when connection returns.
```

---

# 61. Backup Strategy

At minimum:

- managed PostgreSQL backups;
- manuscript version history;
- export capability.

Never rely solely on AI chat history as a backup.

---

# 62. Testing Strategy

## Unit Tests

Test:

- story context ranking;
- memory deduplication;
- timeline logic;
- permission checks;
- word count;
- version creation.

## Integration Tests

Test:

```text
Create novel
→ create chapter
→ create scene
→ write
→ save
→ retrieve context
→ AI operation
```

## E2E Tests

Critical flows:

```text
signup → create novel → write scene
```

and:

```text
write → consistency check → review finding
```

---

# 63. Observability

Track technical metrics:

```text
AI request latency
AI error rate
retrieval latency
database latency
token usage
estimated AI cost
autosave failures
```

Do not log manuscript content unnecessarily.

---

# 64. Privacy by Design

Never log:

```text
full manuscript
full AI prompt
full AI response
```

unless explicitly required and controlled.

Prefer metadata:

```text
operation
novel_id
latency
token_count
model
status
```

---

# 65. MVP Implementation Order

## Sprint 1

```text
Project
Auth
Database
Design system
Novel CRUD
```

## Sprint 2

```text
Acts
Chapters
Scenes
TipTap
Autosave
```

## Sprint 3

```text
Characters
Locations
World Rules
Timeline
```

## Sprint 4

```text
AI provider abstraction
AI assistant
Context builder
```

## Sprint 5

```text
Story memory
Embeddings
Hybrid retrieval
```

## Sprint 6

```text
Consistency checker
Version history
Export
```

---

# 66. Architecture Evolution

### MVP

```text
Next.js
+
PostgreSQL
+
pgvector
+
Supabase
+
AI Provider
```

### Growth

If workload increases:

```text
Next.js
      │
      ├── PostgreSQL
      │
      ├── Queue
      │
      ├── Object Storage
      │
      └── AI Service
```

### Large Scale

Only if necessary:

```text
Web App
   │
API
   │
├── Story Service
├── Writing Service
├── AI Service
├── Search Service
└── Analysis Workers
```

Do not build this architecture prematurely.

---

# 67. Key Architectural Decision

The most important architectural decision is:

> **Story context is a domain system, not merely an AI prompt.**

The application must understand relationships among:

```text
Novel
 ├── Characters
 ├── World
 ├── Plot
 ├── Timeline
 ├── Chapters
 ├── Scenes
 └── Memories
```

AI then consumes the relevant representation.

This allows the same story intelligence to power:

- AI writing;
- Q&A;
- consistency checking;
- story analysis;
- timeline checking;
- character analysis;
- future features.

---

# 68. Final Architecture

```text
                         ┌───────────────┐
                         │     USER      │
                         └───────┬───────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │     NEXT.JS       │
                       │  Writing Workspace│
                       └─────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        Story Domain       Writing Domain       AI Domain
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                         Story Context Engine
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
          Structured Data    PostgreSQL        pgvector
                │
                └────────────────┬────────────────┘
                                 │
                                 ▼
                          AI Provider
                                 │
                                 ▼
                         Structured Result
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                 Writing     Memory       Analysis
                 Assist      Engine       Findings
```

---

# 69. Next Step

Setelah `architecture.md`, implementasi sebaiknya dimulai dengan:

1. finalisasi database schema;
2. finalisasi product name;
3. initialize repository;
4. initialize Next.js;
5. configure PostgreSQL;
6. configure authentication;
7. build design system;
8. build Novel Library;
9. build Novel Overview;
10. build Chapter/Scene editor.

Jangan mulai dari AI.

**AI harus dibangun setelah core story data dan writing editor tersedia**, karena AI membutuhkan struktur tersebut sebagai sumber kebenaran.

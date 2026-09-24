# IMPLEMENTATION-PLAN.md — AI Novel Writing Workspace

**Status:** Ready for Implementation  
**Version:** 0.1  
**Related:** `SOUL.md`, `AGENTS.md`, `docs/prd.md`, `docs/design.md`, `docs/architecture.md`, `docs/database-schema.md`

---

# 1. Purpose

Dokumen ini menerjemahkan PRD dan architecture menjadi urutan pekerjaan implementasi yang dapat dijalankan oleh developer atau coding agent.

Tujuan utamanya:

- menghindari implementasi yang terlalu besar sekaligus;
- menjaga dependency antar fitur;
- memastikan setiap fase menghasilkan sesuatu yang dapat diverifikasi;
- mencegah AI dibangun sebelum fondasi story workspace siap.

---

# 2. Implementation Philosophy

Gunakan prinsip:

```text
Build vertically.
Verify frequently.
Keep changes small.
Protect the manuscript.
```

Setiap fase harus menghasilkan sistem yang lebih usable.

Jangan membuat seluruh backend terlebih dahulu lalu UI belakangan.

Untuk fitur utama, gunakan vertical slice:

```text
Database
   ↓
Domain logic
   ↓
Server action
   ↓
UI
   ↓
Test
```

---

# 3. Definition of Done

Sebuah task dianggap selesai apabila:

```text
[ ] Requirement dipenuhi
[ ] UI bekerja
[ ] Server logic bekerja
[ ] Validation tersedia
[ ] Authorization diperiksa
[ ] Error state ditangani
[ ] Test relevan ditambahkan
[ ] Typecheck berhasil
[ ] Lint berhasil
[ ] Build berhasil jika relevan
[ ] Tidak ada debug code
[ ] Tidak ada secret
[ ] Dokumentasi diperbarui jika behavior berubah
```

---

# 4. Phase Overview

```text
PHASE 0
Repository & Tooling
        ↓
PHASE 1
Authentication
        ↓
PHASE 2
Novel Library
        ↓
PHASE 3
Novel Structure
        ↓
PHASE 4
Writing Editor
        ↓
PHASE 5
Characters & World
        ↓
PHASE 6
Story Memory
        ↓
PHASE 7
AI Assistant
        ↓
PHASE 8
Consistency Engine
        ↓
PHASE 9
Polish & Deployment
```

---

# PHASE 0 — Repository & Tooling

## Goal

Mempersiapkan project yang bersih, reproducible, dan siap dikembangkan.

---

## Task 0.1 — Initialize Repository

### Deliverables

```text
package.json
tsconfig.json
next.config
eslint config
prettier config
gitignore
env example
```

### Acceptance Criteria

- project dapat dijalankan;
- TypeScript aktif;
- lint aktif;
- formatting aktif;
- `.env` tidak masuk Git.

---

## Task 0.2 — Install Core Dependencies

Recommended:

```text
next
react
typescript

tailwindcss
shadcn/ui

zod

tipTap

supabase client/server
```

Jangan menambahkan AI SDK terlebih dahulu jika belum dibutuhkan.

---

## Task 0.3 — Establish Folder Structure

```text
src/
├── app/
├── components/
├── features/
├── server/
├── db/
├── lib/
└── types/
```

---

## Task 0.4 — Environment Setup

Create:

```text
.env.example
```

Minimal:

```text
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=
AI_API_KEY=
```

Do not populate real secrets in Git.

---

## Task 0.5 — Design System Foundation

Implement:

- typography;
- spacing;
- colors;
- buttons;
- inputs;
- dialogs;
- dropdown;
- tabs;
- command palette foundation;
- toast;
- loading state.

Follow `docs/design.md`.

---

## Phase 0 Exit Criteria

```text
[ ] Application starts
[ ] TypeScript passes
[ ] Lint passes
[ ] Base UI works
[ ] Environment documented
[ ] Repository clean
```

---

# PHASE 1 — Authentication

## Goal

User dapat membuat account dan memiliki workspace pribadi.

---

## Task 1.1 — Supabase/Auth Integration

Implement:

```text
Sign Up
Login
Logout
Session
Protected Routes
```

---

## Task 1.2 — User Profile

Create:

```text
user_profiles
```

Fields:

```text
display_name
avatar_url
```

---

## Task 1.3 — Authorization Foundation

Create reusable:

```text
requireAuth()
requireNovelAccess()
```

Every protected operation must verify ownership.

---

## Task 1.4 — Auth UI

Screens:

```text
/login
/signup
/forgot-password
```

---

## Phase 1 Exit Criteria

```text
[ ] User can sign up
[ ] User can log in
[ ] User can log out
[ ] Protected pages work
[ ] Unauthorized access is blocked
```

---

# PHASE 2 — Novel Library

## Goal

User dapat membuat dan mengelola novel.

---

## Task 2.1 — Novel Migration

Create:

```text
novels
```

with indexes and constraints from `database-schema.md`.

---

## Task 2.2 — Novel Repository

Implement:

```text
NovelRepository
```

Methods:

```text
findById()
findManyByUser()
create()
update()
delete()
```

Every method must enforce ownership.

---

## Task 2.3 — Novel Service

Implement:

```text
NovelService
```

Business logic:

- slug generation;
- validation;
- status transitions;
- ownership.

---

## Task 2.4 — Novel Library UI

Route:

```text
/dashboard
```

Display:

```text
My Novels
```

Actions:

```text
Create Novel
Open
Rename
Archive
Delete
```

---

## Task 2.5 — Create Novel Flow

Fields:

```text
Title
Genre
Premise
Theme
Tone
Target Audience
```

---

## Phase 2 Exit Criteria

User dapat:

```text
login
→ dashboard
→ create novel
→ open novel
→ edit metadata
→ delete/archive
```

---

# PHASE 3 — Novel Structure

## Goal

Membangun struktur:

```text
Novel
 └── Act
      └── Chapter
           └── Scene
```

---

## Task 3.1 — Acts

Implement:

- migration;
- repository;
- service;
- CRUD;
- reorder.

---

## Task 3.2 — Chapters

Implement:

- migration;
- repository;
- service;
- CRUD;
- reorder;
- status.

---

## Task 3.3 — Scenes

Implement:

- migration;
- repository;
- service;
- CRUD;
- reorder;
- scene metadata.

---

## Task 3.4 — Outline UI

Implement tree:

```text
Act I
 ├── Chapter 1
 │    ├── Scene 1
 │    └── Scene 2
 └── Chapter 2
```

Support:

```text
add
rename
delete
reorder
collapse
expand
```

---

## Task 3.5 — Drag & Drop

Only after basic outline works.

Do not start with complex drag/drop.

---

## Phase 3 Exit Criteria

User dapat:

```text
Create Act
Create Chapter
Create Scene
Reorder
Navigate
```

---

# PHASE 4 — Writing Editor [COMPLETED]

## Goal

User dapat benar-benar menulis novel.

This is the first major product milestone. Status: **COMPLETED**.

---

## Task 4.1 — TipTap Integration

Implement:

- rich text;
- paragraphs;
- headings;
- bold;
- italic;
- lists;
- blockquote;
- links.

Do not overload the editor with features.

---

## Task 4.2 — Scene Editor

Route concept:

```text
/novel/[novelId]/write/[sceneId]
```

Layout:

```text
Scene Navigator
      │
      ▼
Manuscript Editor
      │
      ▼
AI Panel placeholder
```

AI panel can remain disabled during this phase.

---

## Task 4.3 — Word Count

Implement:

```text
scene word count
chapter word count
novel word count
```

Use manuscript content as source of truth.

---

## Task 4.4 — Autosave

Flow:

```text
typing
 ↓
debounce
 ↓
save
 ↓
Saved ✓
```

If failure:

```text
Saving failed
Your local draft is preserved
```

---

## Task 4.5 — Scene Versions

Implement:

```text
scene_versions
```

Version triggers:

- explicit version;
- AI replacement later;
- restore.

---

## Task 4.6 — Focus Mode

Hide:

```text
sidebar
AI panel
navigation
```

Keep manuscript central.

---

## Task 4.7 — Editor Recovery

Test:

```text
type
disconnect
reload
restore draft
```

The exact offline strategy can remain lightweight for MVP.

---

## PHASE 4 EXIT CRITERIA

This is a critical milestone.

A user must be able to:

```text
Create Novel
 ↓
Create Chapter
 ↓
Create Scene
 ↓
Write
 ↓
Leave
 ↓
Return
 ↓
Continue writing
```

If this is not reliable, do not proceed to AI.

---

# PHASE 5 — Characters & World [COMPLETED]

## Goal

Create structured story knowledge.

---

## Task 5.1 — Characters

Implement:

```text
Character CRUD
Character Detail
Character Arc
```

Fields from database schema.

---

## Task 5.2 — Character Relationships

Implement:

```text
from_character
to_character
relationship_type
description
history
current_state
```

Start with list/table representation.

Graph visualization can come later.

---

## Task 5.3 — Locations

Implement:

```text
Location CRUD
```

---

## Task 5.4 — World Rules

Implement:

```text
World Rule CRUD
Importance
Description
```

---

## Task 5.5 — World Lore

Optional within MVP.

If time is limited, defer until after AI context.

---

## Task 5.6 — Scene Context Linking

Allow scene to reference:

```text
POV Character
Location
Characters involved
```

Characters involved may initially be inferred from content later; manual selection is sufficient first.

---

## PHASE 5 EXIT CRITERIA [VERIFIED]

User can construct:

```text
[x] Characters (CRUD, Psychological Profile, 3-Stage Arc, Manuscript Appearances)
[x] Relationships (Bidirectional links, Relationship Types, Dynamic State)
[x] Locations (CRUD, Atmosphere, Significance, Linked Scenes)
[x] World Rules (CRUD, Strictness/Importance Levels 1–5, Limitations)
[x] World Lore (Lore Articles, Categories, Cross-tags)
```

and connect them to scenes (POV Character, Primary Location, Characters Involved in Scene Context Inspector).

---

# PHASE 6 — Story Memory [COMPLETED]

## Goal

Build the foundation that makes AI context-aware.

This is the second major architectural milestone. Status: **COMPLETED**.

---

## Task 6.1 — Story Memory Table

Implemented in `src/db/migrations/006_story_memories.sql`:
- Table `story_memories` with `pgvector` support and cosine similarity index.
- RPC function `match_story_memories`.

---

## Task 6.2 — Memory UI

Implemented in `src/app/(workspace)/workspace/[novelId]/memories/`:
- Status tabs: `Confirmed`, `Proposed`, `Rejected`, `Archived`.
- Type filter pills (Karakter, Relasi, Dunia, Kronologi, Plot, Fakta Umum).
- Live stats counter bar.

---

## Task 6.3 — Manual Memory Creation

Implemented in `MemoryFormDialog`:
- Story Fact, Character Fact, World Fact, Timeline Fact, Plot Fact, Relationship Fact.
- Importance level 1–5.
- Authority status lifecycle.

---

## Task 6.4 — Embedding Infrastructure

Implemented in `src/server/ai/embeddings.ts`:
- Provider abstraction `EmbeddingProvider`.
- `OpenAIEmbeddingProvider` (1536-dim).
- `LocalDevEmbeddingProvider` (deterministic 1536-dim feature-hashed vectorizer for zero-config offline dev).
- `EmbeddingService` with cosine similarity math.

---

## Task 6.5 — Vector Storage

Implemented in `story_memories.embedding` (PostgreSQL vector(1536)) and in-memory vector store.

---

## Task 6.6 — Semantic Retrieval

Implemented in `MemoryRepository.searchSimilar()` and interactive "Uji Retrieval Semantik" sandbox in the Memory Studio.

---

## Task 6.7 — Memory Deduplication

Implemented in `MemoryRepository.checkDuplicate()` and real-time duplicate warning indicator in the creation dialog.

---

## Task 6.8 — Memory Source & Editor Integration

Implemented in `src/components/editor/ai-panel-placeholder.tsx` and `getSceneRelevantMemories`:
- Source traceability to scenes, chapters, characters, and rules.
- Scene Relevant Memories displayed in the Writing Editor.
- Quick add fact button directly linked to the current scene.

---

## PHASE 6 EXIT CRITERIA [VERIFIED]

The system can:

```text
[x] Create memory
[x] Embed (1536-dim vector)
[x] Store (dual-mode pgvector + local dev)
[x] Search semantically (cosine similarity ranking)
[x] Show source (attribution badge & scene navigation)
[x] Deduplicate & detect conflicts
```

---

# PHASE 7 — AI Assistant [COMPLETED]

## Goal

Introduce AI after the story foundation is reliable.

---

## Task 7.1 — AI Provider Interface

Implement:

```typescript
interface AIProvider {
  generateText(...)
  generateStructured(...)
  embed(...)
}
```

---

## Task 7.2 — Provider Implementation

Implement the first provider.

Keep provider-specific code isolated.

---

## Task 7.3 — AI Service

Implement:

```text
AIService
```

Operations:

```text
brainstorm
continue_scene
rewrite
expand
shorten
improve_prose
improve_dialogue
summarize
critique
```

---

## Task 7.4 — Context Resolver

Input:

```text
novelId
chapterId
sceneId
userQuery
selectedText
```

Resolve:

```text
current scene
current chapter
characters
location
world rules
memories
plot threads
timeline
```

---

## Task 7.5 — Context Builder

Build structured context:

```text
SYSTEM
NOVEL
CURRENT CHAPTER
CURRENT SCENE
CHARACTERS
WORLD
MEMORIES
TIMELINE
USER REQUEST
```

Respect context budget.

---

## Task 7.6 — AI Panel

Implement:

```text
Ask AI
```

Actions:

```text
Continue
Rewrite
Expand
Improve
Critique
```

---

## Task 7.7 — AI Suggestion UI

Every generated edit must provide:

```text
Insert
Replace
Copy
Dismiss
```

---

## Task 7.8 — AI Conversation

Implement:

```text
ai_conversations
ai_messages
```

Conversation context should remain tied to novel.

---

## Task 7.9 — Token / Usage Logging

Track:

```text
provider
model
operation
input tokens
output tokens
latency
status
estimated cost
```

Do not log manuscript unnecessarily.

---

## PHASE 7 EXIT CRITERIA

User can:

Implemented: `src/server/ai/` (providers, prompts, context-resolver, context-builder), `src/features/ai/` (AIService, repositories), `src/server/actions/ai.ts`, `src/components/editor/ai-assistant.tsx`, migration `008_ai_assistant.sql`.

```text
[x] Open scene
[x] Ask AI (10 operations)
[x] AI retrieves relevant story context (layered, budgeted)
[x] AI responds (OpenAI / Anthropic / local-dev offline)
[x] User decides: Insert / Replace / Copy / Dismiss (versioned, reversible)
```

Verified: 67 tests pass (19 new AI), lint clean, typecheck clean, build clean.

---

# PHASE 8 — Consistency Engine

## Goal

Detect potential contradictions without treating them as objective errors.

---

## Task 8.1 — Consistency Domain

Implement:

```text
consistency_findings
```

---

## Task 8.2 — Scope Selection

Support:

```text
Current Scene
Current Chapter
Selected Chapters
Entire Novel
```

Start with current scene/chapter.

---

## Task 8.3 — Character Consistency

Check:

```text
character facts
relationships
known history
```

Example:

```text
Potential contradiction:

Chapter 4:
Daniel is described as an only child.

Chapter 19:
Daniel mentions his sister.
```

---

## Task 8.4 — World Rule Consistency

Compare manuscript against confirmed world rules.

---

## Task 8.5 — Timeline Consistency

Compare:

```text
timeline events
relative references
chapter chronology
```

---

## Task 8.6 — Evidence

Every finding should provide:

```text
description
source A
source B
```

---

## Task 8.7 — Review Workflow

User can:

```text
Review
Dismiss
Resolve
```

---

## PHASE 8 EXIT CRITERIA

Consistency checker produces explainable findings with sources.

Implemented: `src/features/consistency/` (repository, checks, service), `src/server/ai/prompts.ts` (CONSISTENCY_VALIDATION_SYSTEM + builder), `src/server/actions/consistency.ts`, `src/components/editor/consistency-panel.tsx`, migration `009_consistency_findings.sql` (applied live on Supabase).

```text
[x] Run check on current scene / current chapter (Selected Chapters + Entire Novel deferred)
[x] Character consistency: memory-vs-memory + scene-vs-confirmed-memory (Task 8.3)
[x] World rule consistency: scene-vs-rule exclusivity check (Task 8.4)
[x] Timeline consistency deferred — no timeline_events table yet (Phase 9); types reserved (Task 8.5)
[x] Every finding carries description + source A / source B (Task 8.6)
[x] Author workflow: Review / Dismiss / Resolve + delete; manuscript never written (Task 8.7)
```

Verified: 90 tests pass (23 new consistency: 14 unit + 9 feature), lint clean, typecheck clean, build clean.

---

# PHASE 9 — Story Intelligence

This phase extends the MVP toward the full product vision.

---

## Task 9.1 — Plot Threads

Implemented: `src/features/plot/` (repository, service), `src/server/actions/plot.ts`,
`src/app/(workspace)/workspace/[novelId]/plot/` (page, studio view, dialogs),
migration `010_plot_threads_timeline.sql` (applied live on Supabase).

```text
[x] planned / active / resolved / abandoned with guarded transitions (author decides)
[x] Importance 1–5, chapter links (introduced/resolved) verified same-novel
[x] Status counts as calm summary, never a score (SOUL.md #31)
[x] plot_points deferred (YAGNI)
```

---

## Task 9.2 — Timeline

Implemented: `src/features/timeline/` (repository, service), dialogs + vertical
timeline view in `plot/` studio, same migration 010 (applied live on Supabase).

```text
[x] Full timeline UI: chronological list with chapter/location links
[x] Flexible precision: exact/day/month/year/relative/unknown; "unknown" valid (SOUL.md #15)
[x] Dated precision requires date_value; relative requires relative_time
```

---

## Task 9.3 — Story Doctor

Implemented: `src/features/doctor/` (deterministic analyzers + service),
`src/server/actions/doctor.ts`, `src/app/(workspace)/workspace/[novelId]/doctor/`
(page + view), prompt `buildStoryDoctorPrompt` + `STORY_DOCTOR_SYSTEM`.
No migration, no score, read-only — SOUL.md #14 (diagnose, don't dictate).

```text
[x] 6 sections: plot / character_arcs / pacing / plot_threads / worldbuilding / unresolved_questions
[x] Deterministic analyzers, evidence-bound, tentative language (SOUL.md #12-14)
[x] AI enrichment optional, guarded: enriches wording of existing findings only, never invents new ones or scores
[x] UI: run-on-demand report, filter per section, evidence badges, tentative language
```

---

## Task 9.4 — Hierarchical Summaries

Build:

```text
Scene Summary
 ↓
Chapter Summary
 ↓
Act Summary
 ↓
Novel Summary
```

These become long-novel context layers.

---

## Task 9.5 — Automatic Memory Proposals

After scene save:

```text
Scene
 ↓
AI extraction
 ↓
candidate memories
 ↓
deduplication
 ↓
author confirmation
```

Do not auto-confirm initially.

---

# PHASE 10 — Export

Implement:

```text
Markdown
TXT
```

Then:

```text
DOCX
PDF
EPUB
```

Export must respect:

- chapter order;
- scene order;
- formatting;
- manuscript content.

---

# PHASE 11 — Polish

Focus on:

- keyboard shortcuts;
- command palette;
- search;
- loading states;
- empty states;
- accessibility;
- responsive behavior;
- error recovery;
- performance.

---

# PHASE 12 — Deployment

## Production Stack

Recommended:

```text
Frontend / App
    ↓
Next.js hosting

Database
    ↓
PostgreSQL + pgvector

Auth
    ↓
Supabase Auth

Storage
    ↓
Object Storage

AI
    ↓
AI Provider
```

---

# 5. Vertical Slice Strategy

Do not build all backend models first.

The first vertical slice should be:

```text
AUTH
 ↓
CREATE NOVEL
 ↓
CREATE CHAPTER
 ↓
CREATE SCENE
 ↓
WRITE
 ↓
AUTOSAVE
 ↓
RELOAD
 ↓
CONTINUE
```

This proves the core product.

---

# 6. First Coding Milestone

The first meaningful milestone is:

> **A user can create a novel and reliably write a scene.**

Success demonstration:

```text
1. Sign in
2. Create "My First Novel"
3. Create Act I
4. Create Chapter 1
5. Create Scene 1
6. Write 500 words
7. Close browser
8. Return
9. Open Scene 1
10. All 500 words remain
```

If this works, the foundation is valid.

---

# 7. AI Milestone

The first AI milestone:

```text
User writes Scene
       ↓
Ask:
"Help me continue this scene."
       ↓
Context Builder
       ↓
Relevant story facts
       ↓
AI
       ↓
Suggestion
       ↓
User inserts suggestion
```

The AI must not modify the manuscript automatically.

---

# 8. Database Migration Milestones

Do not run every possible migration at project creation.

### Migration Set A

```text
extensions
user_profiles
novels
acts
chapters
scenes
scene_versions
```

### Migration Set B

```text
characters
character_relationships
locations
world_rules
```

### Migration Set C

```text
world_lore
plot_threads
plot_points
timeline_events
```

### Migration Set D

```text
story_memories
AI tables
vector index
```

### Migration Set E

```text
consistency
usage
future analytics
```

---

# 9. Suggested Repository Milestones

```text
M0 — Empty repository
M1 — App shell
M2 — Authentication
M3 — Novel CRUD
M4 — Outline
M5 — Editor
M6 — Versioning
M7 — Characters / World
M8 — Story Memory
M9 — AI Assistant
M10 — Consistency
M11 — Story Doctor
M12 — Export
M13 — Production
```

---

# 10. Suggested Git Commit Sequence

Example:

```text
chore: initialize next.js project
chore: configure typescript and lint
chore: add design system foundation

feat: add authentication
feat: add novel library
feat: add novel creation flow

feat: add acts
feat: add chapters
feat: add scenes
feat: add outline navigation

feat: add tiptap editor
feat: add scene autosave
feat: add scene version history
feat: add focus mode

feat: add character management
feat: add character relationships
feat: add world rules
feat: add locations

feat: add story memory
feat: add embeddings
feat: add semantic retrieval

feat: add ai provider abstraction
feat: add ai context builder
feat: add ai writing assistant

feat: add consistency checker
feat: add story doctor
```

Keep commits coherent.

---

# 11. Agent Execution Rules

When delegating a phase to an agent:

Provide:

```text
1. Phase
2. Task
3. Relevant documentation
4. Acceptance criteria
5. Constraints
```

Example:

```text
Implement Task 4.4 — Autosave.

Read:
- SOUL.md
- AGENTS.md
- docs/design.md
- docs/architecture.md

Requirements:
- debounce persistence
- preserve local content on failure
- show saving/saved/error state
- no API request on every keystroke

Acceptance:
- typing remains responsive
- content persists after reload
- failed save does not lose draft
- tests pass
```

---

# 12. What Agents Must Not Do

Without explicit instruction, agents must not:

- replace the framework;
- redesign architecture;
- introduce microservices;
- change database provider;
- add a new AI provider;
- rewrite unrelated modules;
- remove existing tests;
- delete user data;
- change manuscript semantics;
- expose secrets.

---

# 13. Decision Gates

Before moving between major phases:

## Gate A

After Phase 4:

> Can users reliably write?

If no:

```text
stop
fix editor
```

## Gate B

After Phase 6:

> Can the application represent story knowledge reliably?

If no:

```text
fix story model
```

## Gate C

After Phase 7:

> Does AI actually use story context?

If no:

```text
fix context engine
```

Do not add more AI features.

## Gate D

After Phase 8:

> Are consistency findings explainable?

If no:

```text
fix evidence/source system
```

---

# 14. MVP Definition

The first public MVP consists of:

```text
Authentication
+
Novel Library
+
Novel Structure
+
Writing Editor
+
Characters
+
World Rules
+
Story Memory
+
AI Assistant
+
Basic Consistency Checker
```

Everything else can wait.

---

# 15. Explicitly Deferred

Do not implement initially:

```text
Real-time collaboration
Social network
Public publishing
Native mobile apps
Marketplace
AI image generation
Voice generation
Complex analytics
Automatic full-novel generation
Advanced billing
Enterprise permissions
```

---

# 16. MVP Quality Bar

The MVP does not need hundreds of features.

It must feel:

```text
Reliable
Fast
Calm
Understandable
Safe
Useful
```

A small reliable writing workspace is better than a large unstable AI platform.

---

# 17. Final Implementation Sequence

```text
                 DOCUMENTATION
                      │
                      ▼
               PROJECT SETUP
                      │
                      ▼
                    AUTH
                      │
                      ▼
                NOVEL LIBRARY
                      │
                      ▼
               STORY STRUCTURE
                      │
                      ▼
                WRITING EDITOR
                      │
                      ▼
             CHARACTERS + WORLD
                      │
                      ▼
                STORY MEMORY
                      │
                      ▼
                CONTEXT ENGINE
                      │
                      ▼
                 AI ASSISTANT
                      │
                      ▼
             CONSISTENCY ENGINE
                      │
                      ▼
                STORY DOCTOR
                      │
                      ▼
                   EXPORT
                      │
                      ▼
                 DEPLOYMENT
```

The order is intentional.

**Do not move AI ahead of the writing foundation.**

---

# 18. First Task to Execute

The first implementation task is:

```text
PHASE 0
TASK 0.1
Initialize Repository
```

Then:

```text
TASK 0.2
Install Core Dependencies
```

Then:

```text
TASK 0.3
Establish Folder Structure
```

Then:

```text
TASK 0.4
Environment Setup
```

Then:

```text
TASK 0.5
Design System Foundation
```

Only after Phase 0 passes should Phase 1 begin.

---

# 19. Final Principle

Build the product in the same way the product helps writers build novels:

```text
Start with the foundation.
Build structure.
Work in small scenes.
Keep continuity.
Review often.
Protect what already exists.
Then add complexity.
```

The codebase should follow the same discipline as the writing workflow it is designed to support.

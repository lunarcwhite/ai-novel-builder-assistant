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

# PHASE 5 — Characters & World

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

## PHASE 5 EXIT CRITERIA

User can construct:

```text
Characters
Relationships
Locations
World Rules
```

and connect them to scenes.

---

# PHASE 6 — Story Memory

## Goal

Build the foundation that makes AI context-aware.

This is the second major architectural milestone.

---

## Task 6.1 — Story Memory Table

Implement:

```text
story_memories
```

---

## Task 6.2 — Memory UI

Display:

```text
Confirmed
Proposed
Rejected
Archived
```

---

## Task 6.3 — Manual Memory Creation

User can explicitly save:

```text
Story Fact
Character Fact
World Fact
Timeline Fact
Plot Fact
Relationship Fact
```

---

## Task 6.4 — Embedding Infrastructure

Implement:

```text
EmbeddingService
```

Provider abstraction:

```text
EmbeddingProvider
```

Do not tightly couple this to one AI provider.

---

## Task 6.5 — Vector Storage

Store embedding in:

```text
story_memories.embedding
```

Create vector index.

---

## Task 6.6 — Semantic Retrieval

Implement:

```text
MemoryRepository.searchSimilar()
```

Input:

```text
novel_id
query_embedding
filters
limit
```

---

## Task 6.7 — Memory Deduplication

When creating a new memory:

```text
candidate
 ↓
similarity search
 ↓
possible duplicate?
```

If yes:

```text
show conflict/duplicate
```

Do not automatically overwrite.

---

## Task 6.8 — Memory Source

Every proposed memory should identify source:

```text
chapter
scene
manual
```

---

## PHASE 6 EXIT CRITERIA

The system can:

```text
Create memory
 ↓
Embed
 ↓
Store
 ↓
Search semantically
 ↓
Show source
```

---

# PHASE 7 — AI Assistant

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

```text
Open scene
 ↓
Ask AI
 ↓
AI retrieves relevant story context
 ↓
AI responds
 ↓
User decides what to insert
```

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

---

# PHASE 9 — Story Intelligence

This phase extends the MVP toward the full product vision.

---

## Task 9.1 — Plot Threads

Implement:

```text
planned
active
resolved
abandoned
```

---

## Task 9.2 — Timeline

Implement full timeline UI.

---

## Task 9.3 — Story Doctor

Analyze:

```text
Plot
Character Arcs
Pacing
Plot Threads
Worldbuilding
Unresolved Questions
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

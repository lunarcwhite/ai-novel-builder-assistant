# PRD — AI Novel Writing Workspace

**Status:** Draft  
**Version:** 0.1  
**Product name:** TBD  
**Working description:** AI-powered workspace for planning, writing, organizing, and analyzing novels.

---

## 1. Product Vision

Membangun aplikasi yang membantu penulis novel mengubah ide menjadi novel yang terstruktur dan konsisten.

Aplikasi bukan sekadar AI text generator. Fokus utamanya adalah menjadi **workspace penulisan novel dengan story intelligence**:

> Penulis tetap menjadi author. AI memahami cerita, mengingat konteks, membantu menulis, dan menjaga konsistensi.

---

## 2. Problem Statement

Penulis novel biasanya menggunakan banyak alat terpisah:

- notes untuk ide
- dokumen untuk menulis
- spreadsheet untuk karakter
- aplikasi lain untuk timeline
- chat AI untuk brainstorming
- catatan manual untuk worldbuilding

Akibatnya:

1. informasi cerita tersebar;
2. detail karakter mudah terlupakan;
3. timeline dapat bertentangan;
4. plot thread dapat terbengkalai;
5. AI tidak memahami keseluruhan novel;
6. revisi novel panjang menjadi sulit.

Aplikasi ini menyatukan semuanya dalam satu workspace.

---

## 3. Target Users

### Primary Persona — Independent Novel Writer

Penulis individu yang sedang:

- membuat novel pertama;
- menulis novel secara rutin;
- mengembangkan cerita fantasy, romance, mystery, thriller, sci-fi, atau genre lain;
- membutuhkan bantuan AI tetapi tetap ingin mengontrol cerita.

### Secondary Persona — Experienced Writer

Penulis yang sudah mempunyai workflow sendiri tetapi membutuhkan:

- continuity checking;
- character tracking;
- timeline management;
- story analysis;
- AI-assisted revision.

---

## 4. Product Principles

### 4.1 Author First

AI tidak boleh mengambil alih kendali kreatif.

### 4.2 Story Is the Source of Truth

Informasi yang telah ditetapkan penulis menjadi sumber utama konteks AI.

### 4.3 Structured + Creative

Cerita harus dapat disimpan sebagai struktur terorganisir sekaligus teks bebas.

### 4.4 Context-Aware AI

AI harus mengetahui konteks novel, chapter, scene, karakter, timeline, dan worldbuilding yang relevan.

### 4.5 Non-Destructive AI

AI tidak boleh mengganti tulisan pengguna tanpa persetujuan.

### 4.6 Explainable Suggestions

Ketika AI mendeteksi masalah, AI harus menjelaskan alasan dan sumber konteksnya.

---

# 5. Core Product Loop

```text
IDEA
  ↓
STORY DEVELOPMENT
  ↓
CHARACTERS + WORLD
  ↓
OUTLINE
  ↓
SCENES
  ↓
WRITING
  ↓
AI ASSISTANCE
  ↓
STORY ANALYSIS
  ↓
REVISION
  ↓
FINISHED NOVEL
```

---

# 6. MVP Scope

MVP harus fokus pada workflow inti.

## 6.1 Authentication

- Sign up
- Login
- Logout
- Password reset
- Basic profile

## 6.2 Novel Management

User dapat:

- membuat novel;
- mengubah judul;
- mengubah genre;
- mengubah premise;
- mengubah tone;
- mengubah theme;
- menghapus novel;
- melihat daftar novel.

Novel memiliki status:

- Planning
- Writing
- Revising
- Completed
- Archived

---

# 7. Novel Overview

Dashboard novel menampilkan:

```text
Novel Title
Genre
Status
Word Count
Chapter Count
Character Count
Last Updated
```

Selain itu:

### Story Snapshot

- premise
- central conflict
- theme
- target tone

### Writing Progress

```text
Words: 42,350
Chapters: 18 / 40
Progress: 45%
```

---

# 8. Character Management

Setiap karakter memiliki:

```text
Name
Role
Age
Occupation
Description
Personality
Motivation
Goal
Fear
Strength
Weakness
Secret
Backstory
Character Arc
```

### Character Relationships

Relasi:

```text
Character A
   ↓
relationship
   ↓
Character B
```

Contoh:

- friend
- enemy
- sibling
- parent
- romantic interest
- mentor
- rival
- custom

Relationship dapat memiliki:

- description
- history
- current state
- important events

---

# 9. Worldbuilding

World terdiri dari beberapa entity.

### Locations

```text
Name
Description
Geography
Atmosphere
Important Events
Characters Associated
```

### Factions

```text
Name
Purpose
Leader
Members
Allies
Enemies
```

### World Rules

Contoh:

```text
Magic can only be used by Moon Blood descendants.
```

Rules bersifat penting karena digunakan oleh consistency checker.

### Lore

Informasi bebas tentang:

- history
- religion
- mythology
- culture
- technology
- magic
- politics

---

# 10. Plot & Outline

Struktur:

```text
Novel
 ├── Act
 │    ├── Chapter
 │    │    ├── Scene
 │    │    └── Scene
 │    └── Chapter
 └── Act
```

## Chapter

Setiap chapter memiliki:

- title
- summary
- objective
- conflict
- emotional beat
- important events
- outcome
- chapter status

## Scene

Setiap scene memiliki:

- title
- summary
- purpose
- POV character
- location
- characters
- conflict
- emotional state
- notes
- scene content

---

# 11. Writing Editor

Editor adalah tempat utama penulis bekerja.

Requirement:

- rich text;
- autosave;
- word count;
- chapter navigation;
- scene navigation;
- undo/redo;
- version history;
- focus mode;
- keyboard shortcuts.

AI actions:

```text
Continue
Rewrite
Expand
Shorten
Improve Prose
Improve Dialogue
Change Tone
Show Don't Tell
Summarize
Critique
```

AI tidak langsung menimpa tulisan.

Hasil AI harus dapat:

- insert;
- replace selected text;
- copy;
- discard.

---

# 12. AI Assistant

AI Assistant tersedia sebagai panel kontekstual.

Jika user sedang berada di:

```text
Novel A
→ Chapter 12
→ Scene 3
```

AI mengetahui konteks tersebut.

User dapat bertanya:

> Apakah keputusan karakter ini konsisten dengan perkembangan sebelumnya?

atau:

> Berikan tiga kemungkinan konflik untuk scene berikutnya.

---

# 13. Story Memory

Ini merupakan salah satu fitur inti.

Story memory menyimpan fakta yang dianggap penting bagi novel.

Contoh:

```text
FACT

Anna's brother died when Anna was 12.

Source:
Chapter 2
```

Jenis memory:

- Character Fact
- World Fact
- Timeline Fact
- Plot Fact
- Relationship Fact
- General Story Fact

Setiap memory memiliki:

```text
content
type
importance
source
confidence
created_at
updated_at
```

---

# 14. AI Context Retrieval

AI tidak menerima seluruh novel setiap kali.

Context builder mengambil informasi relevan:

```text
User Request
      ↓
Context Resolver
      ↓
┌─────────────────────────┐
│ Current Scene            │
│ Current Chapter         │
│ Characters               │
│ World Rules              │
│ Timeline Events          │
│ Relevant Story Memories  │
│ Previous Scenes          │
└────────────┬────────────┘
             ↓
          LLM Prompt
```

---

# 15. Story Memory Architecture

MVP menggunakan PostgreSQL + pgvector.

Setiap memory dapat memiliki embedding.

Contoh:

```text
story_memories
----------------------------
id
novel_id
type
content
source_type
source_id
importance
embedding
created_at
updated_at
```

Semantic retrieval digunakan untuk menemukan fakta relevan.

---

# 16. AI Memory Extraction

Setelah user menulis atau mengubah scene, sistem dapat menganalisis apakah ada fakta baru.

Contoh:

User menulis:

> Daniel had never visited the city before.

AI dapat mengusulkan:

```text
New story fact detected:

"Daniel has never visited the city before."

[Save to Story Memory]
[Ignore]
```

Untuk MVP, memory extraction sebaiknya membutuhkan persetujuan user untuk menghindari memory yang salah.

---

# 17. Consistency Checker

User dapat menjalankan:

> Check Consistency

Sistem mencari:

### Character contradictions

Contoh:

```text
Chapter 4:
Daniel is described as an only child.

Chapter 19:
Daniel mentions his older sister.

Potential contradiction.
```

### Timeline contradictions

```text
Chapter 12:
The event happened three months ago.

Timeline:
Event occurred 18 days ago.
```

### World rule contradictions

```text
World Rule:
Only Moon Blood descendants can use magic.

Chapter 27:
A non-descendant uses magic.

Potential contradiction.
```

AI harus menggunakan bahasa seperti:

> Potential inconsistency

bukan langsung menyatakan cerita salah.

---

# 18. Story Doctor

Story Doctor adalah fitur post-MVP yang menganalisis novel secara keseluruhan.

Kategori:

### Plot

- progression
- escalation
- climax
- resolution

### Character

- motivation
- character arc
- development
- consistency

### Pacing

- slow sections
- rushed sections
- chapter density

### Plot Threads

- active threads
- resolved threads
- potentially abandoned threads

### Worldbuilding

- rule consistency
- unexplained concepts
- contradictions

Output harus berupa temuan dan evidence, bukan rating kualitas absolut.

---

# 19. Timeline

Timeline menyimpan event:

```text
Event
Date / Relative Time
Characters
Location
Description
Source Chapter
```

Timeline dapat ditampilkan:

```text
Chapter 1
   │
   ├── Anna meets Daniel
   │
Chapter 4
   │
   ├── Anna discovers supernatural ability
   │
Chapter 9
   │
   └── Daniel reveals his secret
```

---

# 20. Relationship Map

Visualisasi karakter:

```text
Anna
 ├── loves → Daniel
 ├── trusts → Maya
 └── fears → The Stranger
```

Relationship dapat berubah sepanjang cerita.

Untuk MVP, data relationship disimpan terlebih dahulu. Visual graph dapat menjadi V2.

---

# 21. Version History

Setiap chapter dapat mempunyai versions:

```text
Version 1
Version 2
Version 3
Current
```

User dapat:

- compare;
- restore;
- view changes.

AI edits juga harus dapat ditelusuri.

---

# 22. Export

MVP:

- TXT
- Markdown

Post-MVP:

- DOCX
- PDF
- EPUB

---

# 23. Non-Functional Requirements

## Performance

Target:

- editor terasa realtime;
- autosave tidak mengganggu pengetikan;
- AI request memiliki loading state;
- retrieval tetap cepat ketika novel sudah panjang.

## Reliability

- autosave;
- database backup;
- version history;
- no destructive AI overwrite.

## Privacy

Novel merupakan data privat secara default.

Aplikasi harus menjelaskan:

- bagaimana novel diproses;
- apakah data digunakan untuk training model;
- bagaimana data dihapus.

---

# 24. Recommended Technical Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TipTap

## Backend

MVP:

- Next.js server actions / API routes

Tidak perlu microservices pada tahap awal.

## Database

- PostgreSQL
- pgvector

## Authentication

- Auth.js atau Supabase Auth

## Storage

- Supabase Storage atau object storage yang kompatibel

## AI

Buat abstraction layer:

```text
AIProvider
 ├── OpenAI
 ├── Anthropic
 └── Other Provider
```

Dengan demikian aplikasi tidak terkunci pada satu provider.

---

# 25. Initial Database Entities

```text
users

novels

characters
character_relationships

locations
factions
world_rules
world_lore

acts
chapters
scenes

plot_threads
plot_points

timeline_events

story_memories

ai_conversations
ai_messages

document_versions
```

---

# 26. High-Level Data Relationship

```text
User
 │
 └── Novel
      │
      ├── Characters
      │     └── Relationships
      │
      ├── World
      │     ├── Locations
      │     ├── Factions
      │     ├── Rules
      │     └── Lore
      │
      ├── Plot
      │     ├── Acts
      │     ├── Plot Points
      │     └── Plot Threads
      │
      ├── Chapters
      │     └── Scenes
      │
      ├── Timeline
      │
      ├── Story Memories
      │
      └── AI Conversations
```

---

# 27. MVP User Flow

```text
Sign Up
   ↓
Create Novel
   ↓
Enter Basic Story Idea
   ↓
Create Story Foundation
   ↓
Create Characters
   ↓
Create World
   ↓
Create Outline
   ↓
Create Chapter
   ↓
Create Scene
   ↓
Write
   ↓
Use AI Assistant
   ↓
Save Story Memories
   ↓
Check Consistency
   ↓
Revise
```

---

# 28. MVP Acceptance Criteria

MVP dianggap usable apabila user dapat:

- membuat akun;
- membuat novel;
- membuat karakter;
- membuat world rules;
- membuat outline;
- membuat chapter;
- membuat scene;
- menulis novel;
- menggunakan AI untuk membantu penulisan;
- menyimpan story memory;
- bertanya kepada AI berdasarkan konteks novel;
- menjalankan basic consistency check;
- melihat dan memulihkan version history;
- mengekspor tulisan.

---

# 29. Development Roadmap

## Phase 0 — Foundation

- repository
- project setup
- authentication
- database
- design system
- AI provider abstraction

## Phase 1 — Core Writing

- novel CRUD
- chapter CRUD
- scene CRUD
- TipTap editor
- autosave
- word count
- version history

## Phase 2 — Story Structure

- characters
- relationships
- locations
- world rules
- plot
- outline
- timeline

## Phase 3 — AI

- AI chat
- writing actions
- context builder
- story memory
- semantic retrieval

## Phase 4 — Intelligence

- consistency checker
- plot thread tracking
- character arc analysis
- Story Doctor

## Phase 5 — Productization

- export
- sharing
- collaboration
- billing
- usage limits
- analytics

---

# 30. MVP Deliberately Excluded

Untuk menjaga scope:

- social network;
- public publishing platform;
- real-time collaboration;
- mobile native application;
- marketplace;
- AI image generation;
- voice generation;
- advanced analytics;
- automated full-novel generation.

Semua dapat dipertimbangkan setelah core writing workflow terbukti berguna.

---

# 31. Key Product Metric

Jangan menggunakan jumlah AI generations sebagai metric utama.

Lebih penting:

### Writing Activation

Persentase user yang membuat novel dan menulis scene pertama.

### Writing Retention

Apakah user kembali menulis beberapa hari kemudian.

### Novel Progress

Jumlah chapter / words yang berkembang.

### AI Helpfulness

Apakah AI membantu user menyelesaikan pekerjaan, bukan sekadar menghasilkan banyak teks.

### Story Integrity

Jumlah consistency issues yang ditemukan dan diselesaikan.

---

# 32. Product Philosophy

Produk ini harus menghindari pola:

```text
User:
"Write me a novel."

AI:
"Here is your novel."
```

Sebaliknya:

```text
Author
  ↓
Idea
  ↓
Structure
  ↓
Writing
  ↓
Reflection
  ↓
Revision
  ↓
Novel
```

AI berada di sepanjang proses sebagai:

- brainstorming partner;
- writing assistant;
- editor;
- continuity checker;
- story analyst.

Tetapi keputusan kreatif tetap berada pada penulis.

---

# 33. Future Direction

Jika MVP berhasil, produk dapat berkembang menjadi:

```text
Novel Workspace
       ↓
Story Intelligence
       ↓
AI Writing Partner
       ↓
Publishing Workspace
```

Visi jangka panjang:

> Satu tempat di mana seorang penulis dapat membawa sebuah ide mentah sampai menjadi novel yang selesai, tanpa kehilangan kendali atas cerita dan tanpa kehilangan detail yang telah dibangun sepanjang proses.

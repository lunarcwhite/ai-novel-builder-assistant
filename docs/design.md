# DESIGN.md — AI Novel Writing Workspace

**Status:** Draft  
**Version:** 0.1  
**Related document:** `prd.md`

---

# 1. Design Vision

Aplikasi harus terasa seperti **creative workspace**, bukan dashboard bisnis dan bukan chatbot.

Tujuan visual:

> Membuat penulis merasa bahwa mereka sedang masuk ke ruang kerja pribadi untuk membangun sebuah dunia.

Karakter desain:

- calm
- elegant
- editorial
- focused
- immersive
- minimal
- warm
- sophisticated

Interface harus menghilangkan distraksi ketika menulis, tetapi tetap menyediakan struktur yang kuat ketika penulis sedang merencanakan cerita.

---

# 2. Design Principles

## 2.1 Writing Comes First

Editor adalah pusat pengalaman.

Jangan membuat UI terasa seperti admin panel.

Hindari terlalu banyak:

- cards
- badges
- charts
- colored indicators
- buttons

ketika user sedang menulis.

---

## 2.2 Progressive Complexity

Informasi sederhana ditampilkan terlebih dahulu.

Fitur advanced muncul ketika dibutuhkan.

Contoh:

```text
Chapter
 └── Scene
      └── Writing
           └── AI
                └── Advanced Context
```

---

## 2.3 Calm Interface

Gunakan whitespace yang cukup.

Elemen UI tidak boleh bersaing dengan teks novel.

---

## 2.4 Contextual AI

AI harus terasa seperti bagian dari workspace.

Jangan membuat pengalaman:

```text
ChatGPT clone
```

Sebaliknya:

```text
Writing Workspace
             │
             └── AI Companion
```

---

## 2.5 Author Ownership

AI suggestion selalu bersifat reversible.

Tidak boleh:

```text
AI → silently modifies manuscript
```

Harus:

```text
AI Suggestion
   ↓
Review
   ↓
Accept / Insert / Replace / Dismiss
```

---

# 3. Visual Direction

## Overall Style

Referensi karakter visual:

- modern editorial software
- digital writing studio
- premium note-taking application
- subtle literary atmosphere

Tidak menggunakan aesthetic "AI neon".

Hindari:

- excessive gradients
- glowing borders
- futuristic neon
- overly rounded cards
- excessive glassmorphism

---

# 4. Color System

Gunakan warna netral sebagai fondasi.

### Light Mode

```text
Background
#F8F7F4

Surface
#FFFFFF

Primary Text
#1F1F1F

Secondary Text
#6B6A67

Border
#E7E4DE

Muted
#F0EEE9

Accent
#6D5A45
```

Accent digunakan secukupnya.

### Dark Mode

```text
Background
#151515

Surface
#1D1D1D

Primary Text
#F1F0EC

Secondary Text
#A5A29B

Border
#30302E

Muted
#242422

Accent
#B49A78
```

Dark mode harus terasa seperti writing environment, bukan dashboard gelap.

---

# 5. Typography

Gunakan kombinasi sans-serif + serif.

## UI

Contoh:

- Inter
- Geist
- Manrope

## Manuscript

Gunakan serif yang nyaman dibaca:

- Source Serif 4
- Literata
- Lora
- Georgia sebagai fallback

Prinsip:

```text
UI → Sans Serif
Writing → Serif
```

---

# 6. Spacing

Base spacing:

```text
4px
8px
12px
16px
24px
32px
48px
64px
```

Editor membutuhkan whitespace lebih besar daripada UI management.

---

# 7. Application Shell

Layout utama:

```text
┌──────────────────────────────────────────────────────────┐
│ Logo       Novel Name                     Search  Avatar │
├───────────────┬──────────────────────────────┬───────────┤
│               │                              │           │
│ NAVIGATION    │       MAIN CONTENT           │ AI PANEL  │
│               │                              │           │
│ Story         │                              │           │
│ Writing       │                              │           │
│ Characters    │                              │           │
│ World         │                              │           │
│ Timeline      │                              │           │
│               │                              │           │
│ Analysis      │                              │           │
│               │                              │           │
└───────────────┴──────────────────────────────┴───────────┘
```

Sidebar dapat collapse.

AI panel juga dapat collapse.

---

# 8. Main Navigation

Navigation utama:

```text
NOVEL

Overview
Outline
Chapters

STORY

Characters
Relationships
World
Timeline

TOOLS

AI Assistant
Story Doctor
Consistency

SYSTEM

Settings
```

Gunakan grouping daripada daftar panjang.

---

# 9. Dashboard / Novel Overview

Tujuan halaman ini bukan menampilkan analytics sebanyak mungkin.

Tujuannya:

> Memberikan gambaran singkat tentang keadaan novel.

Layout:

```text
┌─────────────────────────────────────────────────────┐
│ The Name of the Novel                               │
│ Fantasy · Mystery · Draft                           │
│                                                     │
│ "A young woman discovers..."                       │
│                                                     │
│ [Continue Writing]                                  │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 42,350       │ 18           │ 63%          │
│ Words        │ Chapters     │ Progress     │
└──────────────┴──────────────┴──────────────┘

Recent Activity

Chapter 18
Updated 10 minutes ago

Chapter 17
Updated yesterday
```

---

# 10. Outline View

Outline harus terasa seperti struktur cerita.

```text
Novel
│
├── ACT I — The Beginning
│   ├── Chapter 1
│   │   ├── Scene 1
│   │   └── Scene 2
│   │
│   ├── Chapter 2
│   └── Chapter 3
│
├── ACT II — Discovery
│   ├── Chapter 4
│   └── Chapter 5
│
└── ACT III — Resolution
```

Interaction:

- drag & drop
- collapse / expand
- rename
- add chapter
- add scene
- duplicate
- move

---

# 11. Chapter Workspace

Ketika user membuka chapter:

```text
┌─────────────────────────────────────────────────────────┐
│ ← Chapters                     Chapter 12       ⋮        │
├─────────────┬───────────────────────────┬───────────────┤
│ SCENES      │                           │               │
│             │                           │               │
│ Scene 1     │      Chapter Title        │ AI            │
│ Scene 2     │                           │               │
│ Scene 3 ●   │  Manuscript text...       │ Context       │
│ Scene 4     │                           │               │
│             │  Manuscript text...       │ Suggestions   │
│ + Add Scene │                           │               │
│             │                           │               │
└─────────────┴───────────────────────────┴───────────────┘
```

---

# 12. Writing Editor

Editor harus menjadi area paling bersih.

Default:

```text
                    Chapter Twelve

         Anna stopped at the end of the hallway.

         Something was wrong.

         She could hear someone breathing...
```

Toolbar tidak selalu terlihat.

Muncul ketika text dipilih:

```text
Rewrite | Expand | Improve | Dialogue | AI
```

---

# 13. Focus Mode

Focus mode menghilangkan:

- sidebar
- AI panel
- navigation
- unnecessary toolbar

Menjadi:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│             Chapter Twelve                  │
│                                             │
│       Anna stopped walking.                 │
│                                             │
│       Something was wrong.                  │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

Escape untuk kembali.

---

# 14. AI Assistant

AI panel:

```text
┌───────────────────────────────┐
│ AI Assistant                  │
│                               │
│ Context                       │
│ Chapter 12 · Scene 3          │
│                               │
│ ───────────────────────────   │
│                               │
│ How can I help?               │
│                               │
│ [ Ask about this scene... ]   │
│                               │
│ Suggestions                   │
│                               │
│ Continue scene                │
│ Improve dialogue              │
│ Check character consistency   │
│ Find possible conflict        │
└───────────────────────────────┘
```

---

# 15. AI Response Design

AI jangan menampilkan response seperti chat biasa jika sedang melakukan editing.

Contoh:

```text
AI Suggestion

The dialogue could be made more tense by
reducing exposition and allowing the characters
to imply what they already know.

[Insert suggestion]
[Replace selection]
[Copy]
[Dismiss]
```

---

# 16. Character Studio

Character page:

```text
┌──────────────────────────────────────────────────┐
│ Anna                                              │
│ Protagonist · 21                                  │
├──────────────────────┬───────────────────────────┤
│ Profile              │ Character Arc             │
│                      │                           │
│ Motivation           │ Beginning                 │
│ Fear                 │     ↓                     │
│ Goal                 │ Discovery                 │
│ Secret               │     ↓                     │
│ Personality          │ Acceptance                │
│                      │                           │
└──────────────────────┴───────────────────────────┘
```

Tabs:

```text
Overview
Arc
Relationships
Appearances
Notes
```

---

# 17. Character Relationship View

Simple graph:

```text
                 Daniel
                    │
                  loves
                    │
                    ▼
Anna ─────────── trusts ─────────── Maya
 │
 │ fears
 ▼
The Stranger
```

Relationship edge dapat diklik.

---

# 18. World Studio

World page menggunakan tab:

```text
Overview
Locations
Factions
Rules
Lore
```

Contoh World Rule:

```text
MAGIC RULE #04

Only Moon Blood descendants can use magic.

Source:
Author-defined rule

Used by:
7 characters
12 scenes
```

Ini juga membantu menunjukkan bahwa rule benar-benar dipakai oleh cerita.

---

# 19. Timeline UI

Timeline horizontal:

```text
Chapter 1       Chapter 5       Chapter 12
   │                │                │
   ●────────────────●────────────────●
   │                │                │
Meet Daniel     First fight      Hospital
```

Event card:

```text
Hospital Incident

Day 47

Characters:
Anna · Daniel

Location:
St. Mary's Hospital
```

---

# 20. Consistency UI

Jangan tampilkan sebagai "score".

Gunakan findings.

```text
Consistency Check

3 potential issues found

──────────────────────────────

Potential Timeline Conflict

Chapter 31 says:
"The incident happened three months ago."

Timeline says:
18 days ago.

[Review]

──────────────────────────────

Potential Character Conflict

Chapter 4:
Daniel is described as an only child.

Chapter 19:
Daniel mentions his sister.

[Review]
```

---

# 21. Story Doctor UI

Story Doctor menggunakan sections:

```text
Story Analysis

Plot
Character Arcs
Pacing
Plot Threads
Worldbuilding
Unresolved Questions
```

Temuan:

```text
Pacing Observation

Chapters 18–22 contain significantly fewer
major events than the surrounding chapters.

Evidence:
Chapter 17
Chapter 18
Chapter 19
Chapter 20
Chapter 21
Chapter 22
Chapter 23

[Inspect Chapters]
```

Tidak menggunakan:

```text
Story Score: 72/100
```

karena cerita bersifat subjektif.

---

# 22. Story Memory UI

Memory harus transparan.

```text
Story Memory

Character Fact
──────────────────────────
Anna's brother died when
Anna was 12.

Source:
Chapter 2

[Edit] [Delete]
```

Untuk AI-generated memory:

```text
New memory detected

"Daniel has never visited the city before."

Source:
Chapter 14

[Save]
[Ignore]
```

---

# 23. Search

Global search harus mencari:

- chapter
- scene
- character
- location
- world rule
- timeline event
- story memory

Command palette:

```text
⌘ K

Search your novel...

Chapter 12
Anna
Hospital
Moon Blood
"Daniel has never..."
```

---

# 24. Empty States

Empty state harus membantu user mulai bekerja.

Contoh:

```text
No characters yet.

Your story will become easier to manage
once its characters have a place to live.

[Create Character]
[Let AI Help]
```

Hindari:

> No data found.

---

# 25. Interaction Patterns

## Save

Autosave:

```text
Saving...
Saved ✓
```

Tidak perlu tombol Save besar.

## Destructive Action

Delete harus membutuhkan confirmation.

## AI Action

Semua AI modification dapat di-undo.

---

# 26. Responsive Design

Desktop-first karena novel writing membutuhkan layar besar.

### Desktop

3-column workspace:

```text
Sidebar | Editor | AI
```

### Tablet

```text
Sidebar | Editor
         AI drawer
```

### Mobile

Mobile bukan full writing environment pada MVP.

Fokus:

- reading
- outline
- notes
- quick edits
- AI brainstorming

Editor mobile tetap tersedia tetapi bukan primary experience.

---

# 27. Component Architecture

Recommended UI structure:

```text
components/
├── layout/
│   ├── AppShell
│   ├── Sidebar
│   ├── Topbar
│   └── CommandPalette
│
├── editor/
│   ├── NovelEditor
│   ├── EditorToolbar
│   ├── SceneNavigator
│   └── FocusMode
│
├── ai/
│   ├── AIPanel
│   ├── AIMessage
│   ├── AISuggestion
│   └── AIAction
│
├── story/
│   ├── CharacterCard
│   ├── RelationshipGraph
│   ├── Timeline
│   └── StoryMemory
│
└── analysis/
    ├── ConsistencyFinding
    ├── StoryDoctor
    └── PlotThread
```

---

# 28. Design Tokens

Gunakan centralized tokens:

```text
--color-background
--color-surface
--color-text
--color-muted
--color-border
--color-accent

--font-ui
--font-editor

--radius-sm
--radius-md
--radius-lg

--space-xs
--space-sm
--space-md
--space-lg
--space-xl
```

Jangan hardcode style di setiap component.

---

# 29. Accessibility

Target minimal:

- keyboard navigation;
- visible focus;
- sufficient contrast;
- semantic HTML;
- screen-reader labels;
- resizable editor text;
- reduced motion support.

Keyboard shortcuts:

```text
Cmd/Ctrl + K     Command palette
Cmd/Ctrl + S     Save state / force sync
Cmd/Ctrl + Shift + F  Focus mode
Cmd/Ctrl + /     AI assistant
Esc              Close panel
```

---

# 30. Motion

Animation sangat minimal.

Gunakan untuk:

- opening panel;
- modal;
- drag & drop;
- save state;
- AI loading.

Durasi:

```text
150–250ms
```

Tidak menggunakan animated backgrounds.

---

# 31. Loading States

AI:

```text
Thinking...
Retrieving story context...
```

Editor:

```text
Saving...
```

Story Doctor:

```text
Analyzing your story...
Checking timeline...
Checking character consistency...
```

---

# 32. Error States

Contoh:

```text
We couldn't complete the AI request.

Your writing is safe.

[Try Again]
```

Jangan menghapus draft ketika request gagal.

---

# 33. Design Priority

Urutan prioritas UX:

```text
1. Writing
2. Story organization
3. AI assistance
4. Story intelligence
5. Analytics
```

Jika harus memilih antara dashboard cantik dan editor yang nyaman:

**Editor menang.**

---

# 34. MVP Screens

Minimal screens:

```text
01 Login
02 Sign Up
03 Novel Library
04 Create Novel
05 Novel Overview
06 Outline
07 Chapter Workspace
08 Character List
09 Character Detail
10 World
11 Timeline
12 AI Assistant
13 Consistency Check
14 Settings
```

---

# 35. Future Screens

Post-MVP:

```text
Story Doctor
Relationship Graph
Plot Thread Manager
Research Workspace
Export Center
Version Comparison
Collaboration
```

---

# 36. Design Success Criteria

Design dianggap berhasil apabila:

1. User dapat mulai menulis dalam kurang dari beberapa menit.
2. Editor terasa lebih dominan daripada UI.
3. User dapat memahami struktur novel tanpa membuka banyak halaman.
4. AI terasa mengetahui novel, bukan chatbot generik.
5. AI tidak mengambil alih kontrol.
6. Informasi story memory dapat dilihat dan dikoreksi.
7. Consistency findings dapat ditelusuri ke sumbernya.
8. Workspace tetap nyaman ketika novel mencapai puluhan chapter.

---

# 37. Final Design Direction

Produk harus terasa seperti:

```text
          ┌─────────────────────────────┐
          │        CREATIVE SPACE       │
          │                             │
          │   Plan → Write → Reflect   │
          │                             │
          │       Your story.           │
          │       Your world.           │
          │       Your voice.            │
          │                             │
          └─────────────────────────────┘
```

Bukan:

```text
AI
AI
AI
Generate
Generate
Generate
```

AI adalah **invisible intelligence underneath the writing experience**.

---

# 38. Next Technical Step

Setelah design ini, tahap berikutnya adalah `ARCHITECTURE.md`.

Dokumen tersebut harus mendefinisikan:

- PostgreSQL schema;
- table relationships;
- indexes;
- pgvector;
- story memory;
- embedding strategy;
- context retrieval;
- AI provider abstraction;
- prompt architecture;
- AI action pipeline;
- consistency detection pipeline;
- versioning;
- API structure;
- folder structure;
- deployment architecture.

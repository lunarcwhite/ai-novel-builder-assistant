# AGENTS.md — AI Novel Writing Workspace

This document defines how coding agents must work on this repository.

It is an operational guide for AI coding agents.

For product philosophy and behavioral principles, read `SOUL.md`.

For requirements, read:

- `docs/prd.md`
- `docs/design.md`
- `docs/architecture.md`
- `docs/database-schema.md`

---

# 1. Mission

Build a reliable, maintainable novel-writing workspace.

The product must prioritize:

1. author control;
2. manuscript safety;
3. story integrity;
4. writing experience;
5. maintainable architecture;
6. useful AI assistance.

Do not optimize for code volume or number of features.

---

# 2. Mandatory Reading

Before making substantial changes, inspect the relevant documentation.

Always understand:

```text
SOUL.md
```

For product behavior.

Then read the relevant technical documents:

```text
docs/prd.md
docs/design.md
docs/architecture.md
docs/database-schema.md
```

Do not invent requirements that contradict these documents.

If requirements conflict, prefer:

```text
SOUL.md
→ PRD
→ Architecture
→ Design
→ implementation detail
```

If the conflict cannot be resolved, stop and ask rather than silently choosing.

---

# 3. General Coding Principles

## 3.1 Prefer Simple Solutions

Use the simplest architecture that satisfies the requirement.

Do not introduce:

- microservices;
- Redis;
- Kafka;
- Elasticsearch;
- complex event buses;
- unnecessary abstractions;

unless the current workload genuinely requires them.

---

## 3.2 Modular Monolith First

The default architecture is:

```text
Next.js
+
PostgreSQL
+
pgvector
+
AI Provider
```

Keep domain boundaries clear without prematurely splitting services.

---

## 3.3 Feature-Oriented Code

Prefer:

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
└── consistency/
```

over giant generic folders.

Avoid turning:

```text
utils/
helpers/
services/
```

into dumping grounds.

---

# 4. Before Implementing a Feature

Follow:

```text
1. Read requirements.
2. Inspect existing code.
3. Identify affected domain.
4. Identify database impact.
5. Identify authorization impact.
6. Implement the smallest coherent change.
7. Add or update tests.
8. Run validation.
9. Review the diff.
```

Do not immediately start editing files without understanding the existing implementation.

---

# 5. Database Rules

## 5.1 Never Modify Schema Without Migration

Do not manually alter production schema.

Every schema change must have a migration.

---

## 5.2 Foreign Keys Matter

Use foreign keys for actual ownership relationships.

Prefer:

```text
on delete cascade
```

when the child has no meaning without the parent.

Prefer:

```text
on delete set null
```

when the child should survive deletion of the reference.

---

## 5.3 Tenant / Ownership Safety

Every novel belongs to a user.

Every story entity must ultimately be reachable through:

```text
entity
 ↓
novel
 ↓
user
```

Never trust client-provided IDs.

Always verify ownership server-side.

---

# 6. Manuscript Safety

Manuscript data is sacred.

Never:

- silently overwrite manuscript content;
- delete content as part of an AI operation;
- perform destructive migrations without a safe migration plan;
- replace text without versioning when the operation is destructive.

Before an AI replacement:

```text
create version
→ apply replacement
```

---

# 7. AI Rules

## 7.1 AI Must Be Provider-Agnostic

Application code should use:

```text
AIProvider
```

rather than directly calling a provider SDK everywhere.

---

## 7.2 AI API Keys Stay Server-Side

Never expose:

```text
AI_API_KEY
```

to the browser.

Never use secret keys in:

```text
NEXT_PUBLIC_*
```

environment variables.

---

## 7.3 AI Output Is Not Automatically Truth

AI-generated story facts are not confirmed facts.

Use:

```text
proposed
```

until author confirmation when appropriate.

---

## 7.4 AI Must Not Silently Modify the Manuscript

The UI must allow:

```text
Accept
Insert
Replace
Dismiss
```

AI modifications must be reversible.

---

# 8. Story Memory Rules

Story Memory is a first-class domain.

Every memory should have:

```text
type
content
status
source
```

Prefer:

```text
confirmed
```

only when explicitly established by the author or confirmed by the author.

AI-generated candidates should generally begin as:

```text
proposed
```

---

# 9. Context Retrieval Rules

Do not send the entire novel to the LLM by default.

Build context in layers:

```text
Current selection
↓
Current scene
↓
Current chapter
↓
Relevant characters
↓
Relevant memories
↓
World rules
↓
Timeline
↓
Plot threads
```

Use retrieval to find relevant information.

---

# 10. Never Treat Vector Search as Truth

Vector search is a retrieval mechanism.

It is not an authority.

Retrieved information must still be interpreted in context.

Author-defined structured data has higher authority than AI inference.

---

# 11. Prompt Architecture

Prompts should be versioned or centralized.

Do not scatter long prompts across React components.

Prefer:

```text
server/ai/prompts/
```

or equivalent feature-specific modules.

Operations should be explicit:

```text
continue_scene
rewrite
expand
improve_prose
improve_dialogue
critique
summarize
consistency_check
memory_extraction
story_analysis
```

---

# 12. Structured AI Responses

For machine-consumed operations, prefer structured output.

Example:

```json
{
  "findings": [],
  "memories": [],
  "suggestions": []
}
```

Validate AI output with a schema.

Recommended:

```text
Zod
```

Never blindly trust JSON returned by an LLM.

---

# 13. AI Context Privacy

Do not unnecessarily log:

- full manuscript;
- full prompts;
- full AI responses.

Logs should prefer metadata:

```text
operation
model
latency
token counts
status
cost
```

---

# 14. Editor Rules

The editor must remain responsive.

Do not make every keystroke depend on:

```text
API request
AI request
database roundtrip
```

Use local state and debounced persistence.

---

# 15. Autosave

Expected flow:

```text
typing
 ↓
local editor state
 ↓
debounce
 ↓
server persistence
 ↓
saved indicator
```

If save fails:

```text
preserve local content
show recoverable error
```

Never discard unsaved content.

---

# 16. Version History

Create a meaningful version when:

- user explicitly saves a version;
- AI performs a replacement;
- user restores an older version;
- a major edit operation occurs.

Do not create a database version for every keystroke.

---

# 17. UI Rules

Follow `docs/design.md`.

Prefer:

- calm layouts;
- clear hierarchy;
- whitespace;
- subtle interactions;
- accessible controls.

Avoid:

- unnecessary cards;
- excessive gradients;
- dashboard clutter;
- meaningless scores;
- decorative AI effects.

---

# 18. Writing Experience

When working on editor UI:

> The manuscript is more important than the interface around it.

Do not allow:

- AI panels;
- toolbars;
- navigation;
- analytics;

to visually overpower the writing area.

---

# 19. Accessibility

Every interactive component should support:

- keyboard navigation;
- visible focus;
- semantic labels;
- screen-reader compatibility;
- sufficient contrast.

Do not rely on color alone to communicate state.

---

# 20. Components

Prefer reusable components when there is a real pattern.

Do not prematurely create abstractions for one-off elements.

Good:

```text
AISuggestion
SceneNavigator
CharacterCard
ConsistencyFinding
```

Avoid:

```text
UniversalMegaCard
UniversalContentRenderer
UniversalDataThing
```

without a demonstrated need.

---

# 21. Server / Client Boundary

Keep server-only logic server-side.

Server code may contain:

- database access;
- secret keys;
- AI provider calls;
- authorization;
- embedding generation.

Client components should receive only what they need.

---

# 22. Validation

Validate user input at the boundary.

Recommended:

```text
Zod
```

Validate:

- forms;
- server actions;
- API payloads;
- AI structured output.

---

# 23. Error Handling

Errors should be:

- meaningful;
- recoverable when possible;
- safe to expose.

Bad:

```text
Something went wrong.
```

Better:

```text
We couldn't save this scene.
Your recent changes are still available locally.
Try again.
```

Do not expose:

- stack traces;
- API secrets;
- database credentials;
- internal infrastructure details.

---

# 24. Testing

Every meaningful domain feature should have tests.

## Unit

Examples:

```text
word count
memory deduplication
context ranking
timeline logic
authorization
```

## Integration

Examples:

```text
create novel
create chapter
create scene
save scene
create version
retrieve story context
```

## E2E

Critical flows:

```text
sign up
→ create novel
→ create chapter
→ write scene
→ reload
→ verify content
```

---

# 25. AI Testing

Do not only test whether AI returns text.

Test:

- structured output validity;
- context inclusion;
- context exclusion;
- source attribution;
- memory status;
- manuscript safety;
- contradiction detection.

Use deterministic fixtures where possible.

---

# 26. Database Testing

Before changing schema:

1. create migration;
2. apply migration locally;
3. test rollback if supported;
4. seed representative data;
5. test foreign keys;
6. test authorization;
7. inspect generated SQL where necessary.

---

# 27. Migration Safety

Never:

- drop production data casually;
- rename columns without migration;
- change enum values without checking existing data;
- make destructive schema changes without a migration plan.

For large migrations:

```text
expand
→ migrate
→ verify
→ contract
```

---

# 28. Performance

Measure before optimizing.

Watch:

- editor save latency;
- database query latency;
- context retrieval latency;
- AI latency;
- page load;
- large chapter rendering.

Avoid N+1 queries.

Use indexes based on actual query patterns.

---

# 29. Story Context Performance

Do not retrieve:

```text
everything
```

Retrieve:

```text
what is relevant
```

Use:

- metadata filters;
- vector search;
- keyword search;
- ranking;
- context budgets.

---

# 30. Long Novel Support

Do not assume:

```text
10 chapters
```

is the maximum.

The architecture should support:

```text
100+
chapters
1000+
scenes
many characters
large story memory
```

Use summaries and hierarchical context.

---

# 31. Source Attribution

Whenever a feature claims:

> "Your story says..."

it should ideally know the source.

Example:

```text
Chapter 12
Scene 3
```

This applies particularly to:

- Story Memory;
- Consistency Checker;
- Story Doctor.

---

# 32. Consistency Checker

Findings must be presented as evidence-based observations.

Use:

```text
Potential inconsistency
```

instead of:

```text
Error
```

unless the system is dealing with an objectively invalid data state.

Do not assume intentional ambiguity is a bug.

---

# 33. Story Doctor

Do not implement arbitrary:

```text
Story Quality Score
```

unless there is a clear product requirement.

Prefer:

```text
Observation
Evidence
Possible interpretation
Suggestion
```

---

# 34. No Fake Intelligence

Do not add features merely to make the product appear more AI-powered.

Every AI feature should have a meaningful purpose.

Bad:

```text
AI Story Score: 83
```

Good:

```text
Three unresolved plot threads may deserve review.
```

---

# 35. Documentation

When changing architecture or behavior, update the relevant documentation.

Examples:

```text
new database entity
→ database-schema.md

new architectural subsystem
→ architecture.md

new product capability
→ prd.md

new UX pattern
→ design.md
```

Do not allow documentation to become permanently stale.

---

# 36. Git Practices

Use small, coherent commits.

Prefer:

```text
feat: add novel creation flow
feat: add chapter editor
fix: preserve draft when autosave fails
feat: add story memory model
```

Avoid:

```text
update stuff
changes
fix
final
```

Do not mix unrelated features in one commit.

---

# 37. Pull Request Discipline

A PR should ideally answer:

```text
What changed?
Why?
What files changed?
How was it tested?
Any migration?
Any breaking change?
```

Do not hide significant architectural changes in unrelated PRs.

---

# 38. Before Finishing a Task

Run the appropriate checks.

At minimum for code changes:

```text
TypeScript
Lint
Tests
Build
```

Also inspect:

```text
git diff
```

Look for:

- accidental files;
- debug logs;
- secrets;
- unrelated changes;
- broken imports;
- temporary code.

---

# 39. Never Commit Secrets

Never commit:

```text
.env
.env.local
API keys
service-role keys
database passwords
tokens
```

Use:

```text
.env.example
```

with placeholders.

---

# 40. Environment Variables

Public variables may use:

```text
NEXT_PUBLIC_
```

Only genuinely public configuration belongs there.

Secrets never do.

---

# 41. Dependencies

Before adding a package, ask:

1. Is it necessary?
2. Is the functionality already available?
3. Is the package maintained?
4. Does it increase bundle size?
5. Does it introduce security or licensing concerns?
6. Does it make deployment harder?

Prefer fewer dependencies.

---

# 42. AI Provider Changes

If changing AI providers:

- do not rewrite the application around the provider SDK;
- update the provider implementation;
- preserve `AIProvider`;
- update configuration;
- update tests.

The domain model should remain unchanged.

---

# 43. Database Provider Changes

Similarly, do not spread provider-specific database APIs throughout the application.

Keep database access behind repositories/services where practical.

---

# 44. Feature Development Pattern

Preferred:

```text
Requirement
   ↓
Domain model
   ↓
Database
   ↓
Service
   ↓
Server action/API
   ↓
UI
   ↓
Tests
```

Do not start with UI and invent the domain afterward for complex features.

---

# 45. AI Feature Development Pattern

Preferred:

```text
User action
   ↓
Operation definition
   ↓
Context resolver
   ↓
Context builder
   ↓
Prompt
   ↓
AI provider
   ↓
Structured validation
   ↓
Domain action
   ↓
User review
```

---

# 46. When Requirements Are Ambiguous

Do not silently invent important product behavior.

For small implementation details:

```text
choose the simplest consistent option
```

For product-level decisions:

```text
ask for clarification
```

Especially when the decision affects:

- story ownership;
- manuscript behavior;
- memory semantics;
- privacy;
- destructive operations;
- database architecture.

---

# 47. Avoid Premature Refactoring

Do not refactor unrelated code while implementing a feature.

If existing code is problematic:

```text
fix the smallest necessary area
```

Create a separate refactoring task for broader cleanup.

---

# 48. Preserve Existing Behavior

Before changing shared code:

1. identify callers;
2. understand current behavior;
3. add tests if behavior is undocumented;
4. make the smallest safe change.

Do not break unrelated features for architectural purity.

---

# 49. Product Language

Use consistent terminology.

Preferred:

```text
Novel
Act
Chapter
Scene
Character
Relationship
Location
World Rule
World Lore
Plot Thread
Timeline Event
Story Memory
Consistency Finding
Story Doctor
```

Avoid randomly switching terms.

For example, do not use:

```text
Episode
Section
Segment
```

when the domain concept is `Chapter` or `Scene`.

---

# 50. UX Language

The product should not shame writers.

Avoid:

```text
Bad chapter
Weak writer
Story failed
Wrong character
Incorrect creativity
```

Prefer:

```text
Potential issue
Observation
Possible contradiction
Unresolved thread
Suggestion
```

---

# 51. Final Agent Checklist

Before declaring a task complete:

```text
[ ] Read relevant documentation
[ ] Inspected existing code
[ ] Identified affected domain
[ ] Checked database implications
[ ] Checked authorization
[ ] Preserved manuscript safety
[ ] Added validation
[ ] Added tests where appropriate
[ ] Ran lint
[ ] Ran typecheck
[ ] Ran tests
[ ] Ran build when appropriate
[ ] Reviewed git diff
[ ] Updated documentation if needed
[ ] No secrets committed
[ ] No debug code left behind
```

---

# 52. Final Rule

When uncertain, prefer:

```text
simple
safe
reversible
explainable
author-controlled
```

over:

```text
clever
automatic
destructive
opaque
over-engineered
```

The goal is not to build the most impressive AI system.

The goal is to build a tool that a novelist can trust with a story they care about.

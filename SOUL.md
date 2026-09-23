# SOUL.md — AI Novel Writing Workspace

> The author owns the story.

This document defines the character, philosophy, and non-negotiable principles of the product.

It is not a technical specification.

It exists so that every feature, AI behavior, interface, and implementation decision remains aligned with what this product is meant to be.

---

# 1. What We Are Building

We are building a creative workspace for novelists.

The product helps a writer move from:

```text
idea
  ↓
story
  ↓
characters
  ↓
world
  ↓
plot
  ↓
scenes
  ↓
manuscript
  ↓
revision
  ↓
finished novel
```

The product is not primarily an AI text generator.

It is a place where a writer can **think, build, write, remember, question, and revise**.

AI is part of the experience, but the story belongs to the author.

---

# 2. The Core Belief

## The author owns the story.

The author's:

- voice;
- taste;
- intentions;
- characters;
- world;
- themes;
- decisions;
- mistakes;
- discoveries;

are all part of the creative process.

The AI may assist that process.

It must never quietly take ownership of it.

---

# 3. What the AI Is

The AI can be:

- a brainstorming partner;
- a writing assistant;
- a reader;
- a continuity checker;
- a story analyst;
- a critic;
- a question asker;
- a research assistant;
- a source of alternatives.

The AI is not:

- the author;
- the final authority on the story;
- the owner of creative decisions;
- a replacement for the writer's voice.

---

# 4. The Relationship Between Author and AI

The desired relationship is:

```text
Author
  │
  │ asks
  ▼
AI
  │
  │ understands
  ▼
Story Context
  │
  │ suggests
  ▼
Author
  │
  │ decides
  ▼
Story
```

Not:

```text
Author
  │
  ▼
AI
  │
  ▼
Story
```

The second model turns the author into an editor of machine-generated text.

That is not our goal.

---

# 5. Protect the Author's Voice

The application should help the writer become a better version of their own writerly voice.

It should not constantly replace that voice with a generic "AI writing style".

When rewriting text, AI should preserve where possible:

- tone;
- narrative perspective;
- vocabulary;
- rhythm;
- emotional intention;
- characterization;
- point of view.

When uncertainty exists, ask or provide alternatives rather than silently deciding.

---

# 6. Never Silently Change the Manuscript

This is non-negotiable.

AI must not silently:

- rewrite a scene;
- delete text;
- change character facts;
- alter timeline events;
- change world rules;
- modify plot structure;
- overwrite the author's manuscript.

AI-generated changes must be visible and reversible.

Preferred flow:

```text
AI Suggestion
     ↓
Review
     ↓
Accept / Insert / Replace / Dismiss
```

The author must remain in control.

---

# 7. Story Facts Are Precious

A novel contains many details that may look insignificant individually but become important later.

Examples:

```text
Anna is left-handed.
Daniel has never visited the city.
The ring belonged to Anna's mother.
Magic requires Moon Blood.
The hospital incident happened on Day 47.
```

These details should not be casually invented, merged, or changed.

The system should distinguish:

```text
Author-defined fact
Confirmed story fact
Proposed fact
Character belief
Possibility
AI inference
```

They are not the same thing.

---

# 8. Never Turn a Guess Into a Fact

If the manuscript says:

> Daniel might be the killer.

The system must not store:

> Daniel is the killer.

as a confirmed fact.

The difference between:

```text
fact
belief
suspicion
possibility
revelation
```

is fundamental to storytelling.

---

# 9. Story Memory Must Be Explainable

When the application remembers something, the author should be able to ask:

> Where did this come from?

Every important memory should preferably have a source:

```text
Memory:
Anna's brother died when Anna was 12.

Source:
Chapter 2
```

AI memory should not become an invisible black box.

---

# 10. The Story Is Bigger Than the Current Prompt

A writer may ask:

> "Help me write this dialogue."

But the application should understand that this dialogue exists inside:

```text
Novel
 ├── Theme
 ├── Plot
 ├── Character arcs
 ├── World rules
 ├── Timeline
 ├── Previous events
 └── Current scene
```

The AI should use context intelligently.

It should not blindly retrieve everything.

---

# 11. Context Must Be Relevant

More context does not automatically mean better context.

The system should prefer:

```text
Current scene
↓
Current chapter
↓
Relevant characters
↓
Relevant memories
↓
Relevant world rules
↓
Relevant timeline
↓
Relevant plot threads
```

over dumping the entire novel into every AI request.

---

# 12. Do Not Manufacture Certainty

When the story is ambiguous, preserve the ambiguity.

Use language such as:

```text
This may suggest...
One possible interpretation is...
I found a potential contradiction...
The manuscript does not currently establish...
```

Avoid:

```text
This is definitely what happened.
The character clearly feels...
The correct interpretation is...
```

unless the story explicitly establishes it.

---

# 13. Consistency Is Not the Same as Quality

A contradiction can be intentional.

A strange character decision can be intentional.

An unreliable narrator can be intentional.

A timeline that appears impossible can be intentional.

Therefore the application should say:

> Potential inconsistency

rather than:

> Your story is wrong.

The system identifies evidence.

The author decides whether it is a problem.

---

# 14. Story Doctor Should Diagnose, Not Dictate

The Story Doctor may identify:

- pacing observations;
- unresolved threads;
- character motivation gaps;
- possible continuity conflicts;
- underdeveloped setups;
- abrupt transitions.

But it should not behave as though there is one objectively correct novel.

Instead:

```text
Observation
+
Evidence
+
Possible interpretation
+
Optional suggestions
```

The author decides what to do.

---

# 15. Preserve Creative Ambiguity

Some stories are supposed to leave questions unanswered.

The system should not automatically resolve:

- mysteries;
- relationships;
- symbolism;
- character motivations;
- endings;
- supernatural explanations.

Sometimes:

```text
unknown
```

is a valid story state.

---

# 16. Do Not Optimize Everything

Not every chapter needs to be:

- faster;
- more dramatic;
- more emotional;
- more marketable;
- more concise.

Not every sentence needs to be optimized.

The product exists to help the author create the story they want.

Optimization is a tool, not the goal.

---

# 17. Writing Is Not Just Text Generation

A novel is made from more than prose.

It includes:

```text
ideas
characters
relationships
conflicts
choices
consequences
world rules
themes
symbols
memories
timing
silence
```

The application must therefore support thinking and planning, not only writing.

---

# 18. Make Complexity Manageable

A long novel can become overwhelming.

The application should make complexity visible without making it frightening.

Prefer:

```text
7 active plot threads
3 unresolved questions
2 potential continuity issues
```

over:

```text
ERROR: STORY INCONSISTENT
```

The application is a guide, not a judge.

---

# 19. The Interface Should Disappear During Writing

When a writer is deeply focused, the application should become quiet.

The editor should not compete with the manuscript.

Writing mode should prioritize:

```text
words
space
focus
flow
```

Everything else can wait.

---

# 20. The Interface Should Become Structured During Planning

When the writer is planning, structure becomes useful.

The application should make it easy to see:

```text
characters
chapters
scenes
plot
timeline
world
relationships
```

The experience should therefore change naturally:

```text
Planning Mode
→ structure

Writing Mode
→ immersion

Analysis Mode
→ reflection
```

---

# 21. AI Should Ask Good Questions

Sometimes the best AI response is not an answer.

For example:

> "Why doesn't Anna tell Daniel the truth?"

Instead of immediately inventing an explanation, AI may ask:

> "Do you want Anna to hide the truth because she fears Daniel's reaction, because she doesn't trust him yet, or because revealing it would put him in danger?"

Questions can help the author discover their own story.

---

# 22. Suggestions Should Be Options

Prefer:

```text
Option A
A quiet emotional confrontation.

Option B
A sudden external interruption.

Option C
Anna lies, creating a later complication.
```

rather than:

```text
This is what should happen next.
```

---

# 23. The Product Should Encourage Discovery

Writing is often exploratory.

A writer may not know:

- the ending;
- the antagonist;
- the exact theme;
- why a character behaves a certain way.

That is okay.

The application should support:

```text
I don't know yet.
```

as a legitimate state.

---

# 24. Privacy Matters

A novel can represent years of creative work.

Treat manuscript data as private by default.

The product should be transparent about:

- where data is stored;
- how AI processing works;
- which AI provider receives content;
- retention;
- deletion;
- whether content is used for model training.

Never hide these decisions behind vague language.

---

# 25. AI Provider Independence

The product should not become philosophically dependent on one AI provider.

The application owns:

```text
story structure
story memory
manuscript
context
relationships
timeline
```

The model is replaceable.

The story should not be.

---

# 26. No Vendor Lock-In in the Story Model

If the AI provider changes tomorrow, the author's novel should remain completely usable.

The database and domain model must remain provider-neutral.

---

# 27. Build for Long Stories

A good experience for Chapter 1 should still work for Chapter 100.

Do not build architecture that only works when a novel is small.

The system must anticipate:

- hundreds of chapters;
- thousands of scenes;
- many characters;
- large worldbuilding databases;
- extensive story memory.

---

# 28. Performance Is Part of the Creative Experience

If the writer types:

```text
"She opened the door..."
```

the application should not make them wait for an API request before saving the text.

Writing must remain responsive.

AI can be asynchronous.

The editor cannot be.

---

# 29. Failure Should Never Destroy Creative Work

If:

- AI fails;
- network fails;
- database request fails;
- generation times out;

the manuscript must remain safe whenever possible.

A failure should look like:

> AI request failed. Your writing is safe.

Never:

> Something went wrong.

with no indication of what happened to the manuscript.

---

# 30. Build Small, But Build the Right Foundation

Do not build every feature immediately.

A strong first version can be:

```text
Novel
 ↓
Chapter
 ↓
Scene
 ↓
Editor
 ↓
Character
 ↓
World Rule
 ↓
AI Assistant
```

But the architecture should leave room for:

```text
Story Memory
Timeline
Consistency
Story Doctor
Collaboration
Export
```

---

# 31. Avoid Feature Theater

Do not build features just because they look impressive.

Examples of feature theater:

- meaningless story scores;
- decorative AI graphs;
- excessive dashboards;
- fake "AI intelligence" badges;
- arbitrary productivity scores.

Every feature should answer:

> Does this help the writer understand, create, organize, or improve their story?

If not, reconsider it.

---

# 32. Product Personality

The product should feel:

```text
Thoughtful
Calm
Intelligent
Respectful
Creative
Reliable
Private
Non-judgmental
```

It should not feel:

```text
Aggressive
Gamified
Noisy
Over-automated
Corporate
Mechanical
```

---

# 33. The AI Should Sound Like a Good Writing Partner

Not:

> "Your story has a 72% quality score."

Prefer:

> "There's an interesting tension here. Daniel says he doesn't trust Anna, but he risks himself to protect her two chapters later. If that change is intentional, you may want to give the reader one small moment showing when his feelings shifted."

The difference is important.

The first judges.

The second observes and helps.

---

# 34. Never Pretend to Understand More Than We Do

If the system cannot determine something:

Say so.

If context is missing:

Say so.

If two story facts conflict:

Show the conflict.

If the AI is making an inference:

Label it as an inference.

Trust is more important than appearing intelligent.

---

# 35. Product North Star

The north star is not:

> "Generate more words."

It is:

> **Help writers make progress on the novel they actually want to write.**

Progress may mean:

- writing 1,000 words;
- solving a plot problem;
- discovering a character motivation;
- fixing a continuity issue;
- organizing a messy outline;
- deciding what not to write.

All of these are meaningful progress.

---

# 36. Decision Filter

When making a product or technical decision, ask:

### Question 1

Does this help the author?

### Question 2

Does it preserve author control?

### Question 3

Does it preserve story integrity?

### Question 4

Does it reduce unnecessary cognitive load?

### Question 5

Does it make the system more trustworthy?

### Question 6

Will it still make sense for a novel with 100+ chapters?

If the answer is mostly no, reconsider the feature.

---

# 37. The Golden Rule

> **Never make the author fight the tool.**

The application should make writing easier, not turn writing into data entry.

The writer should never feel:

> "I have to maintain the database before I can write my story."

Structured information should emerge naturally from the writing workflow whenever possible.

---

# 38. Final Principle

The application exists to serve the story.

The AI exists to serve the author.

The interface exists to serve the creative process.

The technology exists to make all three reliable.

```text
                 AUTHOR
                   │
                   ▼
                 STORY
                   │
                   ▼
              APPLICATION
                   │
          ┌────────┴────────┐
          ▼                 ▼
        TOOLS              AI
          │                 │
          └────────┬────────┘
                   ▼
             CREATIVE WORK
```

And the final rule remains:

> **The author owns the story.**

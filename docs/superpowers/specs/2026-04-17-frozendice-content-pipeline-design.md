# Frozendice Content Pipeline — Nordic Valkyries Test Run

**Date:** 2026-04-17
**Owner:** Christian Bru
**Status:** Design approved — ready for implementation plan

## Purpose

Stand up an end-to-end, Notion-native pipeline that turns scattered D&D homebrew
notes into a publication-ready Patreon release (Homebrewery PDF + images + post
draft) for the Frozendice hobby project. This document scopes the **first
manual test run**: produce one release — *Nordic Valkyries, Vol. 1* (3-4
Valkyries inspired by God of War: Ragnarok) — without Paperclip automation, so
the pipeline's real friction points are discovered before we invest in
automating them.

## Goals

- Ship one Patreon-ready release end-to-end, with everything editable in Notion
  afterwards.
- Establish durable Notion structure (Nordgaard world hub + Patreon Releases
  hub) that future releases and campaign material reuse.
- Identify which stages are worth automating in Paperclip later, and which
  external integrations (Homebrewery render, Patreon publish) need custom
  tooling.

## Non-goals (this test run)

- No Paperclip agent wiring.
- No browser automation for D&D Beyond or Patreon.
- No Homebrewery Docker install — markdown is copy-pasted to
  `homebrewery.naturalcrit.com` by hand for the PDF export.
- No migration of existing Durvillage content into the new Nordgaard →
  Places / Campaigns structure. Out of scope to avoid destabilising existing
  campaign notes while debugging a pipeline.
- No custom MCPs (Homebrewery, Patreon) — those are follow-ups if the manual
  flow justifies them.

## Notion structure

Two parallel trees in the Frozendice teamspace, cross-linked via Notion
relations.

### Layer 1 — Campaign Canon (Nordgaard world hub)

Reusable at the table; long-lived; independent of publication state.

```
Frozendice
└── Nordgaard (NEW)
    ├── Bestiary - test          Plain page; child page per Valkyrie (this test)
    ├── Bestiary (DB)            Database outline; populated in future runs
    ├── NPCs (DB)                Same pattern as Bestiary; outline only
    ├── Places                   Future: Durvillage village info migrates here
    ├── Campaigns & One-shots    Future: Durvillage adventure lives here
    └── References               Links to existing DMs Guild, DnD House Style,
                                 Forgotten Realms, DD_IP_Guide pages
```

### Layer 2 — Patreon Releases (publication workflow)

One page per release, wraps the publication artifacts and cross-links to canon.

```
Frozendice
└── Patreon Releases (NEW)
    └── Nordic Valkyries, Vol. 1
        ├── (page property) Status: Draft / Ready / Published
        ├── (page property) Canon links → Bestiary entries
        ├── Source Material       Human-dumped raw DDB paste (Stage 1)
        ├── Style Contract        Distilled style guide (Stage 2)
        ├── Norse Reference Pack  Themes, names, motifs (Stage 2)
        ├── Content Draft         Enriched prose, linked to Bestiary (Stage 3)
        ├── Homebrewery Markdown  Single code block, copy-paste ready (Stage 4)
        ├── Generated Images      Notion image blocks (Stage 5)
        └── Patreon Post Draft    Title, body, tags (Stage 6)
```

### Bestiary database schema (outlined now, populated later)

| Property        | Type                       | Notes |
|-----------------|----------------------------|-------|
| Name            | Title                      | — |
| CR              | Number                     | Challenge rating |
| Type            | Select                     | Humanoid, Fiend, Celestial, Fey, Undead, … |
| Tags            | Multi-select               | `norse`, `valkyrie`, `boss`, `minion`, … |
| Size            | Select                     | Tiny…Gargantuan |
| Alignment       | Select                     | — |
| Origin          | Select                     | `canon` / `homebrew` / `adapted` |
| Source SRD      | URL                        | If adapted from SRD |
| Published In    | Relation → Patreon Releases | Auto-backlinks |
| Appears In      | Relation → Places / Adventures | Gameplay lookups |
| Status          | Select                     | `draft` / `reviewed` / `canon` |
| Cover image     | Files                      | — |

Same pattern extends to NPCs (swap CR/Type for Role/Race/Faction).

## Pipeline stages

### Stage 0 — Setup (one-time)

- Create Nordgaard and child structure in Frozendice teamspace.
- Create Patreon Releases hub and the Nordic Valkyries Vol. 1 release page.
- Create local scratch dir `d:/src/frozendice-test/` for intermediate artifacts
  (image iterations, render logs). Final outputs live in Notion; this dir is a
  workbench.

### Stage 1 — Consolidate source *(human-led)*

- User manually copies 3-4 Valkyrie stat blocks / lore from D&D Beyond homebrew
  into `Source Material`. D&D Beyond homebrew pages are login-gated and
  scraping is not in scope for this test.
- Pipeline reads `Source Material` and normalises into a list of
  `{name, raw_statblock, raw_lore, identified_gaps}` objects.

### Stage 2 — Research & style-load *(automated)*

- Fetch four existing Notion style guides, distill into a ~500-word
  **Style Contract** saved to the release page. This is the system prompt used
  by every generation step — enforces consistent tone.
- Generate a short **Norse / GoR:Ragnarok Reference Pack** — names, themes,
  combat flavor, visual motifs. Saved as a release subpage.
- User reviews both before Stage 3.

### Stage 3 — Enhance & canonicalize *(automated, with review gate)*

- For each Valkyrie, generate a **Bestiary - test** child page containing:
  lore (~200 words), appearance, personality, stat block (gaps filled),
  tactics, 2-3 roleplay/plot hooks.
- Cross-link each Bestiary page back to the release page.
- **Review gate:** pipeline pauses. User edits Bestiary pages directly in
  Notion until happy. Pipeline resumes on explicit confirmation.

### Stage 4 — Format to Homebrewery markdown *(automated)*

- Read the reviewed Bestiary pages + release cover text.
- Emit a single Homebrewery-flavored markdown document (`\page` breaks,
  `{{monster,frame …}}` blocks, etc.) following Homebrewery syntax.
- Store in Notion as one code block on the `Homebrewery Markdown` subpage;
  mirror to `d:/src/frozendice-test/homebrewery.md`.

### Stage 5 — Image generation *(automated)*

- Scope: 1 cover image + 1 hero image per Valkyrie ≈ 4-5 images total.
- Tool: `gemini /generate "..."` CLI subprocess (Nano Banana extension).
  Authenticated via user's Gemini paid subscription — no API key required.
- For each image, generate 2-3 prompt variants drawing on the Style Contract
  and Norse Reference Pack. Surface candidates for user pick.
- Selected images upload to the release page's `Generated Images` subpage as
  Notion image blocks; originals preserved on disk for future re-edits.

### Stage 6 — Patreon post draft *(automated)*

- Generate post title, 3-4 paragraph teaser body, tags, tier notes.
- Write to `Patreon Post Draft` subpage.

### Stage 7 — Manual publish *(human-led, final)*

- User copies Homebrewery markdown from Notion → pastes into
  `homebrewery.naturalcrit.com` → exports PDF.
- User uploads PDF + cover image + post text into a Patreon draft post.
- User updates release page `Status` property to `Published`.

## Tool choices (locked for this test)

| Concern             | Choice                                        | Rationale |
|---------------------|-----------------------------------------------|-----------|
| Notion read/write   | Notion MCP (already connected)                | Zero setup |
| LLM text stages     | Claude in this Claude Code session            | Single conversation, easy iteration |
| Image generation    | `gemini` CLI + Nano Banana extension subprocess | User has paid-tier auth ready |
| Homebrewery render  | Manual copy-paste to naturalcrit.com          | No public API; Docker is overkill for first run |
| Patreon publish     | Manual upload                                 | Official API doesn't support post creation |
| Run logging         | `d:/src/frozendice-test/run.log` — Notion URLs + local paths per stage | Click-through debugging |

## Human gates

| Gate | Between stages | Purpose |
|------|----------------|---------|
| G1   | Stage 0 → 1    | User confirms Notion structure before dumping source |
| G2   | Stage 2 → 3    | User reviews Style Contract + Reference Pack |
| G3   | Stage 3 → 4    | User reviews Bestiary pages (primary creative review) |
| G4   | Stage 5 → 6    | User picks images from candidates |
| G5   | Stage 6 → 7    | User reviews Patreon post draft before publishing |

## Success criteria

The test succeeds if all of the following are true:

1. Nordgaard and Patreon Releases hubs exist in Frozendice with the specified
   structure.
2. 3-4 Valkyrie pages exist in `Bestiary - test`, each with lore, stat block,
   and hooks that the user considers publishable.
3. Homebrewery markdown renders without errors on naturalcrit.com and the
   exported PDF matches the Style Contract.
4. 4-5 images exist as Notion image blocks on the release page, selected from
   generated candidates.
5. A Patreon draft post is ready (text + PDF + cover image attached).
6. The user can edit any artifact (text, stat block, image) later from Notion
   and re-run downstream stages without full re-runs.

## Future scope — in play if this test succeeds

These are explicitly out of scope for the manual test run, but should be
reconsidered immediately once the manual run validates the flow.

### Paperclip automation
- Wrap the pipeline as Paperclip issues/tasks delegated to existing agents
  (Developer / QA).
- Evaluate whether a new Paperclip agent role (e.g. "Content Creator") is
  worth the investment, or if existing agents + skills suffice.
- Each stage becomes an agent task with the same human gates.

### Homebrewery integration
- Build a community MCP or API wrapper for Homebrewery (none exists today) and
  publish it open-source.
- Run Homebrewery locally via Docker (`naturalcrit/homebrewery`) for
  programmatic PDF export and full control.

### Patreon publishing
- Investigate whether a current third-party API supports post creation.
- If not, build a Patreon MCP (browser-automation-backed if needed) to turn
  Stage 7 into an automated draft-upload step.

### D&D Beyond source extraction
- Playwright-based MCP with session-cookie auth to pull homebrew content
  directly from DDB. Only worthwhile if we hit this often enough to justify
  the maintenance cost.

### Nordgaard migration
- Move Durvillage's village information from the one-shot page to
  `Nordgaard › Places`. Move the adventure itself to
  `Nordgaard › Campaigns & One-shots`.
- Populate the real `Bestiary` and `NPCs` databases with existing canon from
  the three Nordgaard campaigns and one-shots.

### Pipeline generalisation
- After running 2-3 different content types (monster bundle, magic items,
  mini-adventure), extract a reusable "content release" skill /
  template-driven pipeline.
- Formalise the Style Contract as a versioned artifact so tone doesn't drift
  across releases.

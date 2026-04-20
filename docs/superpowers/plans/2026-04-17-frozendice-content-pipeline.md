# Frozendice Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This plan is NOT a good fit for subagent-driven execution — stages share creative context (tone, world-fiction, image references) that a fresh subagent would lose. Execute inline in a single Claude Code session with the human (Christian) in the loop at the defined gates.

**Goal:** Run one end-to-end, Notion-native content release for Frozendice — *Nordic Valkyries, Vol. 1* — producing a Homebrewery-ready markdown doc, 4-5 images, and a Patreon post draft, all editable from Notion afterwards.

**Architecture:** Two-layer Notion structure (Nordgaard canon + Patreon Releases workflow) with a local scratch dir for intermediate artifacts. Seven sequential stages with five human gates. No new code, no tests, no git commits — all outputs land in Notion (durable) or the scratch dir (disposable).

**Tech Stack:** Notion MCP for all Notion I/O, Claude Code (this session) for text generation stages, `gemini` CLI + Nano Banana extension for image generation, manual copy-paste for Homebrewery PDF export, manual upload for Patreon publish.

**Spec reference:** [docs/superpowers/specs/2026-04-17-frozendice-content-pipeline-design.md](../specs/2026-04-17-frozendice-content-pipeline-design.md) and the Notion mirror: https://www.notion.so/34769e9f245a81d6a2eed0b45f15961b

**Notion IDs (locked):**
- Frozendice teamspace: `29769e9f-245a-816d-94f6-004267619b11`
- Frozendice Teamspace Home page: `29769e9f-245a-80bc-a07e-e2e9d9f4f583`
- DMs Guild Creator Resource style guide: `34769e9f-245a-80e0-952c-e6ed9a0652a7`
- DnD House Style Guide: `34769e9f-245a-8047-9ce2-e4efcde0a789`
- Forgotten Realms Style Guide: `34769e9f-245a-8056-8287-ed4ac557cf9e`
- DD IP Guide: `34769e9f-245a-808e-94f7-fd88f1410f91`

---

## Artifact map

| Artifact | Location | Stage owner | Editable after? |
|----------|----------|-------------|-----------------|
| Nordgaard hub page | Frozendice teamspace (child of Teamspace Home) | Stage 0 | yes |
| Bestiary - test page | child of Nordgaard | Stage 0 | yes |
| Bestiary (DB) | child of Nordgaard | Stage 0 | yes |
| NPCs (DB) | child of Nordgaard | Stage 0 | yes |
| Places / Campaigns & One-shots / References | children of Nordgaard | Stage 0 (stubs) | yes |
| Patreon Releases hub page | Frozendice teamspace | Stage 0 | yes |
| Nordic Valkyries Vol. 1 release page | child of Patreon Releases | Stage 0 | yes |
| Source Material subpage | child of release page | Stage 1 (human) | yes |
| Style Contract subpage | child of release page | Stage 2 | yes |
| Norse Reference Pack subpage | child of release page | Stage 2 | yes |
| Bestiary - test › {Valkyrie Name} | grandchild of Nordgaard | Stage 3 | yes |
| Content Draft subpage | child of release page | Stage 3 | yes |
| Homebrewery Markdown subpage | child of release page | Stage 4 | yes |
| `d:/src/frozendice-test/homebrewery.md` | local scratch | Stage 4 | yes (mirror) |
| `d:/src/frozendice-test/images/` | local scratch | Stage 5 | yes (originals) |
| Generated Images subpage | child of release page | Stage 5 | yes (replaceable) |
| Patreon Post Draft subpage | child of release page | Stage 6 | yes |
| Final PDF + Patreon draft post | external (naturalcrit.com, patreon.com) | Stage 7 (human) | yes |
| `d:/src/frozendice-test/run.log` | local scratch | all stages | append-only |

---

## Task 0: Setup (Stage 0) — scaffold Notion and scratch dir

**Files:** none local besides scratch dir; Notion pages created via MCP.

- [ ] **Step 0.1: Create the local scratch dir**

Run:
```bash
mkdir -p d:/src/frozendice-test/images d:/src/frozendice-test/logs && touch d:/src/frozendice-test/run.log
```
Expected: dirs exist, log file exists.

- [ ] **Step 0.2: Create the `Nordgaard` hub page in Frozendice teamspace**

Call `mcp__claude_ai_Notion__notion-create-pages` with:
- `parent`: `{"type":"page_id","page_id":"29769e9f-245a-80bc-a07e-e2e9d9f4f583"}`
- `pages[0]`: `{"properties":{"title":"Nordgaard"},"icon":"🗻","content":"The frozen world of Nordgaard — source-of-truth for canon material (bestiary, NPCs, places, adventures). Linked from Patreon Releases.\n\n## Structure\n- **Bestiary** — creatures (both canon and homebrew)\n- **NPCs** — named characters\n- **Places** — settlements, wilds, dungeons, planes\n- **Campaigns & One-shots** — run adventures\n- **References** — style guides and IP resources\n\n## Status\nScaffold only. Durvillage content migration is future work.\n"}`

Record the returned page ID in `run.log` as `NORDGAARD_ID`.

- [ ] **Step 0.3: Create Nordgaard child pages (6 pages in one call)**

Call `notion-create-pages` with `parent = {"type":"page_id","page_id":"<NORDGAARD_ID>"}` and `pages`:

```json
[
  {"properties":{"title":"Bestiary - test"},"icon":"🐉","content":"Staging ground for the Nordic Valkyries test run. Each Valkyrie gets a child page here. Once the test run succeeds, contents migrate to the real Bestiary database.\n"},
  {"properties":{"title":"Bestiary"},"icon":"📚","content":"Global bestiary database. Populated in future runs. Schema defined in the pipeline design spec — re-create as a Notion database (not a plain page) when populating for real.\n\n## Planned schema\n| Property | Type |\n|---|---|\n| Name | Title |\n| CR | Number |\n| Type | Select |\n| Tags | Multi-select |\n| Size | Select |\n| Alignment | Select |\n| Origin | Select |\n| Source SRD | URL |\n| Published In | Relation → Patreon Releases |\n| Appears In | Relation → Places / Adventures |\n| Status | Select |\n| Cover image | Files |\n"},
  {"properties":{"title":"NPCs"},"icon":"🧝","content":"Global NPC database. Outline only. Schema mirrors Bestiary — swap CR/Type for Role/Race/Faction.\n"},
  {"properties":{"title":"Places"},"icon":"🗺️","content":"Settlements, wilds, dungeons, planes. Future: Durvillage village info migrates here from the existing one-shot page.\n"},
  {"properties":{"title":"Campaigns & One-shots"},"icon":"📜","content":"Run adventures. Future: existing Durvillage one-shot moves here.\n"},
  {"properties":{"title":"References"},"icon":"🔗","content":"## Imported style guides\n- [DMs Guild Creator Resource — Style Guide](https://www.notion.so/34769e9f245a80e0952ce6ed9a0652a7)\n- [DnD House Style Guide (Jan 2019)](https://www.notion.so/34769e9f245a80479ce2e4efcde0a789)\n- [Forgotten Realms Style Guide](https://www.notion.so/34769e9f245a80568287ed4ac557cf9e)\n- [DD IP Guide](https://www.notion.so/34769e9f245a808e94f7fd88f1410f91)\n"}
]
```

Record all 6 returned IDs in `run.log` (`BESTIARY_TEST_ID`, `BESTIARY_DB_ID`, `NPCS_ID`, `PLACES_ID`, `CAMPAIGNS_ID`, `REFERENCES_ID`).

- [ ] **Step 0.4: Create the `Patreon Releases` hub page**

Call `notion-create-pages` with:
- `parent`: `{"type":"page_id","page_id":"29769e9f-245a-80bc-a07e-e2e9d9f4f583"}`
- `pages[0]`: `{"properties":{"title":"Patreon Releases"},"icon":"🎨","content":"Publication workflow hub. Each release is a child page tracking source → draft → markdown → images → post draft. Cross-linked to canon entries in Nordgaard.\n"}`

Record as `PATREON_HUB_ID`.

- [ ] **Step 0.5: Create the `Nordic Valkyries, Vol. 1` release page + 7 subpages**

First, create the release page:
- `parent`: `{"type":"page_id","page_id":"<PATREON_HUB_ID>"}`
- `pages[0]`: `{"properties":{"title":"Nordic Valkyries, Vol. 1"},"icon":"⚔️","content":"## Release meta\n- **Status:** Draft\n- **Theme:** Norse / God of War: Ragnarok-inspired Valkyries\n- **Scope:** 3-4 homebrew Valkyries\n- **Canon links:** populated in Stage 3\n\n---\n\nChildren below follow the pipeline stage order.\n"}`

Record as `RELEASE_ID`.

Then create 7 subpages in one call with `parent = {"type":"page_id","page_id":"<RELEASE_ID>"}`:

```json
[
  {"properties":{"title":"Source Material"},"icon":"📥","content":"**Human-filled in Stage 1.** Paste raw D&D Beyond homebrew Valkyrie stat blocks and lore here. Messy is fine — pipeline normalises.\n"},
  {"properties":{"title":"Style Contract"},"icon":"📐","content":"_To be generated in Stage 2 from the four style guides referenced in Nordgaard › References._"},
  {"properties":{"title":"Norse Reference Pack"},"icon":"🪓","content":"_To be generated in Stage 2. Names, themes, combat flavor, visual motifs._"},
  {"properties":{"title":"Content Draft"},"icon":"✍️","content":"_To be generated in Stage 3. Enriched prose; cross-links to Bestiary - test child pages._"},
  {"properties":{"title":"Homebrewery Markdown"},"icon":"🍺","content":"_To be generated in Stage 4. Single code block, copy-paste-ready for homebrewery.naturalcrit.com._"},
  {"properties":{"title":"Generated Images"},"icon":"🖼️","content":"_To be populated in Stage 5. Notion image blocks of selected cover + hero images._"},
  {"properties":{"title":"Patreon Post Draft"},"icon":"📝","content":"_To be generated in Stage 6. Title, 3-4 paragraph teaser body, tags, tier notes._"}
]
```

Record all 7 IDs in `run.log` (`SOURCE_ID`, `STYLE_ID`, `REFPACK_ID`, `DRAFT_ID`, `HOMEBREW_ID`, `IMAGES_ID`, `POSTDRAFT_ID`).

- [ ] **Step 0.6: Verify structure**

Call `notion-fetch` on `NORDGAARD_ID` and `RELEASE_ID`. Confirm both show the expected children. Log a summary line to `run.log`.

- [ ] **Step 0.7: GATE G1 — ask user to confirm structure**

Message the user:

> Stage 0 complete. Nordgaard hub and Nordic Valkyries Vol. 1 release page scaffolded. Links: **Nordgaard**: https://www.notion.so/<NORDGAARD_ID>, **Release page**: https://www.notion.so/<RELEASE_ID>. Next: paste your D&D Beyond Valkyrie content into the **Source Material** subpage (messy is fine). Reply when you're done and I'll start Stage 2.

**Do not proceed until user confirms.**

---

## Task 1: Ingest source material (Stage 1) — human-led, with normalisation

- [ ] **Step 1.1: Fetch Source Material page**

Call `notion-fetch` with `id = <SOURCE_ID>`. Parse the raw paste.

- [ ] **Step 1.2: Normalise into a structured list**

Extract into this in-memory structure (do NOT write back to Notion yet):

```
[
  {
    "name": "<Valkyrie name as pasted>",
    "raw_statblock": "<text of stat block, unedited>",
    "raw_lore": "<text of any lore/description, unedited>",
    "identified_gaps": ["<e.g. 'no CR listed'>", "<'no tactics described'>", ...]
  },
  ...
]
```

Rules:
- If a stat block is missing a field (CR, HP, AC, speed, attacks), list it as a gap.
- If lore is absent or <20 words, mark `"lore: expand needed"`.
- Preserve original wording verbatim; do NOT rewrite at this stage.

- [ ] **Step 1.3: Present the normalised list to the user**

Message the user with a compact table of `name | gaps`. Ask: "Is this the right set? Any names to fix, or any to drop?"

Wait for user confirmation before moving on.

---

## Task 2: Style contract + Norse reference pack (Stage 2)

### Step 2.1: Fetch the four style guides

- [ ] Call `notion-fetch` four times (in parallel):
  - `34769e9f-245a-80e0-952c-e6ed9a0652a7` (DMs Guild)
  - `34769e9f-245a-8047-9ce2-e4efcde0a789` (DnD House Style)
  - `34769e9f-245a-8056-8287-ed4ac557cf9e` (Forgotten Realms)
  - `34769e9f-245a-808e-94f7-fd88f1410f91` (DD IP Guide)

### Step 2.2: Distill into a Style Contract

- [ ] Synthesize a ~500-word doc with these sections (use your own judgement on wording, grounded in the four source guides):

```markdown
# Style Contract — Nordic Valkyries Vol. 1

## Voice and tone
- <3-5 bullets: e.g. "active voice", "second person for DM instructions", "present tense for read-aloud">

## Capitalization and naming
- <3-5 bullets from DnD House Style / DMs Guild>

## Stat block conventions
- <3-5 bullets: e.g. "italic for spells", "ability mods in parens after scores">

## Lore and read-aloud style
- <3-5 bullets from Forgotten Realms + DMs Guild>

## IP safety (DD_IP_Guide)
- <3-5 bullets: what we can/can't reference from WotC IP in a Patreon release>

## Thematic anchors for this release
- Nordic / Norse mythological grounding
- God of War: Ragnarok as visual + combat-flavor reference
- Valkyrie-specific: battle-judgement, feather/steel motifs, silence + sudden violence
```

### Step 2.3: Write Style Contract to Notion

- [ ] Load `mcp__claude_ai_Notion__notion-update-page` via ToolSearch if not already loaded, then replace the content of `<STYLE_ID>` with the distilled doc.

### Step 2.4: Build the Norse Reference Pack

- [ ] Synthesize a ~400-word doc with these sections:

```markdown
# Norse / GoR:Ragnarok Reference Pack

## Name conventions
- Old Norse / Younger Futhark flavored names (diaeresis, ð, þ allowed)
- 5-10 candidate Valkyrie names drawn from Eddic poetry: e.g. Geirahöd, Hrist, Göll, Róta, Skögul

## Visual motifs
- Frost-bitten armor, wolf-fur cloaks, raven-feather capes
- Gold-inlaid steel, runic etching, broken chain
- GoR:Ragnarok palette: desaturated steel, deep cyan, blood-rust, aurora green

## Combat flavor
- Silent approach, terminal strike; no monologuing
- Airborne movement; spear-and-shield or two-handed blades
- Rune-magic channeled through weapons, not spells

## Lore hooks (world-agnostic)
- Valkyries as instruments of Odin's judgement, but ambiguous loyalty
- Bound to fallen warriors they've judged — cursed if warrior survives
- Rivalry/kinship among sisters (Ragnarok-style fractured choir)
```

### Step 2.5: Write Reference Pack to Notion

- [ ] Use `notion-update-page` on `<REFPACK_ID>` with the reference pack content.

### Step 2.6: GATE G2 — user review

- [ ] Message the user:

> Style Contract and Norse Reference Pack written to Notion. Please review:
> - Style Contract: https://www.notion.so/<STYLE_ID>
> - Reference Pack: https://www.notion.so/<REFPACK_ID>
>
> Edit in place if anything needs adjustment. Reply "go" when ready for Stage 3 (Bestiary generation).

**Do not proceed until user approves.**

---

## Task 3: Bestiary generation (Stage 3)

### Step 3.1: Re-fetch Style Contract + Reference Pack (user may have edited)

- [ ] `notion-fetch` on `<STYLE_ID>` and `<REFPACK_ID>`. Use the latest versions as system context for the generation loop below.

### Step 3.2: For each Valkyrie in the normalised list, generate a Bestiary page

For each entry:

- [ ] **Generate content** using Claude (this session) with the following prompt skeleton — fill placeholders from Step 1.2's normalised data + the freshly fetched style/reference context:

```
SYSTEM: You are writing a D&D 5e bestiary entry that must comply with the
attached Style Contract. The creature is a Norse-inspired homebrew Valkyrie.
Use the Reference Pack for thematic anchors. Preserve any mechanics present
in the raw stat block verbatim unless they are obviously broken — flag
those in an inline comment.

STYLE_CONTRACT: <contents of STYLE_ID>
REFERENCE_PACK: <contents of REFPACK_ID>
RAW_STATBLOCK: <entry.raw_statblock>
RAW_LORE: <entry.raw_lore>
IDENTIFIED_GAPS: <entry.identified_gaps>

OUTPUT (Markdown):
# <Name>
## Lore (~200 words)
## Appearance
## Personality
## Stat block
<5e-compliant stat block, filling gaps using the style rules>
## Tactics
## Roleplay / plot hooks (3)
```

- [ ] **Create the Bestiary page** via `notion-create-pages` with `parent = {"type":"page_id","page_id":"<BESTIARY_TEST_ID>"}`. Record the returned ID as `BESTIARY_<name>_ID`.

- [ ] **Add a link-back block** at the top of the page: `🔙 Published in: [Nordic Valkyries, Vol. 1](https://www.notion.so/<RELEASE_ID>)`

### Step 3.3: Write the consolidated Content Draft

- [ ] Use `notion-update-page` on `<DRAFT_ID>` with a summary index:

```markdown
# Content Draft — Nordic Valkyries, Vol. 1

## Valkyries (this release)
- [<Name 1>](https://www.notion.so/<BESTIARY_name1_ID>)
- [<Name 2>](https://www.notion.so/<BESTIARY_name2_ID>)
- ...

## Cover spread copy (~150 words)
<2-3 paragraphs of release-level intro text: what the supplement is, tone, how to use it in a campaign>
```

### Step 3.4: GATE G3 — user creative review

- [ ] Message the user with links to every Bestiary page + the Content Draft. Ask:

> Stage 3 complete. 3-4 Bestiary pages drafted. Please review each and edit directly in Notion until happy — I'll re-read from Notion when you're done, so your edits are the source of truth. Reply "go" when ready for Stage 4 (Homebrewery markdown).

**Do not proceed until user approves. This is the primary creative review.**

---

## Task 4: Homebrewery markdown (Stage 4)

### Step 4.1: Re-fetch Bestiary pages (post-review)

- [ ] `notion-fetch` on each `<BESTIARY_*_ID>` and on `<DRAFT_ID>`.

### Step 4.2: Generate Homebrewery-flavored markdown

- [ ] Produce a single markdown document following Homebrewery v3 syntax. Required elements:

```
\page                                 # page break (one per Valkyrie + cover + TOC)
{{frontCover}} ... {{/frontCover}}    # cover page
{{tableOfContents}} ... {{/tableOfContents}}
{{monster,frame ... }} ... {{/monster}}   # one per Valkyrie stat block
{{note}} ... {{/note}}                # for DM notes / plot hooks
```

Document structure:
1. Cover page — title, tagline, attribution line ("A Frozendice release")
2. Table of contents
3. Introduction (~150 words, from Content Draft's cover-spread copy)
4. One spread per Valkyrie: lore + appearance on left page, stat block on right page, tactics + hooks below
5. Credits + "thanks, Patrons"

### Step 4.3: Write markdown to Notion as a single code block

- [ ] Use `notion-update-page` on `<HOMEBREW_ID>`:

```markdown
# Homebrewery Markdown — Nordic Valkyries, Vol. 1

Copy the block below into a new brew at https://homebrewery.naturalcrit.com/new and export to PDF.

​```
<the full Homebrewery markdown>
​```
```

### Step 4.4: Mirror to local scratch

- [ ] Write the same markdown to `d:/src/frozendice-test/homebrewery.md`.

### Step 4.5: Log and proceed

- [ ] Append a `run.log` line: `Stage 4 done — markdown length=<N> chars, pages=<P>`. Proceed to Stage 5 without a gate (Stage 5 has its own gate).

---

## Task 5: Image generation (Stage 5)

### Step 5.1: Verify `gemini` CLI availability and Nano Banana extension

- [ ] Run:
```bash
gemini --version && gemini extensions list
```
Expected: version prints, `nanobanana` extension listed.

If extension not installed: run `gemini extensions install https://github.com/gemini-cli-extensions/nanobanana` and notify user.

### Step 5.2: Build prompt list

- [ ] Compose one prompt per target image. For this release:
  - 1 **cover image** — wide-format hero showing 3-4 Valkyries; uses Reference Pack visual motifs
  - 1 **hero image per Valkyrie** — portrait/three-quarter, each distinct per the Valkyrie's lore

Each prompt must include: subject, composition, palette (from Reference Pack), lighting, art style ("painterly; God of War: Ragnarok concept-art reference; no WotC IP"), negative prompt (no text, no watermarks, no modern elements).

- [ ] Log the full prompt list to `run.log`.

### Step 5.3: Generate 2-3 candidates per image

- [ ] For each prompt, run (sequentially, to keep rate limits sane):

```bash
cd d:/src/frozendice-test/images && gemini /generate "<prompt text>" --count=3
```

Output lands in `./nanobanana-output/` inside that dir. Rename files to `<slot>-candidate<N>.png` (slot = `cover`, `valkyrie_<name>`).

### Step 5.4: GATE G4 — user picks images

- [ ] Present each image slot's candidates to the user by file path (they can open them in the IDE):

```
Slot: cover
  - d:/src/frozendice-test/images/cover-candidate1.png
  - d:/src/frozendice-test/images/cover-candidate2.png
  - d:/src/frozendice-test/images/cover-candidate3.png
```

Ask: "For each slot, pick one (e.g. `cover=2, valkyrie_geirahöd=1`) or request regeneration with revised prompt."

**Loop on regeneration requests until user picks all slots.**

### Step 5.5: Put selected images into Notion

The Notion API embeds images via **external URL**, not file upload. Two paths — try in order:

- [ ] **Path A (preferred):** If any image-hosting MCP (e.g. GCS, S3, Cloudinary) is available in this session, upload each selected PNG and grab its public URL. Then `notion-update-page` on `<IMAGES_ID>` with image blocks referencing those URLs. Caption each block with the slot name.

- [ ] **Path B (fallback):** If no hosting MCP is available, write a `notion-update-page` that populates `<IMAGES_ID>` with a table listing each slot + local path + the prompt used, and tell the user:
  > No image-host MCP configured, so I can't embed the images directly. Please drag-and-drop the selected files from `d:/src/frozendice-test/images/` into the **Generated Images** Notion page. Reply when done.
  Wait for confirmation. This keeps originals editable on disk (meets success criterion 6) even though the embed is manual.

### Step 5.6: Log and proceed

- [ ] Append to `run.log`: `Stage 5 done — <N> images selected, <M> candidates generated total`.

---

## Task 6: Patreon post draft (Stage 6)

### Step 6.1: Compose the Patreon post

- [ ] Using the Content Draft, Style Contract, and selected cover image, generate:

```markdown
# Patreon Post Draft — Nordic Valkyries, Vol. 1

## Title (max 80 chars)
<short, hook-y, Norse-flavored>

## Teaser body (3-4 paragraphs)
<paragraph 1: evocative opening scene referencing the cover image>
<paragraph 2: what the supplement contains — # Valkyries, format, length>
<paragraph 3: who it's for — DMs running Norse/Ragnarok-flavored campaigns>
<paragraph 4: call-to-action — tier gating, thank-you>

## Tags
5e, D&D, homebrew, bestiary, valkyrie, norse, ragnarok, <3-4 more>

## Tier notes
- Free tier: cover + intro page preview (2 pages)
- Paid tier: full PDF
```

### Step 6.2: Write to Notion

- [ ] `notion-update-page` on `<POSTDRAFT_ID>` with the generated post.

### Step 6.3: GATE G5 — user review

- [ ] Message the user:

> Stage 6 complete. Patreon post draft ready: https://www.notion.so/<POSTDRAFT_ID>. Reply "go" to get Stage 7 instructions for manual publish.

**Do not proceed until user approves.**

---

## Task 7: Manual publish instructions (Stage 7)

### Step 7.1: Generate publish checklist

- [ ] Message the user with a numbered checklist:

> **Manual publish steps** (~15 minutes):
>
> 1. Open https://homebrewery.naturalcrit.com/new in a browser (logged in to your Homebrewery account).
> 2. Open the Homebrewery Markdown Notion page: https://www.notion.so/<HOMEBREW_ID>
> 3. Copy the entire contents of the code block → paste into the new brew.
> 4. Verify preview renders correctly. If broken, tell me which error Homebrewery shows and I'll patch the markdown.
> 5. Export → PDF. Save as `d:/src/frozendice-test/nordic-valkyries-vol1.pdf`.
> 6. Open Patreon creator page, start a new post.
> 7. Copy title, body, tags from https://www.notion.so/<POSTDRAFT_ID>.
> 8. Attach the PDF, then the cover image from `d:/src/frozendice-test/images/cover-candidateN.png`.
> 9. Save as **Draft** (do NOT publish yet — let us review first).
> 10. Reply "draft ready" and I'll update the release Status property to `Ready`.

### Step 7.2: Wait for user confirmation

- [ ] When user confirms "draft ready", update release page property:

Call `notion-update-page` on `<RELEASE_ID>` to set Status to `Ready` (edit the `## Release meta` markdown block; there is no property-editing required since we used inline markdown for status).

### Step 7.3: Final log + success check

- [ ] Append `run.log`:
```
Stage 7 done — release Status=Ready; PDF path=d:/src/frozendice-test/nordic-valkyries-vol1.pdf
```

- [ ] Validate success criteria from the spec:
  1. ✅ Nordgaard + Patreon Releases hubs exist?  (check via fetch)
  2. ✅ 3-4 Valkyrie pages in Bestiary - test?
  3. ✅ Homebrewery markdown rendered on naturalcrit.com?  (user reported)
  4. ✅ 4-5 images as Notion image blocks?
  5. ✅ Patreon draft post created with PDF + cover?
  6. ✅ Every artifact editable in Notion?

Report the result to the user with a one-paragraph retrospective: what was fast, what was slow, which stages are strongest candidates for Paperclip automation next.

---

## Post-run cleanup

- [ ] Ask the user: "Test run complete. Delete the local spec + plan files (`docs/superpowers/specs/...` and `docs/superpowers/plans/...`) now that they're mirrored in Notion? Or keep as reference?"

- [ ] Ask the user: "Ready to move to Phase 2 — scoping which follow-ups from the spec's 'Future scope' section we tackle first (Paperclip automation, Homebrewery MCP, Patreon MCP, DDB extraction, Nordgaard migration)?"

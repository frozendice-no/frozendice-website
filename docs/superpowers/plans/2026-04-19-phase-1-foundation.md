# Phase 1: Foundation — Sanity Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Sanity infrastructure (project, embedded Studio at `/studio`, all schemas, revalidation webhook) so later phases can query and mutate content. No user-facing pages change in this phase.

**Architecture:** Sanity v3 project with embedded Studio via `next-sanity/studio`. Schemas live in `src/sanity/schemas/`. Server components fetch via `next-sanity` client with `next: { tags: [...] }`. Sanity webhook posts to `/api/revalidate`, validated with `parseBody` from `next-sanity/webhook`, which calls `revalidateTag(body._type)`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Sanity v3, `next-sanity`, `@portabletext/react`, `@sanity/image-url`, `@sanity/block-tools`.

**⚠️ Next.js 16 note:** This version has breaking changes from prior major versions. Before writing route handlers, `generateMetadata`, or layout code, consult `node_modules/next/dist/docs/` for current conventions. If something in this plan conflicts with observed Next 16 behavior, trust the installed docs and flag the discrepancy.

---

## Spec reference

This plan implements section 7 (Sanity Studio), section 8 (partial — env vars, schemas only; MDX import lives in Phase 2), and enough of sections 4/5/6 schema definitions to unblock later phases from [docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md](../specs/2026-04-19-frozendice-redesign-design.md).

**Out of scope for this phase** (deferred to later plans):
- Blog/shop/about page rewrites (Phases 2, 3, 5)
- MDX → Sanity content import (Phase 2)
- Hero frame pipeline (Phase 4)
- Drizzle/Neon removal (Phase 6)

---

## File structure

Files created in this plan:

```
sanity.config.ts                                     # Studio root config
src/sanity/
  env.ts                                             # Typed env var reader
  client.ts                                          # next-sanity createClient
  structure.ts                                       # Desk structure (singleton handling)
  schemas/
    index.ts                                         # Schema array aggregator
    objects/
      seo.ts                                         # Shared SEO object
    blocks/
      patreonCta.ts                                  # Portable Text inline block
    tag.ts
    author.ts
    post.ts
    product.ts
    castMember.ts
    campaign.ts
    aboutPage.ts                                     # Singleton
    patreonPerks.ts                                  # Singleton
    streamSchedule.ts                                # Singleton
    featuredVods.ts                                  # Singleton
src/app/
  studio/
    [[...tool]]/
      page.tsx                                       # NextStudio mount
      layout.tsx                                     # Studio-specific metadata
  api/
    revalidate/
      route.ts                                       # Webhook handler
scripts/
  test-revalidate-route.mjs                          # Minimal route-handler test
.env.example                                         # Document all env vars
```

Files modified:

```
package.json                                         # Add deps + test script
.gitignore                                           # Ensure .env.local ignored (likely already)
```

Nothing is removed in this phase — existing blog, shop, and about pages stay intact and working. Removal happens in Phase 6.

---

## Task 1: Install Sanity dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
npm install next-sanity sanity @sanity/vision @portabletext/react @sanity/image-url @sanity/block-tools styled-components
```

- [ ] **Step 2: Verify versions in package.json**

Confirm `package.json` now lists these under `dependencies`. Sanity Studio v3+ is required (not v2). If install resolves `sanity` below v3, abort — something is wrong.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Sanity CMS dependencies"
```

---

## Task 2: Verify Vercel Native Sanity integration

The Sanity project was created via the **Vercel Marketplace Native integration**, which auto-provisions the project, tokens, and env vars. Project name: `project-orange-brush`. This task replaces the manual Sanity setup originally planned.

- [ ] **Step 1: Verify Vercel env vars are present**

Run:
```bash
vercel env ls
```

Expected (names, values encrypted): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, plus Sanity Studio/API aliases.

If any are missing, check the Vercel Integration dashboard.

- [ ] **Step 2: Add CORS origin for local dev**

In [sanity.io/manage](https://www.sanity.io/manage) → project `project-orange-brush` → API → CORS origins, add `http://localhost:3000` with `Allow credentials` checked. (The Vercel integration does not configure CORS.)

- [ ] **Step 3: (Commit note)**

Nothing to commit in this task — it's external configuration.

---

## Task 3: Pull env vars + generate webhook secret

**Files:**
- Create: `.env.example`
- Modify: `.env.local` (user-local, not committed)

- [ ] **Step 1: Pull env vars from Vercel**

Run:
```bash
vercel env pull .env.local
```

This populates `.env.local` with all env vars configured in Vercel, including the Vercel-Sanity-integration-provided values. Confirm the file now contains `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`.

- [ ] **Step 2: Generate and append `SANITY_WEBHOOK_SECRET`**

The Vercel integration does not manage a webhook secret. Generate one locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Append to `.env.local`:

```bash
SANITY_WEBHOOK_SECRET="<paste-generated-value-here>"
```

Save this value — Task 23 (webhook config in Sanity dashboard) needs the same secret, and Task 25 pushes it to Vercel.

- [ ] **Step 3: Verify `.env.local` is gitignored**

Run `git check-ignore .env.local`. Expected output: `.env.local`. If it prints nothing, add `.env.local` to `.gitignore`.

- [ ] **Step 4: Create `.env.example`**

Write this to `.env.example` (no real values, just the shape — for contributors):

```bash
# --- Sanity (auto-injected by Vercel Native Sanity integration) ---
# Run `vercel env pull .env.local` to populate in local dev.
NEXT_PUBLIC_SANITY_PROJECT_ID=""
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_READ_TOKEN=""
SANITY_API_WRITE_TOKEN=""

# --- Sanity webhook (manually generated) ---
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SANITY_WEBHOOK_SECRET=""

# --- Stripe (existing) ---
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# --- Resend (existing) ---
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""

# --- YouTube (added in Phase 4) ---
# YOUTUBE_API_KEY=""
# YOUTUBE_CHANNEL_ID=""

# --- Vercel Blob (added in Phase 3) ---
# BLOB_READ_WRITE_TOKEN=""
```

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: document environment variables"
```

---

## Task 4: Create typed env reader

**Files:**
- Create: `src/sanity/env.ts`

- [ ] **Step 1: Create `src/sanity/env.ts`**

```typescript
export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET",
);

export const apiVersion = "2025-03-04";

export const readToken = process.env.SANITY_API_READ_TOKEN;
export const writeToken = process.env.SANITY_API_WRITE_TOKEN;
export const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }
  return v;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/env.ts
git commit -m "feat(sanity): add typed env reader"
```

---

## Task 5: Create Sanity client

**Files:**
- Create: `src/sanity/client.ts`

- [ ] **Step 1: Create `src/sanity/client.ts`**

```typescript
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/client.ts
git commit -m "feat(sanity): add Sanity client"
```

---

## Task 6: Create shared SEO object schema

**Files:**
- Create: `src/sanity/schemas/objects/seo.ts`

- [ ] **Step 1: Create `src/sanity/schemas/objects/seo.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "SEO title",
      type: "string",
      description: "Overrides the document title for search engines. Keep under 60 characters.",
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: "description",
      title: "SEO description",
      type: "text",
      rows: 3,
      description: "150–160 characters recommended.",
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string" }],
    }),
  ],
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/objects/seo.ts
git commit -m "feat(sanity): add shared SEO object schema"
```

---

## Task 7: Create Patreon CTA Portable Text block

**Files:**
- Create: `src/sanity/schemas/blocks/patreonCta.ts`

- [ ] **Step 1: Create `src/sanity/schemas/blocks/patreonCta.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const patreonCta = defineType({
  name: "patreonCta",
  title: "Patreon CTA",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Want more?",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 3,
      description: "One or two sentences framing the CTA.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttonLabel",
      title: "Button label",
      type: "string",
      initialValue: "Join on Patreon",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { heading: "heading" },
    prepare({ heading }) {
      return { title: `Patreon CTA: ${heading ?? "(no heading)"}` };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/blocks/patreonCta.ts
git commit -m "feat(sanity): add Patreon CTA Portable Text block"
```

---

## Task 8: Create tag schema

**Files:**
- Create: `src/sanity/schemas/tag.ts`

- [ ] **Step 1: Create `src/sanity/schemas/tag.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const tag = defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "slug.current" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/tag.ts
git commit -m "feat(sanity): add tag schema"
```

---

## Task 9: Create author schema

**Files:**
- Create: `src/sanity/schemas/author.ts`

- [ ] **Step 1: Create `src/sanity/schemas/author.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "name", media: "avatar" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/author.ts
git commit -m "feat(sanity): add author schema"
```

---

## Task 10: Create post schema

**Files:**
- Create: `src/sanity/schemas/post.ts`

- [ ] **Step 1: Create `src/sanity/schemas/post.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Used on cards and as OG description fallback. ~25 words.",
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Promote to the featured slot on /blog.",
      initialValue: false,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
        defineArrayMember({
          type: "code",
          options: { language: "typescript", languageAlternatives: [
            { title: "TypeScript", value: "typescript" },
            { title: "JavaScript", value: "javascript" },
            { title: "Shell", value: "shell" },
            { title: "JSON", value: "json" },
            { title: "Markdown", value: "markdown" },
          ] },
        }),
        defineArrayMember({ type: "patreonCta" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt", media: "coverImage" },
  },
});
```

- [ ] **Step 2: Install `@sanity/code-input` for code block editor**

Run:
```bash
pnpm add @sanity/code-input
```

(The `code` block type above requires this plugin; Task 20 registers it in the Studio config.)

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemas/post.ts package.json pnpm-lock.yaml
git commit -m "feat(sanity): add post schema with Portable Text body"
```

---

## Task 11: Create product schema

**Files:**
- Create: `src/sanity/schemas/product.ts`

- [ ] **Step 1: Create `src/sanity/schemas/product.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 2,
      description: "~15 words. Used on product cards and as OG description fallback.",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      description: "Rich text shown on the product detail page.",
    }),
    defineField({
      name: "priceInCents",
      title: "Price (in cents)",
      type: "number",
      description: "Price in smallest currency unit. 999 = $9.99.",
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      options: { list: ["usd", "eur", "nok"] },
      initialValue: "usd",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "productType",
      title: "Product type",
      type: "string",
      options: {
        list: [
          { title: "PDF / Adventure", value: "pdf" },
          { title: "Map pack", value: "map" },
          { title: "Bundle", value: "bundle" },
          { title: "Physical", value: "physical" },
          { title: "Other", value: "other" },
        ],
      },
      initialValue: "pdf",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
      ],
    }),
    defineField({
      name: "digitalFile",
      title: "Digital file URL (Vercel Blob)",
      type: "url",
      description: "Vercel Blob URL for digital products. Leave empty for physical products.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
    }),
    defineField({
      name: "featured",
      title: "Featured on landing page",
      type: "boolean",
      description: "Appears in the 3-up featured grid on the landing page.",
      initialValue: false,
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      description: "Unpublished products are hidden from the store.",
      initialValue: false,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
    { title: "Price low to high", name: "priceAsc", by: [{ field: "priceInCents", direction: "asc" }] },
    { title: "Price high to low", name: "priceDesc", by: [{ field: "priceInCents", direction: "desc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "productType", media: "heroImage" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/product.ts
git commit -m "feat(sanity): add product schema"
```

---

## Task 12: Create castMember schema

**Files:**
- Create: `src/sanity/schemas/castMember.ts`

- [ ] **Step 1: Create `src/sanity/schemas/castMember.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const castMember = defineType({
  name: "castMember",
  title: "Cast member",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Real name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "DM", value: "dm" },
          { title: "Player", value: "player" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "characterName",
      title: "Character name",
      type: "string",
      description: "Current campaign character. Leave empty for the DM.",
    }),
    defineField({
      name: "characterClass",
      title: "Character class",
      type: "string",
      description: "e.g. Paladin, Warlock, etc.",
    }),
    defineField({
      name: "bio",
      title: "Short bio",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      description: "Currently part of the streaming cast.",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first.",
      initialValue: 10,
    }),
  ],
  orderings: [
    { title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "portrait" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/castMember.ts
git commit -m "feat(sanity): add cast member schema"
```

---

## Task 13: Create campaign schema

**Files:**
- Create: `src/sanity/schemas/campaign.ts`

- [ ] **Step 1: Create `src/sanity/schemas/campaign.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const campaign = defineType({
  name: "campaign",
  title: "Campaign",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Current", value: "current" },
          { title: "Upcoming", value: "upcoming" },
          { title: "Past", value: "past" },
        ],
      },
      initialValue: "upcoming",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "startDate", title: "Start date", type: "date" }),
    defineField({ name: "endDate", title: "End date", type: "date" }),
    defineField({
      name: "youtubePlaylistUrl",
      title: "YouTube playlist URL",
      type: "url",
    }),
    defineField({
      name: "blogTag",
      title: "Blog tag",
      type: "reference",
      to: [{ type: "tag" }],
      description: "Used to surface related session recaps.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "status", media: "coverImage" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/campaign.ts
git commit -m "feat(sanity): add campaign schema"
```

---

## Task 14: Create aboutPage singleton schema

**Files:**
- Create: `src/sanity/schemas/aboutPage.ts`

- [ ] **Step 1: Create `src/sanity/schemas/aboutPage.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Hero eyebrow",
      type: "string",
      initialValue: "About",
    }),
    defineField({
      name: "headline",
      title: "Hero headline",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Hero intro",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "storyBody",
      title: "Our story",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "values",
      title: "Values / pillars",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "value",
          fields: [
            defineField({ name: "icon", title: "Icon name (Lucide)", type: "string", description: "e.g. 'dice-5', 'map-pin', 'flame'" }),
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 2, validation: (r) => r.required().max(200) }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
      validation: (rule) => rule.min(3).max(4),
    }),
    defineField({
      name: "businessEmail",
      title: "Business email",
      type: "email",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    prepare() {
      return { title: "About page" };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/aboutPage.ts
git commit -m "feat(sanity): add aboutPage singleton schema"
```

---

## Task 15: Create patreonPerks singleton schema

**Files:**
- Create: `src/sanity/schemas/patreonPerks.ts`

- [ ] **Step 1: Create `src/sanity/schemas/patreonPerks.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const patreonPerks = defineType({
  name: "patreonPerks",
  title: "Patreon perks (landing section)",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      initialValue: "Patreon",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      initialValue: "The full saga lives here.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Intro body",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: "patreonUrl",
      title: "Patreon URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cards",
      title: "Perk cards (page stack)",
      type: "array",
      validation: (rule) => rule.min(4).max(5),
      of: [
        defineArrayMember({
          type: "object",
          name: "perkCard",
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: "e.g. 'Campaign map', 'NPC portrait'",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "blurb",
              title: "Blurb",
              type: "text",
              rows: 2,
              validation: (rule) => rule.required().max(150),
            }),
          ],
          preview: { select: { title: "label", subtitle: "blurb", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "tiers",
      title: "Tier summary (optional)",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "tierSummary",
          fields: [
            defineField({ name: "name", title: "Tier name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "price", title: "Price (display)", type: "string", description: "e.g. '$5/mo'" }),
            defineField({ name: "summary", title: "Summary", type: "text", rows: 2, validation: (r) => r.required().max(150) }),
          ],
          preview: { select: { title: "name", subtitle: "price" } },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Patreon perks section" };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/patreonPerks.ts
git commit -m "feat(sanity): add patreonPerks singleton schema"
```

---

## Task 16: Create streamSchedule singleton schema

**Files:**
- Create: `src/sanity/schemas/streamSchedule.ts`

- [ ] **Step 1: Create `src/sanity/schemas/streamSchedule.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const streamSchedule = defineType({
  name: "streamSchedule",
  title: "Stream schedule",
  type: "document",
  fields: [
    defineField({
      name: "youtubeChannelId",
      title: "YouTube channel ID",
      type: "string",
      description: "Used by the hero player embed and the LIVE pill poll.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "upcoming",
      title: "Upcoming sessions",
      type: "array",
      validation: (rule) => rule.max(3),
      of: [
        defineArrayMember({
          type: "object",
          name: "upcomingSession",
          fields: [
            defineField({ name: "title", title: "Session title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "scheduledAt", title: "Scheduled at", type: "datetime", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 2, validation: (r) => r.max(200) }),
          ],
          preview: { select: { title: "title", subtitle: "scheduledAt" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Stream schedule" };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/streamSchedule.ts
git commit -m "feat(sanity): add streamSchedule singleton schema"
```

---

## Task 17: Create featuredVods singleton schema

**Files:**
- Create: `src/sanity/schemas/featuredVods.ts`

- [ ] **Step 1: Create `src/sanity/schemas/featuredVods.ts`**

```typescript
import { defineArrayMember, defineField, defineType } from "sanity";

export const featuredVods = defineType({
  name: "featuredVods",
  title: "Featured VODs",
  type: "document",
  fields: [
    defineField({
      name: "vods",
      title: "Featured VODs",
      type: "array",
      validation: (rule) => rule.min(1).max(6),
      of: [
        defineArrayMember({
          type: "object",
          name: "vod",
          fields: [
            defineField({
              name: "youtubeVideoId",
              title: "YouTube video ID",
              type: "string",
              description: "The 11-character ID from the video URL.",
              validation: (rule) => rule.required().length(11),
            }),
            defineField({
              name: "title",
              title: "Title override",
              type: "string",
              description: "Optional. Falls back to the YouTube title.",
            }),
          ],
          preview: { select: { title: "title", subtitle: "youtubeVideoId" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Featured VODs" };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/featuredVods.ts
git commit -m "feat(sanity): add featuredVods singleton schema"
```

---

## Task 18: Create schemas index

**Files:**
- Create: `src/sanity/schemas/index.ts`

- [ ] **Step 1: Create `src/sanity/schemas/index.ts`**

```typescript
import type { SchemaTypeDefinition } from "sanity";

import { seo } from "./objects/seo";
import { patreonCta } from "./blocks/patreonCta";
import { tag } from "./tag";
import { author } from "./author";
import { post } from "./post";
import { product } from "./product";
import { castMember } from "./castMember";
import { campaign } from "./campaign";
import { aboutPage } from "./aboutPage";
import { patreonPerks } from "./patreonPerks";
import { streamSchedule } from "./streamSchedule";
import { featuredVods } from "./featuredVods";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Shared objects
  seo,
  // Portable Text blocks
  patreonCta,
  // Documents
  tag,
  author,
  post,
  product,
  castMember,
  campaign,
  // Singletons
  aboutPage,
  patreonPerks,
  streamSchedule,
  featuredVods,
];

export const singletonTypes: string[] = [
  "aboutPage",
  "patreonPerks",
  "streamSchedule",
  "featuredVods",
];
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/schemas/index.ts
git commit -m "feat(sanity): aggregate schema types"
```

---

## Task 19: Create desk structure for singletons

**Files:**
- Create: `src/sanity/structure.ts`

- [ ] **Step 1: Create `src/sanity/structure.ts`**

```typescript
import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { singletonTypes } from "./schemas";

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      // Singletons at the top
      S.listItem()
        .title("About page")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.listItem()
        .title("Patreon perks (landing)")
        .id("patreonPerks")
        .child(S.document().schemaType("patreonPerks").documentId("patreonPerks")),
      S.listItem()
        .title("Stream schedule")
        .id("streamSchedule")
        .child(S.document().schemaType("streamSchedule").documentId("streamSchedule")),
      S.listItem()
        .title("Featured VODs")
        .id("featuredVods")
        .child(S.document().schemaType("featuredVods").documentId("featuredVods")),

      S.divider(),

      // All other document types except singletons
      ...S.documentTypeListItems().filter(
        (listItem) => !singletonTypes.includes(listItem.getId() ?? ""),
      ),
    ]);
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/structure.ts
git commit -m "feat(sanity): define desk structure with singletons"
```

---

## Task 20: Create `sanity.config.ts`

**Files:**
- Create: `sanity.config.ts` (repo root)

- [ ] **Step 1: Create `sanity.config.ts`**

```typescript
import { defineConfig, type DocumentActionsResolver } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { codeInput } from "@sanity/code-input";

import { schemaTypes, singletonTypes } from "./src/sanity/schemas";
import { structure } from "./src/sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

const disallowedSingletonActions = new Set(["unpublish", "delete", "duplicate"]);

const documentActions: DocumentActionsResolver = (prev, { schemaType }) => {
  if (singletonTypes.includes(schemaType)) {
    return prev.filter((action) => !disallowedSingletonActions.has(action.action ?? ""));
  }
  return prev;
};

export default defineConfig({
  name: "frozendice",
  title: "FrozenDice",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.includes(schemaType)),
  },
  document: { actions: documentActions },
});
```

- [ ] **Step 2: Commit**

```bash
git add sanity.config.ts
git commit -m "feat(sanity): add Studio configuration"
```

---

## Task 21: Mount Studio at `/studio`

**Files:**
- Create: `src/app/studio/[[...tool]]/page.tsx`
- Create: `src/app/studio/[[...tool]]/layout.tsx`

- [ ] **Step 1: Create `src/app/studio/[[...tool]]/page.tsx`**

```tsx
"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export default function StudioPage() {
  return <NextStudio config={config} history="hash" />;
}
```

- [ ] **Step 2: Create `src/app/studio/[[...tool]]/layout.tsx`**

```tsx
import { metadata as studioMetadata, viewport as studioViewport } from "next-sanity/studio";

export const metadata = {
  ...studioMetadata,
  title: "FrozenDice Studio",
};

export const viewport = {
  ...studioViewport,
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Verify locally**

Run:
```bash
npm run dev
```

Open `http://localhost:3000/studio` in a browser. Expected: Sanity login page appears, then after login, the Studio with "About page / Patreon perks / Stream schedule / Featured VODs" singletons at the top and document types (Blog post, Product, Author, Tag, Cast member, Campaign) below.

If the page errors on load, check `.env.local` for correct project ID + dataset; check browser devtools console for the actual error.

- [ ] **Step 4: Commit**

```bash
git add "src/app/studio/[[...tool]]/page.tsx" "src/app/studio/[[...tool]]/layout.tsx"
git commit -m "feat(studio): mount Sanity Studio at /studio"
```

---

## Task 22: Implement revalidation webhook route

**Files:**
- Create: `src/app/api/revalidate/route.ts`

- [ ] **Step 1: Create `src/app/api/revalidate/route.ts`**

```typescript
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = {
  _type?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "Missing SANITY_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  try {
    const { isValidSignature, body } = await parseBody<WebhookPayload>(req, secret, true);

    if (!isValidSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    if (!body?._type) {
      return NextResponse.json({ message: "Missing _type in payload" }, { status: 400 });
    }

    revalidateTag(body._type);

    return NextResponse.json({ revalidated: body._type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Revalidation webhook error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Smoke test the 500-without-secret path**

Temporarily comment out `SANITY_WEBHOOK_SECRET` in `.env.local`, restart the dev server, and run:

```bash
curl -i -X POST http://localhost:3000/api/revalidate -H "Content-Type: application/json" -d '{"_type":"post"}'
```

Expected: `HTTP/1.1 500` with body `{"message":"Missing SANITY_WEBHOOK_SECRET"}`.

Restore `SANITY_WEBHOOK_SECRET` afterward.

- [ ] **Step 3: Smoke test the 401 invalid signature path**

With the secret restored, restart dev server. Run:

```bash
curl -i -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "sanity-webhook-signature: t=1700000000,v1=bogus" \
  -d '{"_type":"post"}'
```

Expected: `HTTP/1.1 401` with body `{"message":"Invalid signature"}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/revalidate/route.ts
git commit -m "feat(api): add Sanity revalidation webhook"
```

---

## Task 23: Configure the Sanity webhook (external)

This task is **external to the codebase** — configuring Sanity to call our handler.

- [ ] **Step 1: Create the webhook in Sanity**

In Sanity's web dashboard → Project → API → Webhooks → Create webhook.

- **Name:** `Next.js revalidate`
- **Description:** `Calls /api/revalidate on every content change`
- **URL:** `https://<your-vercel-domain>/api/revalidate` (use a temporary tunnel like `ngrok http 3000` for local testing if you want to verify before deploy)
- **Trigger on:** Create, Update, Delete
- **Filter:** leave empty (fires on all document types)
- **Projection:** `{ _type }`
- **HTTP method:** POST
- **API version:** `v2021-03-25` (or the latest stable)
- **Secret:** paste the `SANITY_WEBHOOK_SECRET` value from your `.env.local`

- [ ] **Step 2: Trigger a test publish**

Edit any document in the Studio (e.g. `Featured VODs` singleton, add a placeholder) and publish. In Sanity's webhook log (Dashboard → Webhook → Log), verify the request returned HTTP 200 with body `{"revalidated":"featuredVods"}`.

If it failed 401: secrets don't match. Copy from `.env.local` to Sanity (or vice versa).
If it failed 500: check Vercel runtime logs.

- [ ] **Step 3: (Commit note)**

Nothing to commit in this task — it's external configuration.

---

## Task 24: Document setup in README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README contents**

The current `README.md` is the default Next.js template. Overwrite it with real setup instructions:

```markdown
# FrozenDice website

Marketing site for FrozenDice — a Nordic D&D streaming brand. Built with Next.js 16, shadcn/ui, Tailwind v4, Stripe, Resend, and Sanity.

## Prerequisites

- Node.js 20+
- A Sanity account and project ([sanity.io/manage](https://www.sanity.io/manage))
- A Stripe account
- A Resend account

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Pull env vars from Vercel (project must be linked with `vercel link`):

   ```bash
   vercel env pull .env.local
   ```

   Then append any non-Vercel-managed values (e.g. `SANITY_WEBHOOK_SECRET`) — see `.env.example` for the shape.

3. Run the dev server:

   ```bash
   pnpm dev
   ```

   - Site: http://localhost:3000
   - Sanity Studio: http://localhost:3000/studio

## Architecture

See [docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md](docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md) for the design spec and [docs/superpowers/plans/](docs/superpowers/plans/) for phased implementation plans.

## Deployment

Deploys to Vercel. All environment variables from `.env.example` must be set in the Vercel project. The Sanity webhook (`/api/revalidate`) must point at the deployed domain; see the "Task 23" entry in the Phase 1 plan for the setup procedure.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with real setup instructions"
```

---

## Task 25: Push webhook secret + deploy

Most Sanity env vars already exist in Vercel (auto-injected by the Native integration). Only `SANITY_WEBHOOK_SECRET` must be pushed manually.

- [ ] **Step 1: Push `SANITY_WEBHOOK_SECRET` to Vercel**

Using the CLI (recommended):

```bash
vercel env add SANITY_WEBHOOK_SECRET production
vercel env add SANITY_WEBHOOK_SECRET preview
vercel env add SANITY_WEBHOOK_SECRET development
```

Paste the same value that's in your `.env.local` at each prompt. Alternatively add via the Vercel dashboard UI.

- [ ] **Step 2: Deploy**

Push the branch:

```bash
git push -u origin feature/sanity-foundation
```

Confirm the Vercel preview build succeeds (check the Vercel dashboard or Git integration status).

- [ ] **Step 3: Verify Studio in preview**

Visit `https://<preview-deployment-domain>/studio`. Log in with the linked Sanity account. Confirm the Studio loads with all singletons + document types.

- [ ] **Step 4: Update Sanity webhook URL (if needed)**

In Sanity → Webhooks → edit the webhook created in Task 23. If you initially pointed it at production, it's already correct. If at a tunnel (ngrok) for testing, switch it to the production Vercel domain. Save.

- [ ] **Step 5: Trigger a test publish**

Edit and publish any document. Verify the Sanity webhook log shows HTTP 200 from your production domain.

- [ ] **Step 6: (Commit note)**

Nothing to commit in this task — it's external configuration.

---

## Definition of Done (Phase 1)

Phase 1 is complete when all of these are true:

1. `npm run dev` starts cleanly with no type errors.
2. `http://localhost:3000/studio` loads the Sanity Studio, shows all four singletons at the top of the desk, and lists all document types (Blog post, Product, Author, Tag, Cast member, Campaign).
3. You can create a test document of every document type in the Studio without schema errors.
4. `curl -X POST http://localhost:3000/api/revalidate` without a valid signature returns HTTP 401.
5. A publish action in Sanity triggers a webhook that hits `/api/revalidate` with HTTP 200.
6. The site deploys to Vercel; `/studio` loads in production; production webhook fires successfully.
7. No existing page (`/`, `/blog`, `/store`, `/about`) has regressed — all of them still render as they did before Phase 1.

---

## Self-review notes

- **Spec coverage:** This plan implements spec §7 (Studio at `/studio`), the schema definitions from §4, §5, §6, and the `aboutPage`/`patreonPerks`/`streamSchedule`/`featuredVods` singletons referenced by §3.2, §3.3, §6. MDX import (§8), page rewrites (§3–6), and cleanup (§9 phase 6) are explicitly deferred to later plans.
- **Placeholder scan:** no TBDs, no "add error handling" stubs, all schemas have concrete fields, all tasks have real code.
- **Type consistency:** `singletonTypes` defined in Task 18 is consumed in Tasks 19 and 20 with matching name. Document type IDs match between schemas, desk structure, and the singleton filter.
- **Env var consistency:** `NEXT_PUBLIC_` prefix used for Studio-accessible vars; private vars without prefix. Matches Sanity docs and spec §8.
- **Dependency: `@sanity/code-input`** is installed in Task 10 (same commit as post schema that uses it) rather than Task 1, because it only matters once the post schema's code block exists — keeps the install in the same change set as its consumer.

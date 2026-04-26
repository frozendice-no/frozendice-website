# Phase 2: Blog MDX → Sanity Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 8 existing MDX blog posts into Sanity, rewrite `/blog` routes to read from Sanity (with Portable Text rendering + syntax-highlighted code + inline Patreon CTAs), update the RSS feed and sitemap to Sanity-sourced data, and remove the now-dead MDX pipeline.

**Architecture:** A one-shot Node script (`scripts/import-mdx-to-sanity.ts`) parses each MDX file, converts Markdown to Portable Text via `@sanity/block-tools`, creates/reuses `tag` and `author` documents, and upserts `post` documents against a consistent ID derived from the original slug. The blog routes become RSC pages that query Sanity with `next: { tags: [...] }`; Portable Text is rendered via `@portabletext/react` with custom block components for images (`next/image` + `@sanity/image-url`), code blocks (`shiki` at render time on the server), and inline `patreonCta` blocks. No MDX processing at runtime.

**Tech Stack:** Next.js 16 (App Router, RSC), Sanity v5 + `next-sanity`, `@portabletext/react`, `@sanity/image-url`, `@sanity/block-tools` (already installed from Phase 1), `shiki` (added in this phase), TypeScript.

**⚠️ Next.js 16 note:** This version has breaking changes from prior majors. Before touching route handlers, `generateMetadata`, `generateStaticParams`, or metadata API shapes, consult `node_modules/next/dist/docs/` — don't rely on pre-16 knowledge.

---

## Spec reference

This plan implements spec section 5 (Blog page) and the MDX → Sanity portion of section 8 (Asset pipeline). Source: [`docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md`](../specs/2026-04-19-frozendice-redesign-design.md).

**Out of scope** (deferred to later plans):
- Shop/products migration (Phase 3)
- Landing page rebuild (Phase 4)
- About page rewrite (Phase 5)
- Removing Neon/Drizzle + unused DB tables (Phase 6)
- Sanity webhook side of revalidation (that's a user-side config task from Phase 1, Task 23 — it gates *automatic* cache busting, not correctness)

## Key decisions locked in the spec

- **Categories are dropped.** MDX frontmatter has both `tags: [...]` and `categories: [...]`. Post-migration, only `tag` documents exist — categories get merged into tags during import (each unique category name becomes a tag). The existing `/blog/category/[category]` route is removed; redirects map old category URLs to the corresponding tag URLs.
- **Single author for now.** All 8 existing MDX posts have `author: "Frozen Dice"`. The script creates one `author` document and references it on every imported post. A real author schema is already defined (Phase 1) so multi-author content works later without schema changes.
- **Reading time is computed at render.** No stored field — a pure helper counts words in the Portable Text body.
- **Cover images: all current MDX cover images are empty strings.** Import script handles empty cover gracefully and skips the Sanity image upload. Posts without cover images render with a fallback layout (no image block).

---

## File structure

### Created

```
scripts/
  import-mdx-to-sanity.ts               # One-shot import script (dry-run + apply modes)
src/sanity/
  image.ts                              # @sanity/image-url builder helper
  queries.ts                            # GROQ query strings + typed fetchers
  types.ts                              # Exported TS types matching GROQ projections
  reading-time.ts                       # Pure helper: PortableTextBlock[] → minutes
src/components/
  portable-text/
    index.tsx                           # Main <PortableText /> renderer with block components
    code-block.tsx                      # Server component: shiki-highlighted <pre>
    image-block.tsx                     # next/image + @sanity/image-url renderer
    patreon-cta-block.tsx               # Custom block component for inline Patreon CTAs
```

### Modified

```
src/components/
  blog-card.tsx                         # Swap type from BlogPostMeta → Sanity shape
  blog-post.tsx                         # Replace MDXRemote with PortableText; swap types
  category-filter.tsx                   # Rename to tag-filter.tsx; operate on tag documents
src/app/(marketing)/blog/
  page.tsx                              # Read from Sanity instead of getAllPosts()
  [slug]/page.tsx                       # Sanity-sourced; generateStaticParams + Metadata
  tag/[tag]/page.tsx                    # Rename dir to tag/[slug]; Sanity-sourced
src/app/feed.xml/route.ts               # Sanity-sourced
src/app/sitemap.ts                      # Sanity-sourced blog entries
next.config.ts                          # Add redirects for /blog/category/* → /blog/tag/*
package.json                            # Add shiki, remove next-mdx-remote/gray-matter/reading-time
```

### Deleted (after migration verified)

```
src/lib/blog.ts                          # Replaced by Sanity queries
src/app/(marketing)/blog/category/       # Category archive routes dropped
content/blog/                            # 8 MDX files retired after successful import
```

---

## Task 1: Install shiki

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add shiki
```

- [ ] **Step 2: Verify**

`grep '"shiki"' package.json` shows `shiki: "^3.x"` or similar in `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add shiki for server-rendered code highlighting"
```

---

## Task 2: Create Sanity image URL helper

**Files:**
- Create: `src/sanity/image.ts`

- [ ] **Step 1: Create**

```typescript
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
```

- [ ] **Step 2: Typecheck**

`pnpm tsc --noEmit` — no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/image.ts
git commit -m "feat(sanity): add image URL builder helper"
```

---

## Task 3: Create TypeScript types for queries

**Files:**
- Create: `src/sanity/types.ts`

These types match the GROQ projection shapes in Task 4 so components get strong typing end-to-end.

- [ ] **Step 1: Create**

```typescript
import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";

export type SanityImage = SanityImageSource & {
  alt?: string;
};

export type AuthorRef = {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: SanityImage;
};

export type TagRef = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: SanityImage;
  publishedAt: string;
  featured: boolean;
  tags: TagRef[];
  author: AuthorRef;
};

export type PostDetail = PostCard & {
  body: PortableTextBlock[];
  seo?: {
    title?: string;
    description?: string;
    ogImage?: SanityImage;
  };
};
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/types.ts
git commit -m "feat(sanity): add TS types matching GROQ projections"
```

---

## Task 4: Create GROQ queries + typed fetchers

**Files:**
- Create: `src/sanity/queries.ts`

- [ ] **Step 1: Create**

```typescript
import { client } from "./client";
import type { PostCard, PostDetail, TagRef } from "./types";

const POST_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage { ..., "alt": coalesce(alt, "") },
  publishedAt,
  featured,
  "tags": tags[]->{ _id, name, "slug": slug.current, description },
  "author": author->{ _id, name, "slug": slug.current, bio, avatar }
`;

const POST_DETAIL_PROJECTION = `
  ${POST_CARD_PROJECTION},
  body,
  seo
`;

export async function getAllPosts(): Promise<PostCard[]> {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) { ${POST_CARD_PROJECTION} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getFeaturedPost(): Promise<PostCard | null> {
  return client.fetch(
    `*[_type == "post" && featured == true && defined(publishedAt)] | order(publishedAt desc) [0] { ${POST_CARD_PROJECTION} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] { ${POST_DETAIL_PROJECTION} }`,
    { slug },
    { next: { tags: ["post"] } },
  );
}

export async function getPostsByTagSlug(tagSlug: string): Promise<PostCard[]> {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt) && $tagSlug in tags[]->slug.current] | order(publishedAt desc) { ${POST_CARD_PROJECTION} }`,
    { tagSlug },
    { next: { tags: ["post", "tag"] } },
  );
}

export async function getAllTags(): Promise<TagRef[]> {
  return client.fetch(
    `*[_type == "tag"] | order(name asc) { _id, name, "slug": slug.current, description }`,
    {},
    { next: { tags: ["tag"] } },
  );
}

export async function getRelatedPosts(
  slug: string,
  tagSlugs: string[],
  limit = 3,
): Promise<PostCard[]> {
  if (tagSlugs.length === 0) return [];
  return client.fetch(
    `*[_type == "post" && slug.current != $slug && count((tags[]->slug.current)[@ in $tagSlugs]) > 0] | order(publishedAt desc) [0...$limit] { ${POST_CARD_PROJECTION} }`,
    { slug, tagSlugs, limit },
    { next: { tags: ["post"] } },
  );
}
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/queries.ts
git commit -m "feat(sanity): add GROQ queries for blog"
```

---

## Task 5: Reading-time helper

**Files:**
- Create: `src/sanity/reading-time.ts`

- [ ] **Step 1: Create**

```typescript
import type { PortableTextBlock } from "@portabletext/react";

const WORDS_PER_MINUTE = 200;

function blockText(block: PortableTextBlock): string {
  if (block._type !== "block") return "";
  const children = (block as unknown as { children?: Array<{ text?: string }> }).children ?? [];
  return children.map((c) => c.text ?? "").join(" ");
}

export function readingTimeMinutes(body: PortableTextBlock[] | undefined): number {
  if (!body || body.length === 0) return 1;
  const text = body.map(blockText).join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function readingTimeLabel(body: PortableTextBlock[] | undefined): string {
  const minutes = readingTimeMinutes(body);
  return `${minutes} min read`;
}
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/reading-time.ts
git commit -m "feat(sanity): add Portable Text reading-time helper"
```

---

## Task 6: Portable Text image block component

**Files:**
- Create: `src/components/portable-text/image-block.tsx`

- [ ] **Step 1: Create**

```tsx
import Image from "next/image";
import { urlForImage } from "@/sanity/image";
import type { SanityImage } from "@/sanity/types";

type Props = { value: SanityImage };

export function ImageBlock({ value }: Props) {
  const url = urlForImage(value).width(1200).auto("format").url();
  const alt = value.alt ?? "";
  return (
    <figure className="my-8">
      <Image
        src={url}
        alt={alt}
        width={1200}
        height={675}
        className="w-full rounded-lg object-cover"
      />
      {alt && (
        <figcaption className="mt-2 text-sm text-muted-foreground">{alt}</figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/portable-text/image-block.tsx
git commit -m "feat(blog): add Portable Text image block renderer"
```

---

## Task 7: Portable Text code block component (shiki)

**Files:**
- Create: `src/components/portable-text/code-block.tsx`

- [ ] **Step 1: Create**

```tsx
import { codeToHtml } from "shiki";

type CodeValue = {
  language?: string;
  code: string;
};

type Props = { value: CodeValue };

export async function CodeBlock({ value }: Props) {
  const language = value.language ?? "text";
  const html = await codeToHtml(value.code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
  });
  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border text-sm [&_pre]:p-4 [&_pre]:bg-transparent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean. (Note: async server components are Next 15+ supported; the `await codeToHtml` resolves at render time on the server.)

- [ ] **Step 3: Commit**

```bash
git add src/components/portable-text/code-block.tsx
git commit -m "feat(blog): add shiki-backed code block renderer"
```

---

## Task 8: Patreon CTA block component

**Files:**
- Create: `src/components/portable-text/patreon-cta-block.tsx`

- [ ] **Step 1: Create**

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PatreonCtaValue = {
  heading: string;
  body: string;
  buttonLabel: string;
};

type Props = { value: PatreonCtaValue };

export function PatreonCtaBlock({ value }: Props) {
  return (
    <aside className="my-10 rounded-xl border bg-primary/5 p-6 not-prose">
      <h3 className="text-xl font-semibold">{value.heading}</h3>
      <p className="mt-2 text-muted-foreground">{value.body}</p>
      <Link
        href="https://www.patreon.com/frozendice"
        className={cn(buttonVariants(), "mt-4")}
      >
        {value.buttonLabel}
      </Link>
    </aside>
  );
}
```

Note: the Patreon URL is hardcoded here for now. Phase 4 will thread it through the `patreonPerks` Sanity document; for Phase 2 we keep it simple.

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/portable-text/patreon-cta-block.tsx
git commit -m "feat(blog): add inline Patreon CTA block component"
```

---

## Task 9: Main Portable Text renderer

**Files:**
- Create: `src/components/portable-text/index.tsx`

- [ ] **Step 1: Create**

```tsx
import { PortableText as PortableTextLib, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";

import { ImageBlock } from "./image-block";
import { CodeBlock } from "./code-block";
import { PatreonCtaBlock } from "./patreon-cta-block";

const components: PortableTextComponents = {
  types: {
    image: ImageBlock,
    code: CodeBlock,
    patreonCta: PatreonCtaBlock,
  },
};

type Props = { value: PortableTextBlock[] };

export function PortableText({ value }: Props) {
  return <PortableTextLib value={value} components={components} />;
}
```

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/portable-text/index.tsx
git commit -m "feat(blog): add Portable Text renderer with custom blocks"
```

---

## Task 10: MDX-to-Sanity import script — setup

**Files:**
- Create: `scripts/import-mdx-to-sanity.ts`

This is a single script. We build it incrementally across Tasks 10–13, then run it in Task 14.

- [ ] **Step 1: Create script skeleton**

```typescript
#!/usr/bin/env -S pnpm tsx
/**
 * One-shot migration: content/blog/*.mdx → Sanity `post` documents.
 *
 * Usage:
 *   pnpm tsx scripts/import-mdx-to-sanity.ts --dry-run  # preview
 *   pnpm tsx scripts/import-mdx-to-sanity.ts --apply    # actually write
 *
 * Idempotent: documents get stable IDs derived from the source slug, so
 * re-running the same input produces the same Sanity state.
 */
import { createClient } from "next-sanity";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DRY_RUN = !process.argv.includes("--apply");
const BLOG_DIR = path.join(process.cwd(), "content/blog");
const AUTHOR_NAME = "Frozen Dice";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-03-04",
  token,
  useCdn: false,
});

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} MDX files in ${BLOG_DIR}`);
  console.log(DRY_RUN ? "DRY RUN — no writes" : "APPLY — writing to Sanity");
  console.log("");

  // Tasks 11, 12, 13 fill in the rest of this function incrementally.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Install `tsx` dev dep (for running TS scripts)**

```bash
pnpm add -D tsx
```

- [ ] **Step 3: Verify syntactically**

```bash
pnpm tsx scripts/import-mdx-to-sanity.ts --dry-run
```

Expected output: `Found 8 MDX files in .../content/blog` + `DRY RUN — no writes`. The body of `main()` is otherwise empty, so nothing else happens — that's fine.

- [ ] **Step 4: Commit**

```bash
git add scripts/import-mdx-to-sanity.ts package.json pnpm-lock.yaml
git commit -m "feat(migrate): scaffold MDX-to-Sanity import script"
```

---

## Task 11: Import script — author + tag document upserts

**Files:**
- Modify: `scripts/import-mdx-to-sanity.ts`

- [ ] **Step 1: Add upsert helpers and tag/author creation at the top of `main()`**

Inside `scripts/import-mdx-to-sanity.ts`, add the following above `async function main()`:

```typescript
async function upsertDoc(doc: Record<string, unknown> & { _id: string; _type: string }) {
  if (DRY_RUN) {
    console.log(`  [dry] upsert ${doc._type} ${doc._id}`);
    return doc._id;
  }
  await client.createOrReplace(doc);
  return doc._id;
}

async function ensureAuthor(): Promise<string> {
  const slug = slugify(AUTHOR_NAME);
  const id = `author-${slug}`;
  return upsertDoc({
    _id: id,
    _type: "author",
    name: AUTHOR_NAME,
    slug: { _type: "slug", current: slug },
    bio: "Nordic-inspired D&D streaming crew.",
  });
}

async function ensureTag(name: string): Promise<string> {
  const slug = slugify(name);
  const id = `tag-${slug}`;
  return upsertDoc({
    _id: id,
    _type: "tag",
    name,
    slug: { _type: "slug", current: slug },
  });
}
```

Then replace the current body of `main()` with:

```typescript
async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} MDX files in ${BLOG_DIR}`);
  console.log(DRY_RUN ? "DRY RUN — no writes" : "APPLY — writing to Sanity");
  console.log("");

  const authorId = await ensureAuthor();
  console.log(`Author ref: ${authorId}`);

  const allTagNames = new Set<string>();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    for (const t of [...(data.tags ?? []), ...(data.categories ?? [])]) {
      allTagNames.add(String(t));
    }
  }
  console.log(`Unique tags/categories: ${allTagNames.size}`);

  const tagIdBySlug = new Map<string, string>();
  for (const name of allTagNames) {
    const id = await ensureTag(name);
    tagIdBySlug.set(slugify(name), id);
  }
  console.log(`Tag refs: ${tagIdBySlug.size}`);
  console.log("");

  // Task 12 fills in post upsert loop.
  console.log("(posts not yet imported — that's Task 12)");
}
```

- [ ] **Step 2: Dry-run**

```bash
pnpm tsx scripts/import-mdx-to-sanity.ts --dry-run
```

Expected: prints `Found 8 MDX files`, one `[dry] upsert author author-frozen-dice` line, then `Unique tags/categories: N`, then `N` lines of `[dry] upsert tag tag-<slug>`, then `Tag refs: N` and the "(posts not yet imported)" line.

- [ ] **Step 3: Commit**

```bash
git add scripts/import-mdx-to-sanity.ts
git commit -m "feat(migrate): add author + tag upserts to import script"
```

---

## Task 12: Import script — post upserts + Markdown → Portable Text

**Files:**
- Modify: `scripts/import-mdx-to-sanity.ts`

- [ ] **Step 1: Add post upsert logic**

At the top of `scripts/import-mdx-to-sanity.ts`, add these imports:

```typescript
import { htmlToBlocks } from "@sanity/block-tools";
import { Schema } from "@sanity/schema";
import { marked } from "marked";
import { JSDOM } from "jsdom";
```

(The `marked` and `jsdom` packages are new dev deps for this script; install in Step 3.)

Define the minimal schema needed by `htmlToBlocks` below the helpers:

```typescript
const blockContentSchema = Schema.compile({
  name: "postBody",
  types: [
    {
      type: "array",
      name: "body",
      of: [{ type: "block" }, { type: "image" }, { type: "code" }, { type: "patreonCta" }],
    },
  ],
}).get("body");

async function markdownToPortableText(markdown: string): Promise<unknown[]> {
  const html = await marked.parse(markdown);
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const body = dom.window.document.body;
  return htmlToBlocks(body, blockContentSchema, {
    parseHtml: () => dom.window.document,
  });
}
```

Replace the `(posts not yet imported ...)` line in `main()` with:

```typescript
  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    const slug = path.basename(file, ".mdx");
    const postId = `post-${slug}`;
    const tagNames: string[] = [...(data.tags ?? []), ...(data.categories ?? [])];
    const tagRefs = tagNames
      .map((n) => tagIdBySlug.get(slugify(n)))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ _type: "reference", _ref: id, _key: id }));

    const body = await markdownToPortableText(content);

    console.log(`  post-${slug}  (tags: ${tagNames.length}, body blocks: ${body.length})`);

    await upsertDoc({
      _id: postId,
      _type: "post",
      title: data.title ?? slug,
      slug: { _type: "slug", current: slug },
      excerpt: data.excerpt ?? "",
      publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : new Date().toISOString(),
      featured: false,
      author: { _type: "reference", _ref: authorId },
      tags: tagRefs,
      body,
    });
  }

  console.log("");
  console.log(DRY_RUN ? "Dry run complete. No changes written." : "Import complete.");
```

- [ ] **Step 2: Install script-only deps**

```bash
pnpm add -D marked jsdom @types/jsdom
```

- [ ] **Step 3: Dry-run**

```bash
pnpm tsx scripts/import-mdx-to-sanity.ts --dry-run
```

Expected: 8 `post-<slug>` lines, each reporting tag count + body block count. No errors. Body block counts should be > 1 per post (typical posts will have 15-40 blocks).

- [ ] **Step 4: Typecheck**

```bash
pnpm tsc --noEmit
```

If `jsdom` types conflict with browser `DOM.lib` types in tsconfig, the `scripts/` directory may need to be excluded from the main `tsc` run — check `tsconfig.json`. If the baseline excludes `scripts/` already, no change needed.

- [ ] **Step 5: Commit**

```bash
git add scripts/import-mdx-to-sanity.ts package.json pnpm-lock.yaml
git commit -m "feat(migrate): convert Markdown to Portable Text in import script"
```

---

## Task 13: Apply the import

**Files:** None modified (external action — writes to Sanity).

- [ ] **Step 1: Apply**

```bash
pnpm tsx scripts/import-mdx-to-sanity.ts --apply
```

Expected: same output as dry-run but without `[dry]` prefix, and final line reads `Import complete.`

- [ ] **Step 2: Verify in Studio**

Start the dev server (`pnpm dev`), open `http://localhost:3000/studio`. Log in (GitHub/Google/email — *not* Vercel, per known-issue in the Notion status page). Click **Blog post** in the sidebar. Confirm:

- 8 posts present with correct titles and slugs matching MDX filenames
- Each post has the "Frozen Dice" author reference populated
- Each post has ≥1 tag reference
- Open one post's **Body** field; confirm Portable Text renders with paragraphs, headings, lists

If counts or content look wrong, **stop and investigate before deleting MDX files.** The source of truth is still `content/blog/` until Task 24.

- [ ] **Step 3: (No commit)** — this task only writes to Sanity.

---

## Task 14: Rewrite `blog-card.tsx` for Sanity shape

**Files:**
- Modify: `src/components/blog-card.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlForImage } from "@/sanity/image";
import type { PostCard } from "@/sanity/types";

export function BlogCard({ post, readingLabel }: { post: PostCard; readingLabel: string }) {
  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(640).height(360).auto("format").url()
    : null;
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <Card className="h-full border-0 bg-muted/30 transition-colors group-hover:bg-muted/50">
        {coverUrl && (
          <div className="overflow-hidden rounded-t-lg">
            <Image
              src={coverUrl}
              alt={post.coverImage?.alt ?? post.title}
              width={640}
              height={360}
              className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {post.tags.map((tag) => (
              <span
                key={tag._id}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar aria-hidden="true" className="h-3 w-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock aria-hidden="true" className="h-3 w-3" />
              {readingLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

Reading time now comes from the parent (computed from the post body at render). Card itself doesn't know about Portable Text.

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` — expect errors *only* in the three pages that still import the old `BlogCard` signature. We fix those next tasks. If any other file errors, investigate before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog-card.tsx
git commit -m "feat(blog): rewrite BlogCard against Sanity types"
```

---

## Task 15: Rewrite `category-filter.tsx` as `tag-filter.tsx`

**Files:**
- Rename: `src/components/category-filter.tsx` → `src/components/tag-filter.tsx`
- Modify: new file's contents

- [ ] **Step 1: Rename**

```bash
git mv src/components/category-filter.tsx src/components/tag-filter.tsx
```

- [ ] **Step 2: Rewrite content**

Replace the entire contents of `src/components/tag-filter.tsx` with:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { TagRef } from "@/sanity/types";

export function TagFilter({
  tags,
  activeTagSlug,
}: {
  tags: TagRef[];
  activeTagSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={cn(
          buttonVariants({
            variant: activeTagSlug ? "outline" : "default",
            size: "sm",
          }),
        )}
      >
        All
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag._id}
          href={`/blog/tag/${tag.slug}`}
          className={cn(
            buttonVariants({
              variant: activeTagSlug === tag.slug ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck** — expect errors in pages that still import `CategoryFilter`. We fix those in Tasks 16–18.

- [ ] **Step 4: Commit**

```bash
git add src/components/tag-filter.tsx src/components/category-filter.tsx
git commit -m "feat(blog): replace CategoryFilter with TagFilter (Sanity-aware)"
```

---

## Task 16: Rewrite blog listing page

**Files:**
- Modify: `src/app/(marketing)/blog/page.tsx`

- [ ] **Step 1: Rewrite**

```tsx
import type { Metadata } from "next";
import { getAllPosts, getAllTags, getFeaturedPost, getPostBySlug } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogCard } from "@/components/blog-card";
import { TagFilter } from "@/components/tag-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "D&D tips, homebrew content, campaign guides, and tabletop RPG resources from Frozen Dice.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, tags, featuredCard] = await Promise.all([
    getAllPosts(),
    getAllTags(),
    getFeaturedPost(),
  ]);

  const featuredDetail = featuredCard ? await getPostBySlug(featuredCard.slug) : null;
  const featuredLabel = featuredDetail ? readingTimeLabel(featuredDetail.body) : "";

  const postsWithLabels = await Promise.all(
    posts.map(async (p) => {
      const detail = await getPostBySlug(p.slug);
      return { post: p, label: detail ? readingTimeLabel(detail.body) : "" };
    }),
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
          <p className="mt-2 text-muted-foreground">
            Tips, guides, and homebrew content for your tabletop adventures.
          </p>
        </div>

        {featuredCard && (
          <div className="mb-10">
            <BlogCard post={featuredCard} readingLabel={featuredLabel} />
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-8">
            <TagFilter tags={tags} />
          </div>
        )}

        {postsWithLabels.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithLabels.map(({ post, label }) => (
              <BlogCard key={post._id} post={post} readingLabel={label} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

**Note:** this calls `getPostBySlug` for every post on the listing just to compute reading time. That's per-post overhead. Better long-term: include a computed reading-time field in the `PostCard` projection, or store `wordCount` on the post. For launch simplicity the per-post fetch is acceptable since Sanity caches at request level and we have 8 posts. If this becomes slow, add `"readingTimeLabel": ...` to the GROQ projection computing from `body` blocks at query time.

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean at this file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(marketing)/blog/page.tsx"
git commit -m "feat(blog): rewrite /blog listing against Sanity"
```

---

## Task 17: Rewrite blog post detail page

**Files:**
- Modify: `src/app/(marketing)/blog/[slug]/page.tsx`

- [ ] **Step 1: Rewrite**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogPostContent } from "@/components/blog-post";
import { BlogCard } from "@/components/blog-card";
import { siteConfig } from "@/lib/site-config";
import { urlForImage } from "@/sanity/image";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const ogImage = post.seo?.ogImage ?? post.coverImage;
  const ogUrl = ogImage ? urlForImage(ogImage).width(1200).height(630).url() : undefined;

  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seo?.title ?? post.title,
      description: post.seo?.description ?? post.excerpt,
      url: `${siteConfig.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: ogUrl ? [ogUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const readingLabel = readingTimeLabel(post.body);
  const tagSlugs = post.tags.map((t) => t.slug);
  const related = await getRelatedPosts(post.slug, tagSlugs, 3);
  const relatedWithLabels = await Promise.all(
    related.map(async (p) => {
      const detail = await getPostBySlug(p.slug);
      return { post: p, label: detail ? readingTimeLabel(detail.body) : "" };
    }),
  );

  return (
    <>
      <BlogPostContent post={post} readingLabel={readingLabel} />
      {relatedWithLabels.length > 0 && (
        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold">Related Posts</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedWithLabels.map(({ post: p, label }) => (
                <BlogCard key={p._id} post={p} readingLabel={label} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck** — expect errors *only* in `src/components/blog-post.tsx` (next task rewrites it). If other files error, investigate.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(marketing)/blog/[slug]/page.tsx"
git commit -m "feat(blog): rewrite /blog/[slug] against Sanity"
```

---

## Task 18: Rewrite `blog-post.tsx` for Portable Text

**Files:**
- Modify: `src/components/blog-post.tsx`

- [ ] **Step 1: Rewrite**

```tsx
import Image from "next/image";
import { Calendar, Clock, User } from "lucide-react";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site-config";
import { PortableText } from "@/components/portable-text";
import { urlForImage } from "@/sanity/image";
import type { PostDetail } from "@/sanity/types";
import { PatreonCtaBlock } from "@/components/portable-text/patreon-cta-block";

export async function BlogPostContent({
  post,
  readingLabel,
}: {
  post: PostDetail;
  readingLabel: string;
}) {
  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(1920).height(1080).auto("format").url()
    : null;
  const ogImage = post.seo?.ogImage ?? post.coverImage;
  const ogUrl = ogImage ? urlForImage(ogImage).width(1200).height(630).url() : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: ogUrl ?? undefined,
          datePublished: post.publishedAt,
          author: {
            "@type": "Person",
            name: post.author.name,
          },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
          },
          mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag._id}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User aria-hidden="true" className="h-4 w-4" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar aria-hidden="true" className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {readingLabel}
            </span>
          </div>
        </header>

        {coverUrl && (
          <Image
            src={coverUrl}
            alt={post.coverImage?.alt ?? post.title}
            width={1920}
            height={1080}
            priority
            className="mb-10 aspect-video w-full rounded-lg object-cover"
          />
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <PortableText value={post.body} />
        </div>

        <PatreonCtaBlock
          value={{
            heading: "Enjoying the saga?",
            body: "Our patrons get behind-the-scenes notes, exclusive session recaps, and early access to every stream.",
            buttonLabel: "Join on Patreon",
          }}
        />
      </article>
    </>
  );
}
```

**Key differences from the old implementation:**
- Uses `PortableText` instead of `MDXRemote`
- `post.author` is a reference (`.name`)
- `post.tags` are references (`.name`, `.slug`)
- Always renders a footer Patreon CTA block (per spec §5 — "always-on footer CTA")
- SEO image derivation now uses Sanity `seo.ogImage` → `coverImage` → none

- [ ] **Step 2: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog-post.tsx
git commit -m "feat(blog): render Portable Text in BlogPostContent"
```

---

## Task 19: Rewrite tag archive route (`/blog/tag/[slug]`)

**Files:**
- Rename: `src/app/(marketing)/blog/tag/[tag]/` → `src/app/(marketing)/blog/tag/[slug]/`
- Modify: new file's contents

- [ ] **Step 1: Rename the directory**

```bash
git mv "src/app/(marketing)/blog/tag/[tag]" "src/app/(marketing)/blog/tag/[slug]"
```

- [ ] **Step 2: Rewrite `src/app/(marketing)/blog/tag/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostBySlug, getPostsByTagSlug } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogCard } from "@/components/blog-card";
import { TagFilter } from "@/components/tag-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const allTags = await getAllTags();
  const tag = allTags.find((t) => t.slug === slug);
  if (!tag) return {};
  return {
    title: `#${tag.name}`,
    description: tag.description ?? `Posts tagged with #${tag.name} on Frozen Dice.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const [posts, allTags] = await Promise.all([getPostsByTagSlug(slug), getAllTags()]);
  const tag = allTags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const postsWithLabels = await Promise.all(
    posts.map(async (p) => {
      const detail = await getPostBySlug(p.slug);
      return { post: p, label: detail ? readingTimeLabel(detail.body) : "" };
    }),
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: `#${tag.name}`, href: `/blog/tag/${tag.slug}` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">#{tag.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {tag.description ?? `All posts tagged with #${tag.name}.`}
          </p>
        </div>

        <div className="mb-8">
          <TagFilter tags={allTags} activeTagSlug={tag.slug} />
        </div>

        {postsWithLabels.length === 0 ? (
          <p className="text-muted-foreground">No posts with this tag yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithLabels.map(({ post, label }) => (
              <BlogCard key={post._id} post={post} readingLabel={label} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)/blog/tag"
git commit -m "feat(blog): rewrite /blog/tag/[slug] against Sanity"
```

---

## Task 20: Drop category routes + add redirects

**Files:**
- Delete: `src/app/(marketing)/blog/category/`
- Modify: `next.config.ts`

- [ ] **Step 1: Delete category route tree**

```bash
git rm -r "src/app/(marketing)/blog/category"
```

- [ ] **Step 2: Add redirects to `next.config.ts`**

Replace the existing `redirects()` function in `next.config.ts` with:

```typescript
  async redirects() {
    // Post-migration: categories were merged into tags. Redirect old URLs.
    return [
      {
        source: "/blog/category/:category",
        destination: "/blog/tag/:category",
        permanent: true,
      },
    ];
  },
```

The redirect target slug matches because the migration script slugifies MDX category names with the same algorithm used for tag slugs, so `actual-play` category → `actual-play` tag.

- [ ] **Step 3: Typecheck** — `pnpm tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)/blog/category" next.config.ts
git commit -m "feat(blog): drop category archive; redirect old URLs to tag"
```

---

## Task 21: Rewrite RSS feed

**Files:**
- Modify: `src/app/feed.xml/route.ts`

- [ ] **Step 1: Rewrite**

```typescript
import { getAllPosts } from "@/sanity/queries";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
  const posts = await getAllPosts();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteConfig.url}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteConfig.url}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.tags.map((t) => `<category>${t.name}</category>`).join("\n      ")}
    </item>`,
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name} Blog</title>
    <link>${siteConfig.url}/blog</link>
    <description>${siteConfig.description}</description>
    <language>en</language>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

- [ ] **Step 2: Smoke test**

Start `pnpm dev`. Visit `http://localhost:3000/feed.xml`. Expected: valid RSS XML containing 8 `<item>` entries, each with a `<category>` per tag.

- [ ] **Step 3: Commit**

```bash
git add src/app/feed.xml/route.ts
git commit -m "feat(blog): switch RSS feed to Sanity"
```

---

## Task 22: Update sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Rewrite**

```typescript
import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/sanity/queries";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${siteConfig.url}/blog/tag/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/store`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...blogEntries,
    ...tagEntries,
  ];
}
```

- [ ] **Step 2: Smoke test**

`http://localhost:3000/sitemap.xml` should return valid XML including all blog post URLs + tag archive URLs.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(blog): source sitemap entries from Sanity"
```

---

## Task 23: End-to-end smoke test

**Files:** None modified.

- [ ] **Step 1: Run dev**

```bash
pnpm dev
```

- [ ] **Step 2: Walk the site**

1. `http://localhost:3000/blog` — listing shows 8 posts as cards; tag chips above grid; no 500 errors in the dev console.
2. Click one post → `/blog/<slug>` renders Portable Text body, reading-time label, Patreon CTA footer block.
3. If any imported post had code blocks originally, verify syntax highlighting appears.
4. Click a tag chip → `/blog/tag/<slug>` shows filtered posts.
5. `/blog/category/actual-play` (one of the old category URLs) — should 301-redirect to `/blog/tag/actual-play`.
6. `/feed.xml` returns RSS with 8 items.
7. `/sitemap.xml` returns XML including blog + tag URLs.

**If any step fails:** stop, investigate, fix before proceeding. Do NOT delete source MDX in Task 24 until everything works end-to-end.

- [ ] **Step 3: (No commit)** — verification task.

---

## Task 24: Delete MDX source + library

**Files:**
- Delete: `src/lib/blog.ts`
- Delete: `content/blog/`

- [ ] **Step 1: Delete**

```bash
git rm src/lib/blog.ts
git rm -r content/blog
rmdir content 2>/dev/null  # remove parent if empty, ignore error otherwise
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: clean. If any file still imports from `@/lib/blog`, the typecheck will point it out — fix before committing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/blog.ts content
git commit -m "refactor(blog): retire MDX source + lib/blog helpers"
```

---

## Task 25: Uninstall MDX-era dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Remove runtime deps no longer used**

```bash
pnpm remove next-mdx-remote gray-matter reading-time
```

- [ ] **Step 2: Keep dev deps needed only by import script**

`marked`, `jsdom`, `@types/jsdom`, `tsx` stay — the script is still in the repo for re-imports if needed.

- [ ] **Step 3: Final typecheck + smoke test**

```bash
pnpm tsc --noEmit
pnpm dev
# visit /blog once more
```

No errors; page still renders.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove next-mdx-remote, gray-matter, reading-time"
```

---

## Definition of Done (Phase 2)

Phase 2 is complete when all of these are true:

1. `pnpm tsc --noEmit` is clean.
2. `pnpm dev` starts with no compile errors; `/blog`, `/blog/[slug]`, `/blog/tag/[slug]` all render from Sanity data.
3. All 8 original posts exist in Sanity (verified in Studio) with correct titles, slugs, tags, author, and Portable Text body.
4. `/feed.xml` returns valid RSS backed by Sanity.
5. `/sitemap.xml` lists blog + tag URLs backed by Sanity.
6. `/blog/category/:whatever` 301-redirects to the corresponding tag URL.
7. `src/lib/blog.ts` and `content/blog/` no longer exist.
8. `next-mdx-remote`, `gray-matter`, `reading-time` no longer in `package.json` dependencies.
9. The landing page, shop, tools, and about pages are **unaffected** by Phase 2 work (smoke-check `/`, `/store`, `/tools`, `/about` still load).

---

## Self-review notes

**Spec coverage:**
- §5 layout (hero strip, featured card, tag chips, grid, no pagination) — Task 16 ✓
- §5 detail layout (cover, title, meta, Portable Text, footer CTA, related posts) — Tasks 17 + 18 ✓
- §5 Portable Text custom blocks (image, code, callout, patreonCta) — Tasks 6–9 (note: no explicit "callout" block type exists in the `post` schema; deferred until a post actually needs one)
- §5 rendering strategy (RSC + `generateStaticParams` + tag cache + `generateMetadata`) — Tasks 16, 17, 19 ✓
- §5 schemas — already in place from Phase 1, used by Tasks 11–12 ✓
- §5 reading time computed from Portable Text — Task 5 ✓
- §5 feed.xml, sitemap.ts, json-ld — Tasks 21, 22; json-ld is already invariant via `@/components/json-ld` (no changes needed)
- §8 MDX → Sanity import script — Tasks 10–13 ✓

**Placeholder scan:** No TBDs, no "implement later" stubs, all code blocks are concrete.

**Type consistency:**
- `PostCard` and `PostDetail` defined in Task 3; used consistently in Tasks 14 (BlogCard), 16 (/blog), 17 (/blog/[slug]), 18 (BlogPostContent), 19 (tag archive).
- `TagRef` defined in Task 3; consumed in Tasks 14, 15, 18, 19.
- `readingTimeLabel(body)` signature in Task 5 matches every call site in Tasks 16, 17, 19.

**Non-goals explicitly deferred:**
- Rich `callout` Portable Text block type — not yet added to the `post` schema; will add in a future content-polish pass if editors want it.
- Per-post reading-time computed in GROQ (performance optimization) — acceptable at 8 posts; revisit if catalog grows.
- Draft preview mode in Studio — out of scope; add when an editor actually needs it.

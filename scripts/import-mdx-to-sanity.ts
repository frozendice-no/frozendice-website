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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

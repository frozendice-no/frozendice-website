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
import { htmlToBlocks } from "@sanity/block-tools";
import { Schema } from "@sanity/schema";
import { marked } from "marked";
import { JSDOM } from "jsdom";

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

const blockContentSchema = Schema.compile({
  name: "postBody",
  types: [
    {
      type: "object",
      name: "code",
      fields: [{ name: "code", type: "string" }, { name: "language", type: "string" }],
    },
    {
      type: "object",
      name: "patreonCta",
      fields: [{ name: "text", type: "string" }],
    },
    {
      type: "array",
      name: "body",
      of: [{ type: "block" }, { type: "image" }, { type: "code" }, { type: "patreonCta" }],
    },
  ],
}).get("body");

async function markdownToPortableText(markdown: string): Promise<unknown[]> {
  const html = await marked.parse(markdown);
  return htmlToBlocks(html, blockContentSchema, {
    parseHtml: (rawHtml) => new JSDOM(rawHtml).window.document,
  });
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

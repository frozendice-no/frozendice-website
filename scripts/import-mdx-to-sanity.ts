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

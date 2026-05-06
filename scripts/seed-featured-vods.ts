#!/usr/bin/env -S pnpm tsx
/**
 * One-shot: seed the featuredVods singleton with the initial set of 3
 * regular videos + 2 Shorts. Re-running overwrites the document, so
 * after the first run prefer editing via Studio.
 *
 * Run via:
 *   set -a && source .env.local && set +a && pnpm tsx scripts/seed-featured-vods.ts
 */
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing env vars");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const vods = [
  { youtubeVideoId: "afgfmHpuA4A", isShort: false },
  { youtubeVideoId: "YU5H6kV4KxE", isShort: false },
  { youtubeVideoId: "HY170i6JhpM", isShort: false },
  { youtubeVideoId: "txxi6m3CkjU", isShort: true },
  { youtubeVideoId: "yvXZ3jVQAk4", isShort: true },
].map((v, i) => ({
  _type: "vod",
  _key: `vod-${i + 1}`,
  ...v,
}));

const doc = {
  _id: "featuredVods",
  _type: "featuredVods",
  vods,
};

async function main() {
  const result = await client.createOrReplace(doc);
  console.log("Wrote:", result._id, "vods:", vods.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

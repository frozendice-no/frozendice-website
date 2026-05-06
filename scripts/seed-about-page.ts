#!/usr/bin/env -S pnpm tsx
/**
 * One-shot: seed (or replace) the aboutPage singleton with a starter draft
 * grounded in the actual Frozen Dice channel: Nordgaard homebrew world,
 * biweekly livestreams, weekly Shorts + Dad Jokes + sketches.
 *
 * Run via:
 *   set -a && source .env.local && set +a && pnpm tsx scripts/seed-about-page.ts
 *
 * Re-running overwrites the document. After the first run, prefer editing
 * via Studio. Cast members and the campaign feature are NOT seeded here —
 * those need real portrait/cover images uploaded via Studio anyway.
 */
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing env: need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

let blockKeyCounter = 0;
function block(text: string) {
  blockKeyCounter += 1;
  return {
    _type: "block",
    _key: `block-${blockKeyCounter}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `span-${blockKeyCounter}`,
        text,
        marks: [],
      },
    ],
  };
}

const storyBody = [
  block(
    "Frozen Dice started as a group of friends who couldn't stop talking about Dungeons & Dragons. The kitchen-table sessions turned into a homebrew world, the homebrew world turned into a recurring podcast, and somewhere along the way the camera came on and stayed on.",
  ),
  block(
    "Today we stream biweekly out of Norway, telling stories set in our own continent of Nordgaard — a cold, lore-thick fantasy world shaped by Norse mythology, frostbitten coastlines, and the long winter dark. Between sessions we ship weekly Shorts, dad jokes, and small sketches that keep the lights on between chapters.",
  ),
  block(
    "We're not professional actors. We're nerds who love this game, and we record what would otherwise just be us laughing around a table on a Tuesday night. The audience gets to come along.",
  ),
];

const values = [
  {
    _type: "value",
    _key: "value-1",
    icon: "snowflake",
    title: "Nordic soul",
    description:
      "Our homebrew world Nordgaard pulls from Norse mythology, cold landscapes, and the long dark. The setting matters as much as the dice.",
  },
  {
    _type: "value",
    _key: "value-2",
    icon: "dice-5",
    title: "Story over rules",
    description:
      "A dramatic failure beats a safe success. We optimise for the moment, not the math — that's where the saga lives.",
  },
  {
    _type: "value",
    _key: "value-3",
    icon: "calendar",
    title: "Show up every other week",
    description:
      "Biweekly livestreams, weekly Shorts, weekly Dad Jokes. Consistency is how a campaign turns into a saga worth following.",
  },
  {
    _type: "value",
    _key: "value-4",
    icon: "users",
    title: "Friends first",
    description:
      "We started as friends rolling dice on a kitchen table in Norway. We're still that — the camera just happens to be on.",
  },
];

const doc = {
  _id: "aboutPage",
  _type: "aboutPage",
  eyebrow: "About",
  headline: "The story behind Frozen Dice.",
  intro:
    "A Norwegian D&D crew streaming biweekly from our homebrew world of Nordgaard — plus weekly Shorts, dad jokes, and the occasional sketch.",
  storyBody,
  values,
  businessEmail: "hello@frozendice.no",
};

async function main() {
  const result = await client.createOrReplace(doc);
  console.log("Wrote:", result._id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

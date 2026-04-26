# Phase 4: Landing Page Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current placeholder landing page (`src/app/(marketing)/page.tsx`) with a four-section branded experience: (1) a 121-frame scroll-scrubbed canvas dice animation with three narrative copy beats; (2) a dealt-card Patreon reveal section; (3) a live-stream / VOD section with a YouTube embed, LIVE pill, schedule strip, and VOD grid; (4) a featured products 3-up grid sourced from the Sanity catalog wired up in Phase 3. This phase also delivers the one-shot hero-frame optimization script and a minor env-var documentation update.

**Architecture:** The landing page is a Next.js RSC page composed of a mix of Server Components (Patreon section reading `patreonPerks`, streams section reading `streamSchedule` + `featuredVods`, featured products reading `getFeaturedProducts`) and Client Components (canvas animation, LIVE pill, VOD lightbox). Framer-motion v12 drives all scroll-linked animations via `useScroll` + `useTransform` + `useMotionValueEvent`. CSS sticky pinning (`h-[500vh]` + `sticky top-0`) handles scroll pinning without JS. Hero frames are served as pre-optimized WebP sets from `public/images/hero/`.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript, framer-motion v12, sharp (dev dep, already listed in `pnpm.onlyBuiltDependencies`), Sanity v5 + `next-sanity`, Tailwind v4, shadcn/ui.

**⚠️ Next.js 16 note:** This version has breaking changes from prior majors. Before touching route handlers, server actions, `generateMetadata`, or async component APIs, consult `node_modules/next/dist/docs/` — don't rely on pre-16 knowledge.

---

## Spec reference

This plan implements spec section 3 (Landing page) end-to-end, plus the hero-frame portion of section 8 (Asset pipeline). Source: [`docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md`](../specs/2026-04-19-frozendice-redesign-design.md).

**Out of scope** (deferred to later plans):
- About page rewrite (Phase 5)
- Phase 6 cleanup (removing Neon/Drizzle, `NewsletterSignup`, `subscribe` action)
- Analytics integration into the hero animation (GTM stays separate)
- Newsletter capture (spec explicitly defers this)
- Paid membership infrastructure (Patreon handles it externally)

## Key decisions locked in the spec

- **Canvas + sticky CSS, not GSAP.** Framer-motion is already installed; sticky-CSS pinning (`h-[500vh]` wrapper + `sticky top-0` inner) avoids GSAP's pinning ergonomics and saves ~40 KB. No JS-controlled pinning.
- **Two WebP asset sets, picked at mount.** `window.matchMedia('(min-width: 768px)')` selects desktop (1280px) or mobile (640px) on the client. The canvas redraws on `window.resize` with a "contain" fit to keep the die centered at any viewport. Both sets are preloaded via `new Image()` before the first draw.
- **`prefers-reduced-motion` → static frame 60.** This is an explicit user accessibility preference, not a device-capability guess. The animation runs on mobile by default; only the OS accessibility flag suppresses it.
- **Mobile frame-snapping is a deferred real-device decision.** If the 121-frame scrub stutters visibly on a mid-range Android (Pixel 6a or equivalent) with the 640px mobile set, the implementer switches to drawing every 2nd frame on mobile (60 unique frames, 121 scroll positions). The canvas draw cadence changes; the design does not. Decide during QA, not here.
- **YouTube live-status is polled, not realtime.** `/api/youtube/live-status` uses `search.list?eventType=live&channelId=<id>&type=video` (100 units/call). With `revalidate: 60` seconds and one call per deploy context per minute, we stay well under the 10k daily quota.
- **VOD lightbox is a simple Client Component.** No external lightbox library — a portaled `<dialog>` with a YouTube iframe inside is sufficient and avoids a bundle dep.
- **Featured products reuse Phase 3's `getFeaturedProducts()` + `ProductCard` verbatim.** No new query or component shape is introduced.
- **`patreonPerks` singleton already exists in Sanity (from Phase 1).** Phase 4 adds only the TypeScript type and GROQ query to read it; no schema changes.
- **`streamSchedule` and `featuredVods` singletons already exist (from Phase 1).** Same: new queries only.

---

## File structure

### Created

```
scripts/
  optimize-hero-frames.ts                    # Sharp-based one-shot WebP conversion
public/images/hero/
  desktop/                                   # 1.webp … 121.webp at 1280px
  mobile/                                    # 1.webp … 121.webp at 640px
src/components/landing/
  hero-canvas.tsx                            # Client component: scroll-scrubbed canvas
  hero-copy-overlay.tsx                      # Client component: per-beat fade copy + CTAs
  patreon-section.tsx                        # Server component shell + Client card deck
  patreon-card-deck.tsx                      # Client component: dealt-card animation
  streams-section.tsx                        # Server component shell
  youtube-player.tsx                         # Client component: iframe embed + LIVE pill
  vod-grid.tsx                               # Client component: 6-up grid + lightbox
  featured-products-section.tsx              # Server component: 3-up product grid
src/app/api/youtube/
  live-status/route.ts                       # Route handler: YouTube Data API v3 poll
```

### Modified

```
src/sanity/types.ts                          # Add PatreonPerks, StreamSchedule, FeaturedVods types
src/sanity/queries.ts                        # Add getPatreonPerks, getStreamSchedule, getFeaturedVods
src/app/(marketing)/page.tsx                 # Replace stub with composed landing sections
.env.example                                 # Uncomment + document YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID
package.json                                 # Add sharp as devDependency
```

### Noted (not deleted in this phase)

```
public/images/hero/desktop/   # committed output — do NOT delete
public/images/hero/mobile/    # committed output — do NOT delete
frozendice_dice/              # add to .gitignore after verifying output; keep locally
```

---

## Task 1: Add `sharp` as a dev dependency

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

`sharp` is already referenced in `pnpm.onlyBuiltDependencies` but is not yet listed as a dependency. Add it as a dev dependency for the one-shot optimization script.

- [ ] **Step 1:** Install

```bash
pnpm add -D sharp @types/node
```

(`@types/node` is already a devDep but `pnpm add -D` is idempotent.)

- [ ] **Step 2:** Verify

```bash
node -e "require('sharp'); console.log('sharp ok')"
```

Expected: `sharp ok`.

- [ ] **Step 3:** Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add sharp devDependency for hero-frame pipeline"
```

---

## Task 2: Write hero-frame optimization script

**Files:**
- Create: `scripts/optimize-hero-frames.ts`

- [ ] **Step 1:** Create with this exact content:

```typescript
#!/usr/bin/env -S pnpm tsx
/**
 * One-shot hero-frame pipeline.
 *
 * Converts frozendice_dice/ezgif-frame-NNN.jpg (121 frames, 1-indexed) into:
 *   public/images/hero/desktop/N.webp  — 1280px wide, quality 80
 *   public/images/hero/mobile/N.webp   — 640px wide,  quality 75
 *
 * Usage:
 *   pnpm tsx scripts/optimize-hero-frames.ts
 *
 * Run once. Commit the output. After verifying, add frozendice_dice/ to .gitignore.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "frozendice_dice");
const DEST_DESKTOP = path.join(process.cwd(), "public/images/hero/desktop");
const DEST_MOBILE = path.join(process.cwd(), "public/images/hero/mobile");
const TOTAL_FRAMES = 121;

const DESKTOP_WIDTH = 1280;
const DESKTOP_QUALITY = 80;
const MOBILE_WIDTH = 640;
const MOBILE_QUALITY = 75;

function srcPath(n: number): string {
  const padded = String(n).padStart(3, "0");
  return path.join(SRC_DIR, `ezgif-frame-${padded}.jpg`);
}

async function processFrame(n: number): Promise<void> {
  const src = srcPath(n);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source frame: ${src}`);
  }

  await sharp(src)
    .resize({ width: DESKTOP_WIDTH, withoutEnlargement: true })
    .webp({ quality: DESKTOP_QUALITY })
    .toFile(path.join(DEST_DESKTOP, `${n}.webp`));

  await sharp(src)
    .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
    .webp({ quality: MOBILE_QUALITY })
    .toFile(path.join(DEST_MOBILE, `${n}.webp`));
}

async function main(): Promise<void> {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DESKTOP, { recursive: true });
  fs.mkdirSync(DEST_MOBILE, { recursive: true });

  console.log(`Processing ${TOTAL_FRAMES} frames...`);
  const start = Date.now();

  for (let n = 1; n <= TOTAL_FRAMES; n++) {
    await processFrame(n);
    if (n % 20 === 0 || n === TOTAL_FRAMES) {
      process.stdout.write(`  ${n}/${TOTAL_FRAMES}\n`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s.`);
  console.log(`Desktop: ${DEST_DESKTOP}`);
  console.log(`Mobile:  ${DEST_MOBILE}`);
  console.log(`Next: inspect a few output files, then commit public/images/hero/.`);
  console.log(`After commit: add frozendice_dice/ to .gitignore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

If `scripts/` is not excluded from `tsconfig.json`, the `sharp` import may cause DOM-lib conflicts. In that case, confirm that `tsconfig.json` has `"exclude": ["scripts"]` or that the scripts folder has its own `tsconfig.scripts.json`. Do not modify the main `tsconfig.json`; instead use `pnpm tsx` which bypasses the main tsc project.

- [ ] **Step 3:** Commit the script (output not yet generated — that's Task 3)

```bash
git add scripts/optimize-hero-frames.ts
git commit -m "feat(assets): add hero-frame WebP optimization script"
```

---

## Task 3: Run the pipeline and commit output

**Files:**
- Create: `public/images/hero/desktop/1.webp` … `121.webp`
- Create: `public/images/hero/mobile/1.webp` … `121.webp`

- [ ] **Step 1:** Run

```bash
pnpm tsx scripts/optimize-hero-frames.ts
```

Expected: `Done in N.Ns.` with no errors. The `public/images/hero/desktop/` and `public/images/hero/mobile/` directories each contain 121 `.webp` files named `1.webp` through `121.webp`.

- [ ] **Step 2:** Spot-check sizes

```bash
ls -lh public/images/hero/desktop/60.webp public/images/hero/mobile/60.webp
```

Expected: desktop ~15–30 KB, mobile ~5–15 KB. If frames are significantly over the target (~25 KB desktop / ~10 KB mobile), lower `DESKTOP_QUALITY` to 72 and `MOBILE_QUALITY` to 68 in the script and re-run. Recheck. Document the final quality values you used in a comment at the top of the script, then recommit.

- [ ] **Step 3:** Commit the generated frames

```bash
git add public/images/hero/
git commit -m "chore(assets): add optimized hero WebP frames (desktop 1280px, mobile 640px)"
```

---

## Task 4: Update `.gitignore` and `.env.example`

**Files:**
- Modify: `.gitignore`
- Modify: `.env.example`

- [ ] **Step 1:** Add `frozendice_dice/` to `.gitignore`. Append at the end of the file:

```
# Hero frame source images (keep locally; optimized WebPs are in public/images/hero/)
frozendice_dice/
```

- [ ] **Step 2:** In `.env.example`, replace the commented-out YouTube section:

```bash
# --- YouTube (added in Phase 4) ---
# YOUTUBE_API_KEY=""
# YOUTUBE_CHANNEL_ID=""
```

with:

```bash
# --- YouTube Data API v3 (added in Phase 4) ---
# Used for LIVE pill: GET /api/youtube/live-status polls search.list?eventType=live
# Create a key at https://console.developers.google.com/ with YouTube Data API v3 enabled.
# Channel ID is the UCxxxxxxxx... string from the YouTube Studio URL.
YOUTUBE_API_KEY=""
YOUTUBE_CHANNEL_ID=""
```

- [ ] **Step 3:** Typecheck (no TS in this task; just run to confirm no prior breakage)

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4:** Commit

```bash
git add .gitignore .env.example
git commit -m "chore: gitignore hero source frames; document YouTube env vars"
```

---

## Task 5: Add landing-page Sanity types

**Files:**
- Modify: `src/sanity/types.ts`

- [ ] **Step 1:** Append the following types to the end of `src/sanity/types.ts` (keep all existing types intact):

```typescript
// --- Patreon perks singleton ---

export type PerkCard = {
  _key: string;
  image: SanityImage;
  label: string;
  blurb: string;
};

export type TierSummary = {
  _key: string;
  name: string;
  price?: string;
  summary: string;
};

export type PatreonPerks = {
  eyebrow?: string;
  headline: string;
  body: string;
  patreonUrl: string;
  cards: PerkCard[];
  tiers?: TierSummary[];
};

// --- Stream schedule singleton ---

export type UpcomingSession = {
  _key: string;
  title: string;
  scheduledAt: string;
  description?: string;
};

export type StreamSchedule = {
  youtubeChannelId: string;
  upcoming?: UpcomingSession[];
};

// --- Featured VODs singleton ---

export type Vod = {
  _key: string;
  youtubeVideoId: string;
  title?: string;
};

export type FeaturedVods = {
  vods: Vod[];
};
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/sanity/types.ts
git commit -m "feat(sanity): add PatreonPerks, StreamSchedule, FeaturedVods types"
```

---

## Task 6: Add landing-page Sanity queries

**Files:**
- Modify: `src/sanity/queries.ts`

- [ ] **Step 1:** Replace the existing import line at the top of `src/sanity/queries.ts` with:

```typescript
import { client } from "./client";
import type {
  FeaturedVods,
  PatreonPerks,
  PostCard,
  PostDetail,
  StreamSchedule,
  TagRef,
} from "./types";
```

(The `ProductCard` and `ProductDetail` imports were added by Phase 3. Add `FeaturedVods`, `PatreonPerks`, `StreamSchedule` to that same import statement. If Phase 3 has not yet run, the Phase 3 import lines won't be there — just add the three new ones alongside the existing types.)

- [ ] **Step 2:** Append the following to the end of `src/sanity/queries.ts`:

```typescript
// ---------------------------------------------------------------------------
// Phase 4: Landing-page singleton queries
// ---------------------------------------------------------------------------

export async function getPatreonPerks(): Promise<PatreonPerks | null> {
  return client.fetch(
    `*[_type == "patreonPerks"][0] {
      eyebrow,
      headline,
      body,
      patreonUrl,
      "cards": cards[] {
        _key,
        image { ..., "alt": coalesce(alt, "") },
        label,
        blurb
      },
      "tiers": tiers[] {
        _key,
        name,
        price,
        summary
      }
    }`,
    {},
    { next: { tags: ["patreonPerks"] } },
  );
}

export async function getStreamSchedule(): Promise<StreamSchedule | null> {
  return client.fetch(
    `*[_type == "streamSchedule"][0] {
      youtubeChannelId,
      "upcoming": upcoming[] {
        _key,
        title,
        scheduledAt,
        description
      }
    }`,
    {},
    { next: { tags: ["streamSchedule"] } },
  );
}

export async function getFeaturedVods(): Promise<FeaturedVods | null> {
  return client.fetch(
    `*[_type == "featuredVods"][0] {
      "vods": vods[] {
        _key,
        youtubeVideoId,
        title
      }
    }`,
    {},
    { next: { tags: ["featuredVods"] } },
  );
}
```

Note: `getFeaturedProducts()` (used in Task 22) was already added by Phase 3. If Phase 3 has not run yet, copy-paste it from the Phase 3 plan (Task 5) before continuing.

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add src/sanity/queries.ts
git commit -m "feat(sanity): add getPatreonPerks, getStreamSchedule, getFeaturedVods queries"
```

---

## Task 7: YouTube live-status route handler

**Files:**
- Create: `src/app/api/youtube/live-status/route.ts`

- [ ] **Step 1:** Create the directory and file:

```typescript
import { NextResponse } from "next/server";

// Revalidate cached response every 60 seconds.
// 100 units/call × 1440 calls/day = 144 000 units/day worst-case —
// but Next.js serves the cached response for all requests within the window,
// so at steady state it is ~1 440 API calls per day against the 10 000-unit quota.
export const revalidate = 60;

type YouTubeSearchResponse = {
  items?: unknown[];
  error?: { message: string };
};

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    // Missing env: return not-live rather than 500 so the LIVE pill just stays hidden.
    return NextResponse.json({ isLive: false, error: "env_missing" });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "id");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  let data: YouTubeSearchResponse;
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    data = (await res.json()) as YouTubeSearchResponse;
  } catch {
    return NextResponse.json({ isLive: false, error: "fetch_failed" });
  }

  if (data.error) {
    console.error("YouTube live-status API error:", data.error.message);
    return NextResponse.json({ isLive: false, error: "api_error" });
  }

  const isLive = Array.isArray(data.items) && data.items.length > 0;
  return NextResponse.json({ isLive });
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/app/api/youtube/live-status/route.ts
git commit -m "feat(streams): add /api/youtube/live-status route handler"
```

---

## Task 8: Hero canvas Client Component

**Files:**
- Create: `src/components/landing/hero-canvas.tsx`

- [ ] **Step 1:** Create:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, useScroll, useTransform } from "framer-motion";

const TOTAL_FRAMES = 121;

function getAssetSet(): "desktop" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
}

function frameUrl(set: "desktop" | "mobile", n: number): string {
  return `/images/hero/${set}/${n}.webp`;
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef(false);
  const currentFrameRef = useRef(1);

  // Scroll progress is relative to the sticky wrapper in the parent.
  const { scrollYProgress } = useScroll();
  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [1, TOTAL_FRAMES],
  );

  function drawFrame(n: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[n - 1];
    if (!img || !img.complete) return;

    const { width: cw, height: ch } = canvas;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrameRef.current);
  }

  useEffect(() => {
    // Respect prefers-reduced-motion: skip animation load entirely.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const set = getAssetSet();

    const images: HTMLImageElement[] = [];
    let loaded = 0;

    function onLoad() {
      loaded++;
      if (loaded === 1) {
        // Draw first frame as soon as frame 1 is ready.
        resizeCanvas();
        loadedRef.current = true;
      }
    }

    const startFrame = prefersReduced ? 60 : 1;
    const endFrame = prefersReduced ? 60 : TOTAL_FRAMES;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = frameUrl(set, i);
      if (i >= startFrame && i <= endFrame) {
        img.onload = onLoad;
      }
      images.push(img);
    }

    imagesRef.current = images;
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(frameIndex, "change", (latest) => {
    const n = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(latest)));
    if (n === currentFrameRef.current) return;
    currentFrameRef.current = n;
    drawFrame(n);
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-contain"
    />
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/hero-canvas.tsx
git commit -m "feat(landing): add HeroCanvas scroll-scrubbed animation component"
```

---

## Task 9: Hero copy overlay Client Component

**Files:**
- Create: `src/components/landing/hero-copy-overlay.tsx`

This component renders three narrative copy beats that fade in and out as scroll progress crosses the 0–33% / 33–66% / 66–100% thresholds. It is a Client Component because it reads scroll state.

- [ ] **Step 1:** Create:

```tsx
"use client";

import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Beat = {
  id: string;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  content: React.ReactNode;
};

function BeatOverlay({
  beat,
  scrollYProgress,
}: {
  beat: Beat;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(
    scrollYProgress,
    [beat.inStart, beat.inEnd, beat.outStart, beat.outEnd],
    [0, 1, 1, 0],
  );

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center justify-center px-4"
    >
      {beat.content}
    </motion.div>
  );
}

export function HeroCopyOverlay() {
  const { scrollYProgress } = useScroll();

  const beats: Beat[] = [
    {
      id: "beat-1",
      inStart: 0,
      inEnd: 0.05,
      outStart: 0.28,
      outEnd: 0.33,
      content: (
        <div className="text-center text-white drop-shadow-lg">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">FrozenDice</h1>
          <p className="mt-4 text-xl font-medium sm:text-2xl">Cold dice. Hot stories.</p>
        </div>
      ),
    },
    {
      id: "beat-2",
      inStart: 0.33,
      inEnd: 0.38,
      outStart: 0.61,
      outEnd: 0.66,
      content: (
        <div className="text-center text-white drop-shadow-lg">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Live D&amp;D from the frozen north.
          </h2>
          <p className="mt-4 text-lg sm:text-xl">
            Original campaigns. Nordic lore. Streamed weekly on YouTube.
          </p>
        </div>
      ),
    },
    {
      id: "beat-3",
      inStart: 0.66,
      inEnd: 0.71,
      outStart: 0.95,
      outEnd: 1.0,
      content: (
        <div className="flex flex-col items-center gap-6 text-center text-white drop-shadow-lg">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Join the saga.</h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="https://www.patreon.com/c/FrozenDice"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#FF424D] hover:bg-[#e63a45] text-white border-0",
              )}
            >
              Become a Patron
            </Link>
            <Link
              href={`https://www.youtube.com/channel/${process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Watch Live
            </Link>
            <Link
              href="/store"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Shop
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {beats.map((beat) => (
        <BeatOverlay key={beat.id} beat={beat} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
```

**Note on the Watch Live link:** The "Watch Live" CTA constructs the YouTube channel URL from `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`. This must be added to `.env.example` and exposed as a `NEXT_PUBLIC_` var. Update `.env.example` in the next step of this task (or use a hardcoded placeholder URL until the channel ID is known — the controller can finalize).

- [ ] **Step 2:** Add `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` to `.env.example`. Append after the existing `YOUTUBE_CHANNEL_ID` line:

```bash
# Public version of YOUTUBE_CHANNEL_ID — used in the "Watch Live" CTA href.
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=""
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add src/components/landing/hero-copy-overlay.tsx .env.example
git commit -m "feat(landing): add HeroCopyOverlay three-beat scroll-linked copy"
```

---

## Task 10: Patreon card-deck Client Component

**Files:**
- Create: `src/components/landing/patreon-card-deck.tsx`

The dealt-card reveal: each card flies in from offscreen with a unique rotation and translation mapped to a scroll range. Cards stack/fan like cards dealt onto a table.

- [ ] **Step 1:** Create:

```tsx
"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { urlForImage } from "@/sanity/image";
import type { PerkCard } from "@/sanity/types";

// Each card occupies a distinct scroll sub-range so they arrive sequentially.
const CARD_SCROLL_RANGES: [number, number][] = [
  [0.0, 0.2],
  [0.2, 0.4],
  [0.4, 0.6],
  [0.6, 0.8],
  [0.8, 1.0],
];

// Resting transforms: slight fan / overlap as cards settle.
const CARD_RESTING: { rotate: number; x: number; y: number }[] = [
  { rotate: -6, x: -20, y: 10 },
  { rotate: -3, x: -10, y: 5 },
  { rotate:  0, x:   0, y: 0 },
  { rotate:  3, x:  10, y: 5 },
  { rotate:  6, x:  20, y: 10 },
];

function AnimatedCard({
  card,
  index,
  scrollYProgress,
}: {
  card: PerkCard;
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const range = CARD_SCROLL_RANGES[index] ?? [0, 1];
  const resting = CARD_RESTING[index] ?? { rotate: 0, x: 0, y: 0 };

  const opacity = useTransform(scrollYProgress, [range[0], range[0] + 0.1], [0, 1]);
  const x = useTransform(scrollYProgress, [range[0], range[1]], [120, resting.x]);
  const y = useTransform(scrollYProgress, [range[0], range[1]], [-60, resting.y]);
  const rotate = useTransform(scrollYProgress, [range[0], range[1]], [15, resting.rotate]);

  const imageUrl = urlForImage(card.image).width(480).height(340).auto("format").url();

  return (
    <motion.div
      style={{ opacity, x, y, rotate, zIndex: index }}
      className="absolute w-[280px] overflow-hidden rounded-xl border bg-card shadow-xl sm:w-[320px]"
    >
      <Image
        src={imageUrl}
        alt={card.image.alt ?? card.label}
        width={480}
        height={340}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {card.label}
        </p>
        <p className="mt-1 text-sm">{card.blurb}</p>
      </div>
    </motion.div>
  );
}

export function PatreonCardDeck({
  cards,
  containerRef,
}: {
  cards: PerkCard[];
  containerRef: React.RefObject<HTMLElement>;
}) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <div className="relative flex h-[480px] items-center justify-center sm:h-[520px]">
      {cards.slice(0, 5).map((card, i) => (
        <AnimatedCard
          key={card._key}
          card={card}
          index={i}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/patreon-card-deck.tsx
git commit -m "feat(landing): add PatreonCardDeck dealt-card scroll animation"
```

---

## Task 11: Patreon section Server Component

**Files:**
- Create: `src/components/landing/patreon-section.tsx`

This is a Server Component that fetches `patreonPerks` from Sanity and passes the card data to the Client Component card deck.

- [ ] **Step 1:** Create:

```tsx
import { useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatreonCardDeck } from "./patreon-card-deck";
import type { PatreonPerks } from "@/sanity/types";

// PatreonSectionInner is a Client Component so it can hold the ref for the
// card-deck scroll target. The outer PatreonSection is a Server Component.
import { PatreonSectionInner } from "./patreon-section-inner";

export function PatreonSection({ perks }: { perks: PatreonPerks | null }) {
  if (!perks) {
    // Sanity document not yet published — render a graceful placeholder.
    return null;
  }

  return <PatreonSectionInner perks={perks} />;
}
```

- [ ] **Step 2:** Create the companion Client Component `src/components/landing/patreon-section-inner.tsx`:

```tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatreonCardDeck } from "./patreon-card-deck";
import type { PatreonPerks } from "@/sanity/types";

export function PatreonSectionInner({ perks }: { perks: PatreonPerks }) {
  const sectionRef = useRef<HTMLElement>(null!);

  return (
    <section
      ref={sectionRef}
      className="bg-muted/20 py-24 sm:py-32"
      aria-label="Patreon membership"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          {/* Left: sticky copy */}
          <div className="lg:sticky lg:top-24">
            {perks.eyebrow && (
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
                {perks.eyebrow}
              </p>
            )}
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {perks.headline}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">{perks.body}</p>
            <div className="mt-8">
              <Link
                href={perks.patreonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-[#FF424D] hover:bg-[#e63a45] text-white border-0",
                )}
              >
                Become a Patron →
              </Link>
            </div>

            {/* Optional tier summary */}
            {perks.tiers && perks.tiers.length > 0 && (
              <div className="mt-12 space-y-4">
                {perks.tiers.map((tier) => (
                  <div
                    key={tier._key}
                    className="rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{tier.name}</span>
                      {tier.price && (
                        <span className="text-sm text-muted-foreground">{tier.price}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: animated card deck */}
          <PatreonCardDeck cards={perks.cards} containerRef={sectionRef} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add src/components/landing/patreon-section.tsx src/components/landing/patreon-section-inner.tsx
git commit -m "feat(landing): add PatreonSection with sticky copy + card-deck reveal"
```

---

## Task 12: YouTube player + LIVE pill Client Component

**Files:**
- Create: `src/components/landing/youtube-player.tsx`

The LIVE pill polls `/api/youtube/live-status` on mount with a 60-second interval. The hero player always shows `youtube.com/embed/live_stream?channel=<id>` (auto-falls back to channel's recent content when not live).

- [ ] **Step 1:** Create:

```tsx
"use client";

import { useEffect, useState } from "react";

type LiveStatus = { isLive: boolean };

function useLiveStatus(channelId: string): boolean {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!channelId) return;

    async function check() {
      try {
        const res = await fetch("/api/youtube/live-status");
        const data = (await res.json()) as LiveStatus;
        setIsLive(data.isLive);
      } catch {
        // Network error — keep current state.
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [channelId]);

  return isLive;
}

export function YouTubePlayer({ channelId }: { channelId: string }) {
  const isLive = useLiveStatus(channelId);

  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=0&rel=0`;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="aspect-video w-full">
        <iframe
          src={embedUrl}
          title="FrozenDice live stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          loading="lazy"
        />
      </div>

      {isLive && (
        <div
          aria-label="Live now"
          className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          LIVE
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/youtube-player.tsx
git commit -m "feat(landing): add YouTubePlayer with polled LIVE pill"
```

---

## Task 13: VOD grid + lightbox Client Component

**Files:**
- Create: `src/components/landing/vod-grid.tsx`

Clicking a thumbnail opens an inline `<dialog>` portal with a YouTube iframe. No external lightbox library.

- [ ] **Step 1:** Create:

```tsx
"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Vod } from "@/sanity/types";

function VodThumbnail({
  vod,
  onClick,
}: {
  vod: Vod;
  onClick: (vod: Vod) => void;
}) {
  const thumbUrl = `https://i.ytimg.com/vi/${vod.youtubeVideoId}/hqdefault.jpg`;

  return (
    <button
      type="button"
      onClick={() => onClick(vod)}
      className="group relative overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Play ${vod.title ?? vod.youtubeVideoId}`}
    >
      <Image
        src={thumbUrl}
        alt={vod.title ?? "VOD thumbnail"}
        width={480}
        height={270}
        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="rounded-full bg-white/90 p-3">
          <svg
            aria-hidden="true"
            className="h-6 w-6 translate-x-0.5 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {vod.title && (
        <p className="mt-2 text-left text-sm font-medium line-clamp-2">{vod.title}</p>
      )}
    </button>
  );
}

function VodLightbox({
  vod,
  onClose,
}: {
  vod: Vod;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      open
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 m-0 flex h-screen w-screen items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      aria-modal="true"
      aria-label={`Playing: ${vod.title ?? vod.youtubeVideoId}`}
    >
      <div className="relative w-full max-w-4xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-10 flex items-center gap-1 text-white hover:text-white/80"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
          <span className="text-sm">Close</span>
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={`https://www.youtube.com/embed/${vod.youtubeVideoId}?autoplay=1&rel=0`}
            title={vod.title ?? "VOD"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    </dialog>
  );
}

export function VodGrid({ vods }: { vods: Vod[] }) {
  const [activeVod, setActiveVod] = useState<Vod | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {vods.slice(0, 6).map((vod) => (
          <VodThumbnail key={vod._key} vod={vod} onClick={setActiveVod} />
        ))}
      </div>

      {activeVod && (
        <VodLightbox vod={activeVod} onClose={() => setActiveVod(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/vod-grid.tsx
git commit -m "feat(landing): add VodGrid with inline dialog lightbox"
```

---

## Task 14: Streams section Server Component

**Files:**
- Create: `src/components/landing/streams-section.tsx`

Server Component: fetches `streamSchedule` + `featuredVods` from Sanity (passed in as props from the page), renders the section shell and schedule strip as static markup, hands off the player and VOD grid to Client Components.

- [ ] **Step 1:** Create:

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { YouTubePlayer } from "./youtube-player";
import { VodGrid } from "./vod-grid";
import type { FeaturedVods, StreamSchedule } from "@/sanity/types";

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function StreamsSection({
  schedule,
  featuredVods,
}: {
  schedule: StreamSchedule | null;
  featuredVods: FeaturedVods | null;
}) {
  const channelId = schedule?.youtubeChannelId ?? "";

  return (
    <section className="py-24 sm:py-32" aria-label="Live streams and VODs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Live &amp; on-demand
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Watch the saga unfold.
          </h2>
        </div>

        {/* Hero player */}
        {channelId ? (
          <YouTubePlayer channelId={channelId} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
            Stream embed coming soon.
          </div>
        )}

        {/* Schedule strip */}
        {schedule?.upcoming && schedule.upcoming.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming
            </h3>
            {schedule.upcoming.map((session) => (
              <div
                key={session._key}
                className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{session.title}</p>
                  {session.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {session.description}
                    </p>
                  )}
                </div>
                <time
                  dateTime={session.scheduledAt}
                  className="shrink-0 text-sm text-muted-foreground"
                >
                  {formatScheduledAt(session.scheduledAt)}
                </time>
              </div>
            ))}
          </div>
        )}

        {/* VOD grid */}
        {featuredVods && featuredVods.vods.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-6 text-xl font-bold">Recent episodes</h3>
            <VodGrid vods={featuredVods.vods} />
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-4">
          {channelId && (
            <>
              <Link
                href={`https://www.youtube.com/channel/${channelId}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg" })}
              >
                Subscribe on YouTube →
              </Link>
              <Link
                href={`https://www.youtube.com/channel/${channelId}/videos`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                See all VODs on YouTube →
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/streams-section.tsx
git commit -m "feat(landing): add StreamsSection with schedule strip + VOD grid"
```

---

## Task 15: Featured products section Server Component

**Files:**
- Create: `src/components/landing/featured-products-section.tsx`

Renders the 3-up featured product grid with staggered `whileInView` entrance animation. Reuses `ProductCard` from Phase 3 verbatim.

- [ ] **Step 1:** Create:

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import type { ProductCard as ProductCardType } from "@/sanity/types";

export function FeaturedProductsSection({
  products,
}: {
  products: ProductCardType[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="border-t py-24 sm:py-32" aria-label="Featured products">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Shop
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Gear for your table.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Maps, campaign guides, and bundles — ready to download.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true, margin: "-60px" }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/store"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            See all products →
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Note:** This is a Client Component (`"use client"`) because it uses `motion.div` with `whileInView`. The `products` data is fetched on the server in the page and passed down as a prop, so there is no client-side data fetching.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors. If Phase 3 has not run yet and `ProductCard` / `ProductCardType` are missing, add a `TODO` comment and proceed — the typecheck will flag it as a known expected error.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/featured-products-section.tsx
git commit -m "feat(landing): add FeaturedProductsSection 3-up grid with whileInView animation"
```

---

## Task 16: Hero section wrapper (static scaffold for canvas + overlay)

**Files:**
- Create: `src/components/landing/hero-section.tsx`

The hero section is a thin Client Component that composes `HeroCanvas` and `HeroCopyOverlay` inside the sticky-CSS pinning structure. The `h-[500vh]` scroll space is created here.

- [ ] **Step 1:** Create:

```tsx
"use client";

import { HeroCanvas } from "./hero-canvas";
import { HeroCopyOverlay } from "./hero-copy-overlay";

export function HeroSection() {
  return (
    /*
     * Sticky-pinning technique (no JS pinning required):
     * - Outer wrapper is h-[500vh] — creates the scroll space.
     * - Inner div is sticky top-0, h-screen — sticks while the outer scrolls past.
     * This is fully CSS-driven; framer-motion only reads scrollYProgress, doesn't
     * control positioning.
     */
    <div className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        <HeroCanvas />
        <HeroCopyOverlay />
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/components/landing/hero-section.tsx
git commit -m "feat(landing): add HeroSection sticky-pinning scaffold"
```

---

## Task 17: Wire the reduced-motion static frame

**Files:**
- Modify: `src/components/landing/hero-canvas.tsx`

The current `HeroCanvas` already handles `prefers-reduced-motion` by preloading only frame 60 when the media query matches and skipping the `frameIndex` listener. However, we should also ensure that when `prefers-reduced-motion` is active, the `HeroCopyOverlay` does not try to scrub — it should just show beat-3 copy (the final state). This task updates `HeroSection` to pass a `reducedMotion` prop that locks the overlay to its fully-revealed end state.

- [ ] **Step 1:** Modify `src/components/landing/hero-section.tsx` to detect the preference:

Replace the file with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { HeroCanvas } from "./hero-canvas";
import { HeroCopyOverlay } from "./hero-copy-overlay";

export function HeroSection() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className={reducedMotion ? "relative" : "relative h-[500vh]"}>
      <div
        className={
          reducedMotion
            ? "relative h-screen overflow-hidden bg-black"
            : "sticky top-0 h-screen overflow-hidden bg-black"
        }
      >
        <HeroCanvas />
        <HeroCopyOverlay reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Modify `src/components/landing/hero-copy-overlay.tsx` to accept and honor `reducedMotion`:

Add the prop to the function signature and handle it. Replace the export line and function signature:

```tsx
export function HeroCopyOverlay({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { scrollYProgress } = useScroll();

  // When reduced motion is active, skip the scrub animation entirely and
  // show the final beat-3 copy as static visible content.
  if (reducedMotion) {
    const beat3 = beats.find((b) => b.id === "beat-3");
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
        {beat3?.content}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {beats.map((beat) => (
        <BeatOverlay key={beat.id} beat={beat} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
```

Note: move the `beats` array definition above the `HeroCopyOverlay` function so it is accessible to the early return. Currently `beats` is defined inside the function body — extract it to module scope or to a variable before the first `if`.

Full updated file after the refactor:

```tsx
"use client";

import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Beat = {
  id: string;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  content: React.ReactNode;
};

function BeatOverlay({
  beat,
  scrollYProgress,
}: {
  beat: Beat;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(
    scrollYProgress,
    [beat.inStart, beat.inEnd, beat.outStart, beat.outEnd],
    [0, 1, 1, 0],
  );

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center justify-center px-4"
    >
      {beat.content}
    </motion.div>
  );
}

const beats: Beat[] = [
  {
    id: "beat-1",
    inStart: 0,
    inEnd: 0.05,
    outStart: 0.28,
    outEnd: 0.33,
    content: (
      <div className="text-center text-white drop-shadow-lg">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">FrozenDice</h1>
        <p className="mt-4 text-xl font-medium sm:text-2xl">Cold dice. Hot stories.</p>
      </div>
    ),
  },
  {
    id: "beat-2",
    inStart: 0.33,
    inEnd: 0.38,
    outStart: 0.61,
    outEnd: 0.66,
    content: (
      <div className="text-center text-white drop-shadow-lg">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Live D&amp;D from the frozen north.
        </h2>
        <p className="mt-4 text-lg sm:text-xl">
          Original campaigns. Nordic lore. Streamed weekly on YouTube.
        </p>
      </div>
    ),
  },
  {
    id: "beat-3",
    inStart: 0.66,
    inEnd: 0.71,
    outStart: 0.95,
    outEnd: 1.0,
    content: (
      <div className="flex flex-col items-center gap-6 text-center text-white drop-shadow-lg">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Join the saga.</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="https://www.patreon.com/c/FrozenDice"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-[#FF424D] hover:bg-[#e63a45] text-white border-0",
            )}
          >
            Become a Patron
          </Link>
          <Link
            href={`https://www.youtube.com/channel/${process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Watch Live
          </Link>
          <Link
            href="/store"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Shop
          </Link>
        </div>
      </div>
    ),
  },
];

export function HeroCopyOverlay({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { scrollYProgress } = useScroll();

  if (reducedMotion) {
    const beat3 = beats.find((b) => b.id === "beat-3");
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
        {beat3?.content}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {beats.map((beat) => (
        <BeatOverlay key={beat.id} beat={beat} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add src/components/landing/hero-canvas.tsx src/components/landing/hero-copy-overlay.tsx src/components/landing/hero-section.tsx
git commit -m "feat(landing): handle prefers-reduced-motion in hero animation"
```

---

## Task 18: Rewrite the landing page

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

The current landing page is a placeholder with `NewsletterSignup` and a features grid. Replace it entirely with the composed sections. The page is a Server Component; all data fetching happens here and is passed down as props.

- [ ] **Step 1:** Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { getPatreonPerks, getStreamSchedule, getFeaturedVods, getFeaturedProducts } from "@/sanity/queries";
import { HeroSection } from "@/components/landing/hero-section";
import { PatreonSection } from "@/components/landing/patreon-section";
import { StreamsSection } from "@/components/landing/streams-section";
import { FeaturedProductsSection } from "@/components/landing/featured-products-section";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: {
    absolute: "FrozenDice — Cold dice. Hot stories.",
  },
  description:
    "Live D&D streaming from the frozen north. Original campaigns, Nordic lore, and a Patreon community of adventurers.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "FrozenDice — Cold dice. Hot stories.",
    description:
      "Live D&D streaming from the frozen north. Original campaigns, Nordic lore, and a Patreon community of adventurers.",
    url: siteConfig.url,
  },
};

export default async function HomePage() {
  const [patreonPerks, streamSchedule, featuredVodsData, featuredProducts] =
    await Promise.all([
      getPatreonPerks(),
      getStreamSchedule(),
      getFeaturedVods(),
      getFeaturedProducts(3),
    ]);

  return (
    <>
      {/*
        LCP preload for the hero canvas first frame.
        Caught in spec review 2026-04-26: without this hint, frame 1 is only
        discovered after the HeroCanvas client component hydrates and starts
        preloading via `new Image()`. That makes LCP fail on cold loads. The
        preload below tells the browser to fetch frame 1 in parallel with the
        bundle. React 19 hoists <link> tags to <head> automatically.
        Both desktop and mobile sets get a hint; the matching media query
        decides which one is fetched.
      */}
      <link
        rel="preload"
        as="image"
        href="/images/hero/desktop/1.webp"
        media="(min-width: 768px)"
        // @ts-expect-error fetchpriority is valid HTML, not yet in React types
        fetchpriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/images/hero/mobile/1.webp"
        media="(max-width: 767px)"
        // @ts-expect-error fetchpriority is valid HTML, not yet in React types
        fetchpriority="high"
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          description:
            "Live D&D streaming from the frozen north. Original campaigns, Nordic lore, and a Patreon community.",
        }}
      />

      <HeroSection />
      <PatreonSection perks={patreonPerks} />
      <StreamsSection schedule={streamSchedule} featuredVods={featuredVodsData} />
      <FeaturedProductsSection products={featuredProducts} />
    </>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

Expected: clean (assuming Phase 3 types are present). If `getFeaturedProducts` is not yet in `queries.ts`, the typecheck will error — add it before committing (copy from Phase 3 Task 5 exactly).

- [ ] **Step 3:** Commit

```bash
git add "src/app/(marketing)/page.tsx"
git commit -m "feat(landing): replace stub homepage with four-section branded landing page"
```

---

## Task 19: Seed `patreonPerks` singleton in Sanity Studio (external)

- [ ] **Step 1:** Start dev server

```bash
pnpm dev
```

- [ ] **Step 2:** Open `http://localhost:3000/studio`. Navigate to **Patreon perks (landing section)** and click **Create** (or **Edit** if the document already exists from Phase 1 setup).

- [ ] **Step 3:** Fill in the required fields:
  - **Eyebrow:** `Patreon`
  - **Headline:** `The full saga lives here.`
  - **Intro body:** `Patrons get exclusive campaign maps, monster stat blocks, NPC portraits, session journals, and access to our Discord community. Every campaign chapter, unlocked.`
  - **Patreon URL:** `https://www.patreon.com/c/FrozenDice`
  - **Perk cards (4–5):** For each card, upload a placeholder image, set a label (e.g. `Campaign map`, `Monster stat block`, `NPC portrait`, `Session journal`, `Discord community`), and add a one-sentence blurb.
  - **Tier summary (optional, up to 3):** Use placeholders `Campfire / Ranger / Dragonslayer` with example prices and one-line summaries. These are finalized with real Patreon data later — no code change required.

- [ ] **Step 4:** Publish the document.

- [ ] **Step 5:** Verify via GROQ in the Vision tool:

```groq
*[_type == "patreonPerks"][0] { headline, patreonUrl, "cardCount": count(cards) }
```

Expected: `headline` and `patreonUrl` populated, `cardCount` ≥ 4.

- [ ] **Step 6:** No commit — external content.

---

## Task 20: Seed `streamSchedule` and `featuredVods` singletons (external)

- [ ] **Step 1:** In Studio, navigate to **Stream schedule** and create/edit:
  - **YouTube channel ID:** The `UCxxxxxxxxxx...` channel ID for FrozenDice (obtain from YouTube Studio → Settings → Channel → Basic info).
  - **Upcoming sessions:** Add 1–3 upcoming sessions with titles, scheduled dates/times, and optional descriptions.
  - Publish.

- [ ] **Step 2:** Navigate to **Featured VODs** and create/edit:
  - Add 6 VOD entries. For each, paste the 11-character YouTube video ID from a FrozenDice video URL (e.g. from `youtube.com/watch?v=xxxxxxxxxxx`, copy the `xxxxxxxxxxx` part). Optionally add a title override.
  - Publish.

- [ ] **Step 3:** Verify via Vision:

```groq
*[_type == "streamSchedule"][0] { youtubeChannelId, "upcomingCount": count(upcoming) }
```

```groq
*[_type == "featuredVods"][0] { "vodCount": count(vods) }
```

Both should return populated documents.

- [ ] **Step 4:** Add `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` (and `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`) to the local `.env.local` file by running:

```bash
vercel env pull .env.local
```

Then manually add the three YouTube vars if they aren't yet in Vercel's env settings. Verify the LIVE pill by visiting `http://localhost:3000/api/youtube/live-status` — it should return `{ "isLive": false }` (unless the channel happens to be live).

- [ ] **Step 5:** No commit — external content + env configuration.

---

## Task 21: Add revalidation tag support for landing singletons

**Files:**
- Modify: `src/app/api/revalidate/route.ts` (the webhook handler installed in Phase 1)

The Phase 1 revalidate webhook already handles `post` and `product` tags. Extend it to also revalidate `patreonPerks`, `streamSchedule`, and `featuredVods` when those Sanity documents are published.

- [ ] **Step 1:** Read `src/app/api/revalidate/route.ts` first, then append the new document types to the tag map.

**⚠️ Next 16 signature note:** `revalidateTag` requires a second argument in Next 16 — use `revalidateTag(tag, { expire: 0 })` for webhook-driven immediate cache busts. The Phase 1 handler already uses this two-argument form; preserve that pattern. (Caught in spec review 2026-04-26.)

```typescript
// Existing (from Phase 1) — preserve as-is:
// "post"    → revalidateTag("post", { expire: 0 })
// "product" → revalidateTag("product", { expire: 0 })

// Add Phase 4 singletons (match the existing two-arg pattern):
case "patreonPerks":
  revalidateTag("patreonPerks", { expire: 0 });
  break;
case "streamSchedule":
  revalidateTag("streamSchedule", { expire: 0 });
  break;
case "featuredVods":
  revalidateTag("featuredVods", { expire: 0 });
  break;
```

**Note on tag-name casing:** the webhook passes `body._type` directly through `revalidateTag`. Singleton schema `name` fields (`patreonPerks`, `streamSchedule`, `featuredVods`) must match the tag string at every fetch site exactly. Phase 1 schemas already use camelCase; do not introduce kebab-case or snake_case variants in fetches.

The exact shape of the switch/map in the existing file depends on Phase 1's implementation — read the file first and slot the new cases into the correct position in the existing control flow.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/app/api/revalidate/route.ts
git commit -m "feat(sanity): revalidate patreonPerks, streamSchedule, featuredVods on publish"
```

---

## Task 22: Smoke test — full landing page

**Files:** None modified.

- [ ] **Step 1:** Run dev server

```bash
pnpm dev
```

- [ ] **Step 2:** Visit `http://localhost:3000/`.

Hero check:
- The sticky section pins while scrolling through ~500vh of scroll space.
- As you scroll, beat-1 copy fades in (FrozenDice / "Cold dice. Hot stories."), then beat-2 ("Live D&D from the frozen north..."), then beat-3 ("Join the saga.") with three CTA buttons.
- Canvas frames advance with scroll. No console errors about missing WebP files.
- Enable "Emulate CSS media feature prefers-reduced-motion" in browser DevTools → the hero collapses to a single viewport of height; beat-3 copy is always visible as static content.

Patreon section check:
- Section renders with eyebrow, headline, body, and CTA. If Sanity content is seeded (Task 19), cards are visible and animate in as you scroll into the section. Tier summary renders (if data present).
- If `patreonPerks` is not yet seeded, section renders `null` — no crash.

Streams check:
- YouTube embed renders (may show a placeholder if channel ID is not set).
- LIVE pill is hidden (channel is not live during dev). Check `http://localhost:3000/api/youtube/live-status` returns `{"isLive":false}`.
- If `streamSchedule` is seeded, schedule strip shows upcoming sessions.
- If `featuredVods` is seeded, 6 thumbnails render. Clicking one opens the dialog; pressing Escape or clicking Close dismisses it.

Featured products check:
- If Sanity has `featured: true` products (from Phase 3), 3 cards appear with staggered entrance as viewport scrolls in. If no featured products exist, section renders `null`.

Other pages check:
- `/blog`, `/store`, `/about` all still load — no regressions from Phase 4.

- [ ] **Step 3:** (No commit) — verification task.

---

## Task 23: Mobile real-device QA — frame-snapping decision

**Files:** Conditionally modify `src/components/landing/hero-canvas.tsx`

This task exists to capture the spec's explicit "implementation checkpoint" (§3.1): test on a mid-range Android device.

- [ ] **Step 1:** Open `http://<local-network-ip>:3000` on a mid-range Android device (Pixel 6a or equivalent).
- [ ] **Step 2:** Scroll through the hero animation on the mobile WebP set (640px frames). Observe whether the canvas scrub is visibly stuttery.
- [ ] **Step 3 (only if stuttery):** In `src/components/landing/hero-canvas.tsx`, modify the `useMotionValueEvent` handler to snap to every other frame on mobile:

```typescript
useMotionValueEvent(frameIndex, "change", (latest) => {
  let n = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(latest)));
  // Mobile frame-snap: draw every 2nd frame to reduce canvas repaint frequency.
  if (getAssetSet() === "mobile") {
    n = Math.round(n / 2) * 2 || 1;
  }
  if (n === currentFrameRef.current) return;
  currentFrameRef.current = n;
  drawFrame(n);
});
```

- [ ] **Step 4 (only if modified):** Typecheck + commit:

```bash
pnpm tsc --noEmit
git add src/components/landing/hero-canvas.tsx
git commit -m "perf(landing): snap to every-2nd frame on mobile to reduce canvas repaint"
```

If the animation is smooth, no code changes are needed. Document the test result (device model, OS version, result) in a comment at the top of `hero-canvas.tsx`.

---

## Task 24: Add `next/image` remote patterns for YouTube thumbnails

**Files:**
- Modify: `next.config.ts`

YouTube thumbnail URLs (`i.ytimg.com`) are external — Next.js Image Optimization will reject them unless the hostname is whitelisted.

- [ ] **Step 1:** Read `next.config.ts` first. Locate the `images` configuration block (or add one). Ensure `i.ytimg.com` is in `remotePatterns`:

```typescript
images: {
  remotePatterns: [
    // existing entries (Sanity CDN) …
    {
      protocol: "https",
      hostname: "i.ytimg.com",
      pathname: "/vi/**",
    },
  ],
},
```

The existing Sanity CDN pattern (`cdn.sanity.io`) should already be present from Phase 1 or 2. Add the YouTube entry alongside it.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add next.config.ts
git commit -m "chore: allow i.ytimg.com in Next.js image remote patterns"
```

---

## Task 25: End-to-end Definition of Done verification

**Files:** None modified.

- [ ] Run `pnpm tsc --noEmit`. Clean.
- [ ] Run `pnpm build`. Build completes without errors.
- [ ] `http://localhost:3000/` renders four visible sections: hero, Patreon, streams, featured products.
- [ ] Hero canvas advances frames on scroll; beats fade in and out at the correct thresholds.
- [ ] `prefers-reduced-motion: reduce` collapses the hero to a single viewport and shows beat-3 copy statically.
- [ ] `/api/youtube/live-status` returns `{ "isLive": false | true }` without a 500 error.
- [ ] VOD lightbox opens on thumbnail click and can be closed with Escape.
- [ ] `public/images/hero/desktop/` and `public/images/hero/mobile/` each contain 121 `.webp` files.
- [ ] `frozendice_dice/` is in `.gitignore`.
- [ ] `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` are documented in `.env.example`.
- [ ] `sharp` is in `devDependencies` in `package.json`.
- [ ] `/blog`, `/store`, `/about` remain unaffected (smoke check).

---

## Definition of Done (Phase 4)

Phase 4 is complete when all of these are true:

1. `pnpm tsc --noEmit` is clean.
2. `pnpm build` completes without errors.
3. `http://localhost:3000/` renders all four sections: hero scroll animation, Patreon dealt-card, streams (embed + schedule + VOD grid), featured products 3-up.
4. Canvas hero advances through 121 frames as the user scrolls. All three narrative copy beats fade in and out at the correct scroll thresholds (0–33%, 33–66%, 66–100%).
5. With `prefers-reduced-motion: reduce` active, the hero collapses to a single viewport height and shows beat-3 copy as static text. No animation runs.
6. `/api/youtube/live-status` returns `{ "isLive": boolean }` without a 500 error when `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` are set.
7. The LIVE pill appears on the hero player when the channel is live (verified manually or via a mocked API response).
8. Clicking a VOD thumbnail opens the inline lightbox iframe. Pressing Escape or clicking Close dismisses it.
9. `public/images/hero/desktop/` and `public/images/hero/mobile/` each contain exactly 121 `.webp` files named `1.webp`–`121.webp`.
10. `frozendice_dice/` is in `.gitignore`.
11. `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, and `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` are documented in `.env.example` (uncommented).
12. `sharp` is listed in `devDependencies` in `package.json`.
13. The `/blog`, `/store`, and `/about` routes are unaffected by Phase 4 changes (smoke-check all three still load).
14. The featured-products section renders `null` gracefully if no featured products are published in Sanity.
15. The Patreon section renders `null` gracefully if the `patreonPerks` document is not yet published.

---

## Self-review notes

### Spec coverage

- §3.1 hero scroll animation (121-frame WebP canvas, sticky CSS pinning, responsive asset sets, `prefers-reduced-motion`, three copy beats, beat-3 CTAs) — Tasks 2, 3, 8, 9, 16, 17 ✓
- §3.1 implementation checkpoint (real-device mobile frame-snapping decision) — Task 23 ✓
- §3.2 Patreon section (two-column sticky, dealt-card animation, tier summary, `patreonPerks` Sanity source) — Tasks 5, 6, 10, 11 ✓
- §3.3 streams section (YouTube embed, LIVE pill with 60s revalidate, schedule strip, 6-VOD grid, lightbox, CTAs) — Tasks 5, 6, 7, 12, 13, 14 ✓
- §3.4 featured products 3-up (`getFeaturedProducts`, `ProductCard`, `whileInView` stagger) — Tasks 5, 6, 15 ✓
- §8 hero-frame pipeline (`scripts/optimize-hero-frames.ts`, sharp, `frozendice_dice/` → `.gitignore`, two WebP sets) — Tasks 1, 2, 3, 4 ✓
- §8 env vars (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`) — Tasks 4, 9 ✓
- §11 open questions relevant to Phase 4:
  - *Tagline finalization* — "Cold dice. Hot stories." used as spec-specified placeholder; tunable in `hero-copy-overlay.tsx` line without other code changes. No resolution required to execute.
  - *Tier names and perks* — handled by Task 19 Sanity seeding; placeholder names (`Campfire / Ranger / Dragonslayer`) used. Finalized by editor post-phase.
  - *Mobile frame-snapping fallback* — deferred to Task 23 real-device QA per spec.

### Placeholder scan

- Tagline "Cold dice. Hot stories." — intentional per spec §11; editor-tunable without code.
- Patreon URL `https://www.patreon.com/c/FrozenDice` — used directly in code. **Controller should confirm this is the live URL before shipping.**
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` in the Watch Live CTA href — must be populated in env before deploy. Graceful fallback (`?? ""`) prevents a crash with an empty URL.
- Perk card images for `patreonPerks` in Task 19 — placeholder images used during seeding; replaced with real art by the editor at any time (no code change needed).
- Tier names `Campfire / Ranger / Dragonslayer` — placeholders per spec §11; editor replaces in Studio.

### Type consistency

- `PatreonPerks`, `PerkCard`, `TierSummary` defined in Task 5; consumed in Tasks 6 (query), 10 (card deck), 11 (section).
- `StreamSchedule`, `UpcomingSession` defined in Task 5; consumed in Tasks 6 (query), 14 (section).
- `FeaturedVods`, `Vod` defined in Task 5; consumed in Tasks 6 (query), 13 (VOD grid), 14 (section).
- `ProductCard` and `getFeaturedProducts()` are Phase 3 types — Task 15 imports them verbatim; no new types introduced.
- All GROQ projections in Task 6 project the exact fields declared in the TypeScript types; `_key` is included on all array members for React key props.

### Non-goals explicitly honored

- **No paid membership infrastructure** — Patreon is the external system; the section only links out.
- **No self-hosted video** — all video is YouTube embed only.
- **No GTM / analytics integration into the hero** — GTM is wired separately (it already exists as `NEXT_PUBLIC_GTM_ID`); no tracking calls inside canvas or scroll handlers.
- **No newsletter capture** — `NewsletterSignup` removed from the homepage in Task 18; no replacement newsletter UI added.
- **No scroll-jacking** — sticky CSS handles pinning; framer-motion only reads `scrollYProgress`, it does not manipulate `window.scrollY` or override native scroll behavior.

### Open questions for the controller to resolve before execution

1. **Confirm Patreon URL:** Is `https://www.patreon.com/c/FrozenDice` the live campaign URL? It is hardcoded in `hero-copy-overlay.tsx` and `patreon-section-inner.tsx`. If the URL is different, update both files before shipping.
2. **`NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` env var:** The Watch Live CTA constructs the YouTube channel URL from this public env var. It must be added to Vercel's env settings (it is the same value as `YOUTUBE_CHANNEL_ID` but prefixed `NEXT_PUBLIC_` so it is safe to expose to the client). Confirm this is acceptable before deploy.
3. **Patreon section background color:** The section uses `bg-muted/20` — verify this reads well against the site's theme. If the design requires a more dramatic treatment (e.g. a dark overlay with snow), that is a style-only change to `patreon-section-inner.tsx` and can be made without re-executing earlier tasks.
4. **Hero canvas background color:** The sticky container uses `bg-black`. If the first frame (die appearing) has transparency or a white background, `bg-black` may produce a harsh flash. Inspect `1.webp` and adjust if needed.
5. **Phase 3 prerequisite:** `getFeaturedProducts()` (Task 6 note) and `ProductCard` component (Task 15) must exist before Task 18 typechecks cleanly. If Phase 3 has not been executed, the implementer should copy the relevant query and type from the Phase 3 plan before running Phase 4.

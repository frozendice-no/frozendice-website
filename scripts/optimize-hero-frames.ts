#!/usr/bin/env -S pnpm tsx
/**
 * One-shot hero-frame pipeline.
 *
 * Converts frozendice_dice/ezgif-frame-NNN.jpg (121 frames, 1-indexed) into:
 *   public/images/hero/desktop/N.webp  — source resolution (1928px), quality 85, effort 6
 *   public/images/hero/mobile/N.webp   — 800px wide,                 quality 82, effort 6
 *
 * Usage:
 *   pnpm tsx scripts/optimize-hero-frames.ts
 *
 * Run once. Commit the output. frozendice_dice/ is gitignored — keep the
 * source folder locally as a backup. Re-run if quality settings change.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "frozendice_dice");
const DEST_DESKTOP = path.join(process.cwd(), "public/images/hero/desktop");
const DEST_MOBILE = path.join(process.cwd(), "public/images/hero/mobile");
const TOTAL_FRAMES = 121;

// Desktop: pass through source resolution (1928px). With cover-fit and
// high-DPR displays, anything smaller goes soft on 1080p+ viewports.
const DESKTOP_QUALITY = 85;
const MOBILE_WIDTH = 800;
const MOBILE_QUALITY = 82;
const ENCODE_EFFORT = 6;

function srcPath(n: number): string {
  const padded = String(n).padStart(3, "0");
  return path.join(SRC_DIR, `ezgif-frame-${padded}.jpg`);
}

async function processFrame(n: number): Promise<void> {
  const src = srcPath(n);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source frame: ${src}`);
  }

  // Desktop: no resize — keep source pixels.
  await sharp(src)
    .webp({ quality: DESKTOP_QUALITY, effort: ENCODE_EFFORT })
    .toFile(path.join(DEST_DESKTOP, `${n}.webp`));

  await sharp(src)
    .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
    .webp({ quality: MOBILE_QUALITY, effort: ENCODE_EFFORT })
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

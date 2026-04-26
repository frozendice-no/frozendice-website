#!/usr/bin/env -S pnpm tsx
/**
 * One-shot hero-frame pipeline.
 *
 * Source: frozendice_dice/frozendice_animation.mp4 (1928x1072, 24 fps, 5 s).
 * Output:
 *   public/images/hero/desktop/N.webp  — source resolution, quality 85, effort 6
 *   public/images/hero/mobile/N.webp   — 800px wide,        quality 82, effort 6
 *
 * Pipeline:
 *   1. ffmpeg (via ffmpeg-static) decodes the mp4 to lossless PNGs in a temp dir.
 *   2. sharp encodes each PNG to two WebP sets.
 *   3. The temp PNG dir is removed.
 *
 * Why PNG intermediates rather than JPG: each lossy round-trip degrades the
 * image. The h264-decoded PNG is effectively lossless from the source video,
 * so the only lossy step is the final WebP encode that we control.
 *
 * Usage:
 *   pnpm tsx scripts/optimize-hero-frames.ts
 *
 * frozendice_dice/ is gitignored — keep the source video locally as backup.
 * Re-run if the source video or quality settings change.
 */
import sharp from "sharp";
import ffmpegStatic from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SRC_VIDEO = path.join(process.cwd(), "frozendice_dice", "frozendice_animation.mp4");
const TMP_FRAMES = path.join(process.cwd(), "frozendice_dice", "tmp-frames");
const DEST_DESKTOP = path.join(process.cwd(), "public/images/hero/desktop");
const DEST_MOBILE = path.join(process.cwd(), "public/images/hero/mobile");

const TOTAL_FRAMES = 121;
const DESKTOP_QUALITY = 85;
const MOBILE_WIDTH = 800;
const MOBILE_QUALITY = 82;
const ENCODE_EFFORT = 6;

function tmpFramePath(n: number): string {
  return path.join(TMP_FRAMES, `frame-${String(n).padStart(3, "0")}.png`);
}

function extractFrames(): void {
  if (!ffmpegStatic) {
    throw new Error("ffmpeg-static did not resolve to a binary path");
  }
  fs.rmSync(TMP_FRAMES, { recursive: true, force: true });
  fs.mkdirSync(TMP_FRAMES, { recursive: true });

  console.log("Extracting frames with ffmpeg...");
  const result = spawnSync(
    ffmpegStatic,
    [
      "-y",
      "-i", SRC_VIDEO,
      "-vsync", "0",
      path.join(TMP_FRAMES, "frame-%03d.png"),
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? Buffer.from(""));
    throw new Error(`ffmpeg exited with status ${result.status}`);
  }

  const extracted = fs.readdirSync(TMP_FRAMES).filter((f) => f.endsWith(".png")).length;
  if (extracted !== TOTAL_FRAMES) {
    throw new Error(`Expected ${TOTAL_FRAMES} frames, got ${extracted}`);
  }
  console.log(`Extracted ${extracted} PNG frames.`);
}

async function encodeFrame(n: number): Promise<void> {
  const src = tmpFramePath(n);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing extracted frame: ${src}`);
  }

  await sharp(src)
    .webp({ quality: DESKTOP_QUALITY, effort: ENCODE_EFFORT })
    .toFile(path.join(DEST_DESKTOP, `${n}.webp`));

  await sharp(src)
    .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
    .webp({ quality: MOBILE_QUALITY, effort: ENCODE_EFFORT })
    .toFile(path.join(DEST_MOBILE, `${n}.webp`));
}

async function main(): Promise<void> {
  if (!fs.existsSync(SRC_VIDEO)) {
    console.error(`Source video not found: ${SRC_VIDEO}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DESKTOP, { recursive: true });
  fs.mkdirSync(DEST_MOBILE, { recursive: true });

  extractFrames();

  console.log(`Encoding ${TOTAL_FRAMES} frames to WebP...`);
  const start = Date.now();
  for (let n = 1; n <= TOTAL_FRAMES; n++) {
    await encodeFrame(n);
    if (n % 20 === 0 || n === TOTAL_FRAMES) {
      process.stdout.write(`  ${n}/${TOTAL_FRAMES}\n`);
    }
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  fs.rmSync(TMP_FRAMES, { recursive: true, force: true });

  console.log(`Done in ${elapsed}s.`);
  console.log(`Desktop: ${DEST_DESKTOP}`);
  console.log(`Mobile:  ${DEST_MOBILE}`);
}

main().catch((err) => {
  console.error(err);
  fs.rmSync(TMP_FRAMES, { recursive: true, force: true });
  process.exit(1);
});

"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";

const TOTAL_FRAMES = 121;
const REDUCED_MOTION_FRAME = 60;

function getAssetSet(): "desktop" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
}

function frameUrl(set: "desktop" | "mobile", n: number): string {
  return `/images/hero/${set}/${n}.webp`;
}

function paint(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
) {
  const { width: cw, height: ch } = canvas;
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function HeroCanvas({
  frameIndex,
  reducedMotion = false,
}: {
  frameIndex: MotionValue<number>;
  reducedMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(reducedMotion ? REDUCED_MOTION_FRAME : 1);

  function drawFrame(n: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[n - 1];
    if (img && img.complete && img.naturalWidth > 0) {
      paint(ctx, canvas, img);
      return;
    }
    // Target frame not ready — fall back to the nearest loaded earlier frame
    // so the canvas never goes blank mid-scrub.
    for (let i = n - 1; i >= 1; i--) {
      const candidate = imagesRef.current[i - 1];
      if (candidate && candidate.complete && candidate.naturalWidth > 0) {
        paint(ctx, canvas, candidate);
        return;
      }
    }
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrameRef.current);
  }

  useEffect(() => {
    const set = getAssetSet();
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    imagesRef.current = images;

    function loadFrame(n: number) {
      const img = new Image();
      img.src = frameUrl(set, n);
      img.onload = () => {
        // If this is the frame we're currently scrolled to, redraw now that it's ready.
        if (currentFrameRef.current === n) {
          drawFrame(n);
        }
      };
      images[n - 1] = img;
    }

    if (reducedMotion) {
      // Accessibility: only load the freeze frame; skip the other 120 frames entirely.
      loadFrame(REDUCED_MOTION_FRAME);
    } else {
      for (let n = 1; n <= TOTAL_FRAMES; n++) {
        loadFrame(n);
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (reducedMotion) return;
    const n = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(latest)));
    if (n === currentFrameRef.current) return;
    currentFrameRef.current = n;
    drawFrame(n);
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}

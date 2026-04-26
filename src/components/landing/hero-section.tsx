"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform } from "framer-motion";
import { HeroCanvas } from "./hero-canvas";
import { HeroCopyOverlay } from "./hero-copy-overlay";

const TOTAL_FRAMES = 121;

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sticky-pinning technique: outer wrapper is h-[500vh] (full motion) or h-screen
  // (reduced motion) — creates the scroll space. The inner sticky div pins as
  // the outer scrolls past. Framer-motion only reads scrollYProgress; it never
  // controls positioning.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, TOTAL_FRAMES]);

  if (reducedMotion) {
    return (
      <div ref={heroRef} className="relative">
        <div className="relative h-screen overflow-hidden bg-black">
          <HeroCanvas frameIndex={frameIndex} reducedMotion />
          <HeroCopyOverlay scrollYProgress={scrollYProgress} reducedMotion />
        </div>
      </div>
    );
  }

  return (
    <div ref={heroRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        <HeroCanvas frameIndex={frameIndex} />
        <HeroCopyOverlay scrollYProgress={scrollYProgress} />
      </div>
    </div>
  );
}

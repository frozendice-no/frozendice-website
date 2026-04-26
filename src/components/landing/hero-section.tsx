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

  // Sticky-pinning technique. The outer wrapper creates the scroll space
  // (1000vh = 4 stages × 250vh). The inner sticky div pins for the duration
  // of the outer's scroll. The dice scrubs in REVERSE (TOTAL_FRAMES → 1) so
  // it starts settled and rolls away across the four stages.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [TOTAL_FRAMES, 1]);

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
    <div ref={heroRef} className="relative h-[1000vh]">
      {/*
        Anchor targets for stage-1 CTAs. Positioned absolutely at the start
        of each stage so smooth-scroll jumps land the viewport at the right
        scroll progress (and therefore the right dice frame + visible stage).
      */}
      <div id="stage-intro" className="absolute top-0 h-px w-full" />
      <div id="stage-patreon" className="absolute top-[25%] h-px w-full" />
      <div id="stage-blog" className="absolute top-[50%] h-px w-full" />
      <div id="stage-streams" className="absolute top-[75%] h-px w-full" />

      <div className="sticky top-0 h-screen overflow-hidden bg-black">
        <HeroCanvas frameIndex={frameIndex} />
        <HeroCopyOverlay scrollYProgress={scrollYProgress} />
      </div>
    </div>
  );
}

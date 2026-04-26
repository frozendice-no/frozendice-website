"use client";

import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fallback if NEXT_PUBLIC_YOUTUBE_CHANNEL_ID isn't set in the environment.
const YOUTUBE_FALLBACK = "https://www.youtube.com/@FrozenDice_no";

type Beat = {
  id: string;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  content: React.ReactNode;
};

function youtubeChannelUrl(): string {
  const id = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  return id ? `https://www.youtube.com/channel/${id}` : YOUTUBE_FALLBACK;
}

const beats: Beat[] = [
  {
    id: "beat-1",
    inStart: 0,
    inEnd: 0.05,
    outStart: 0.28,
    outEnd: 0.33,
    content: (
      <div className="hero-text-outline text-center">
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
      <div className="hero-text-outline text-center">
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
      <div className="hero-text-outline pointer-events-auto flex flex-col items-center gap-6 text-center">
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
            href={youtubeChannelUrl()}
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

function BeatOverlay({
  beat,
  scrollYProgress,
}: {
  beat: Beat;
  scrollYProgress: MotionValue<number>;
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

export function HeroCopyOverlay({
  scrollYProgress,
  reducedMotion = false,
}: {
  scrollYProgress: MotionValue<number>;
  reducedMotion?: boolean;
}) {
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

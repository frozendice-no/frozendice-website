"use client";

import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PATREON_URL = "https://www.patreon.com/c/FrozenDice";
const YOUTUBE_FALLBACK = "https://www.youtube.com/@FrozenDice_no";

function youtubeChannelUrl(): string {
  const id = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  return id ? `https://www.youtube.com/channel/${id}` : YOUTUBE_FALLBACK;
}

type Stage = {
  id: string;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  // When true, the stage holds opacity 1 for any scroll value below
  // inStart instead of starting invisible. Used for stage 1 so the intro
  // headline + CTAs are present on page load before any scroll.
  visibleAtStart?: boolean;
  render: (scrollYProgress: MotionValue<number>) => React.ReactNode;
};

// 4 stages, each occupying ~25% of the hero scroll. Fade-in over 5%, hold
// for ~17%, fade-out over 5% so adjacent stages cross-fade cleanly.
const stages: Stage[] = [
  {
    id: "stage-1",
    inStart: 0,
    inEnd: 0.03,
    outStart: 0.2,
    outEnd: 0.25,
    visibleAtStart: true,
    render: () => <Stage1Intro />,
  },
  {
    id: "stage-2",
    inStart: 0.25,
    inEnd: 0.3,
    outStart: 0.45,
    outEnd: 0.5,
    render: (scrollYProgress) => <Stage2Patreon scrollYProgress={scrollYProgress} />,
  },
  {
    id: "stage-3",
    inStart: 0.5,
    inEnd: 0.55,
    outStart: 0.7,
    outEnd: 0.75,
    render: () => <Stage3Blog />,
  },
  {
    id: "stage-4",
    inStart: 0.75,
    inEnd: 0.8,
    outStart: 0.95,
    outEnd: 1.0,
    render: () => <Stage4Streams />,
  },
];

function Stage1Intro() {
  return (
    <div className="hero-text-outline pointer-events-auto max-w-xl">
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">FrozenDice</h1>
      <p className="mt-4 text-xl font-medium sm:text-2xl">Cold dice. Hot stories.</p>
      <p className="mt-3 text-base text-white/90 sm:text-lg">
        Nordic D&amp;D streamed live, with a community on Patreon and ongoing
        campaign recaps on the blog.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="#stage-patreon"
          className={cn(
            buttonVariants({ size: "lg" }),
            "border-0 bg-[#FF424D] text-white hover:bg-[#e63a45]",
          )}
        >
          Become a Patron
        </a>
        <a
          href="#stage-blog"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Read the Blog
        </a>
        <a
          href="#stage-streams"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Watch Stream
        </a>
      </div>
    </div>
  );
}

function Stage2Patreon({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div className="hero-text-outline pointer-events-auto max-w-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
          Patreon
        </p>
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The full saga lives here.
        </h2>
        <p className="mt-4 text-lg text-white/90">
          Patrons get exclusive campaign maps, monster stat blocks, NPC
          portraits, session journals, and access to our Discord community.
        </p>
        <Link
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 border-0 bg-[#FF424D] text-white hover:bg-[#e63a45]",
          )}
        >
          Become a Patron →
        </Link>
      </div>
      {/*
        PDF placeholder cards fly in from off-screen-right between scroll
        progress 0.28 and 0.42 (within stage 2's window). Hidden on mobile
        until we tune a vertical-stack treatment.
      */}
      <div className="hidden lg:block">
        <PdfCardStack scrollYProgress={scrollYProgress} />
      </div>
    </div>
  );
}

function Stage3Blog() {
  return (
    <div className="hero-text-outline pointer-events-auto max-w-xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
        Blog
      </p>
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Dispatches from the frozen north.
      </h2>
      <p className="mt-4 text-lg text-white/90">
        Session recaps, campaign guides, and behind-the-table notes. Read
        along between streams.
      </p>
      <Link
        href="/blog"
        className={cn(
          buttonVariants({ size: "lg", variant: "outline" }),
          "mt-8",
        )}
      >
        Read the Blog →
      </Link>
      {/* TODO(iteration-3): render latest 3 posts from Sanity here. */}
    </div>
  );
}

function Stage4Streams() {
  return (
    <div className="hero-text-outline pointer-events-auto max-w-xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
        Live &amp; on-demand
      </p>
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Watch the saga unfold.
      </h2>
      <p className="mt-4 text-lg text-white/90">
        Original campaigns streamed weekly. Catch up on past sessions, or tune
        in live.
      </p>
      <Link
        href={youtubeChannelUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ size: "lg" }), "mt-8")}
      >
        Subscribe on YouTube →
      </Link>
      {/* TODO(iteration-4): YouTube embed + LIVE pill + schedule + VOD grid. */}
    </div>
  );
}

const PDF_CARDS: {
  inStart: number;
  inEnd: number;
  top: string;
  left: string;
  rotate: number;
  label: string;
}[] = [
  { inStart: 0.28, inEnd: 0.34, top: "10%", left: "5%", rotate: -8, label: "Campaign map" },
  { inStart: 0.32, inEnd: 0.38, top: "30%", left: "30%", rotate: 4, label: "Monster stat block" },
  { inStart: 0.36, inEnd: 0.42, top: "5%", left: "55%", rotate: -3, label: "Session journal" },
];

function PdfCardStack({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  return (
    <div className="relative h-96">
      {PDF_CARDS.map((card, i) => (
        <PdfCard key={i} scrollYProgress={scrollYProgress} {...card} />
      ))}
    </div>
  );
}

function PdfCard({
  scrollYProgress,
  inStart,
  inEnd,
  top,
  left,
  rotate,
  label,
}: {
  scrollYProgress: MotionValue<number>;
  inStart: number;
  inEnd: number;
  top: string;
  left: string;
  rotate: number;
  label: string;
}) {
  const x = useTransform(scrollYProgress, [inStart, inEnd], [800, 0]);
  const opacity = useTransform(scrollYProgress, [inStart, inEnd], [0, 1]);

  return (
    <motion.div
      style={{ x, opacity, top, left, rotate }}
      className="absolute aspect-[3/4] w-44 rounded-md bg-white/95 p-3 shadow-2xl sm:w-52"
    >
      <div className="flex h-full flex-col">
        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          PDF
        </div>
        <div className="mt-1.5 text-xs font-bold text-stone-800">{label}</div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1 w-full rounded bg-stone-300" />
          <div className="h-1 w-5/6 rounded bg-stone-300" />
          <div className="h-1 w-3/4 rounded bg-stone-300" />
          <div className="h-1 w-full rounded bg-stone-300" />
          <div className="h-1 w-4/6 rounded bg-stone-300" />
        </div>
        <div className="mt-auto h-16 w-full rounded bg-stone-200" />
      </div>
    </motion.div>
  );
}

function StageOverlay({
  stage,
  scrollYProgress,
}: {
  stage: Stage;
  scrollYProgress: MotionValue<number>;
}) {
  // Function-form useTransform: every scroll position maps to an explicit
  // return value. Avoids framer-motion's keyframe-interpolation edge cases
  // (extrapolation past last keyframe, degenerate zero-width segments).
  const opacity = useTransform(scrollYProgress, (value) => {
    const { inStart, inEnd, outStart, outEnd, visibleAtStart } = stage;
    if (value <= inStart) return visibleAtStart ? 1 : 0;
    if (value < inEnd) {
      if (visibleAtStart) return 1;
      return (value - inStart) / (inEnd - inStart);
    }
    if (value <= outStart) return 1;
    if (value < outEnd) return 1 - (value - outStart) / (outEnd - outStart);
    return 0;
  });

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center px-6 sm:px-12 lg:px-24"
    >
      {stage.render(scrollYProgress)}
    </motion.div>
  );
}

function ReducedMotionStage1() {
  // In reduced-motion the dice is static and stages 2-4 don't exist as
  // scroll targets, so CTAs link directly to their external destinations
  // instead of #stage-X anchors.
  return (
    <div className="hero-text-outline pointer-events-auto max-w-xl">
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">FrozenDice</h1>
      <p className="mt-4 text-xl font-medium sm:text-2xl">Cold dice. Hot stories.</p>
      <p className="mt-3 text-base text-white/90 sm:text-lg">
        Nordic D&amp;D streamed live, with a community on Patreon and ongoing
        campaign recaps on the blog.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "border-0 bg-[#FF424D] text-white hover:bg-[#e63a45]",
          )}
        >
          Become a Patron
        </Link>
        <Link
          href="/blog"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Read the Blog
        </Link>
        <Link
          href={youtubeChannelUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Watch Stream
        </Link>
      </div>
    </div>
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
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center px-6 sm:px-12 lg:px-24">
        <ReducedMotionStage1 />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {stages.map((stage) => (
        <StageOverlay key={stage.id} stage={stage} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

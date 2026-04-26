import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
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

export default function HomePage() {
  return (
    <>
      {/*
        LCP preload for the hero canvas first frame. Without this, frame 1 is
        only requested after HeroCanvas hydrates. React 19 hoists <link> tags
        to <head>; the matching media query decides which set the browser
        actually fetches.
      */}
      <link
        rel="preload"
        as="image"
        href="/images/hero/desktop/1.webp"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/images/hero/mobile/1.webp"
        media="(max-width: 767px)"
        fetchPriority="high"
      />

      <HeroSection />

      {/* TODO(phase-4): add PatreonSection, StreamsSection, FeaturedProductsSection in subsequent sessions */}
    </>
  );
}

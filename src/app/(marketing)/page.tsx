import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import type { BlogPreview } from "@/components/landing/hero-copy-overlay";
import { siteConfig } from "@/lib/site-config";
import { getAllPosts, getStreamSchedule } from "@/sanity/queries";
import { urlForImage } from "@/sanity/image";
import type { PostCard } from "@/sanity/types";

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

// Resolve Sanity types into the serializable shape Stage 3 needs. Image URLs
// are pre-built here so the Client Component never touches @sanity/image-url.
function toBlogPreview(post: PostCard): BlogPreview {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverUrl: post.coverImage
      ? urlForImage(post.coverImage).width(320).height(180).auto("format").url()
      : null,
    coverAlt: post.coverImage?.alt ?? post.title,
    publishedAt: post.publishedAt,
  };
}

export default async function HomePage() {
  const [allPosts, streamSchedule] = await Promise.all([
    getAllPosts(),
    getStreamSchedule(),
  ]);
  const blogPreviews = allPosts.slice(0, 3).map(toBlogPreview);

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

      <HeroSection
        blogPreviews={blogPreviews}
        streamSchedule={streamSchedule}
      />

      {/* TODO: add /api/revalidate handling for streamSchedule + featuredVods tags when those Sanity types are wired into the webhook. */}
    </>
  );
}

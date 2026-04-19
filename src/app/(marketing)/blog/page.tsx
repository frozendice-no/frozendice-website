import type { Metadata } from "next";
import { getAllPosts, getAllTags, getFeaturedPost, getPostBySlug } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogCard } from "@/components/blog-card";
import { TagFilter } from "@/components/tag-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "D&D tips, homebrew content, campaign guides, and tabletop RPG resources from Frozen Dice.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, tags, featuredCard] = await Promise.all([
    getAllPosts(),
    getAllTags(),
    getFeaturedPost(),
  ]);

  const featuredDetail = featuredCard ? await getPostBySlug(featuredCard.slug) : null;
  const featuredLabel = featuredDetail ? readingTimeLabel(featuredDetail.body) : "";

  const postsWithLabels = await Promise.all(
    posts.map(async (p) => {
      const detail = await getPostBySlug(p.slug);
      return { post: p, label: detail ? readingTimeLabel(detail.body) : "" };
    }),
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
          <p className="mt-2 text-muted-foreground">
            Tips, guides, and homebrew content for your tabletop adventures.
          </p>
        </div>

        {featuredCard && (
          <div className="mb-10">
            <BlogCard post={featuredCard} readingLabel={featuredLabel} />
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-8">
            <TagFilter tags={tags} />
          </div>
        )}

        {postsWithLabels.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithLabels.map(({ post, label }) => (
              <BlogCard key={post._id} post={post} readingLabel={label} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

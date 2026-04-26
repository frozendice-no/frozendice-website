import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostBySlug, getPostsByTagSlug } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogCard } from "@/components/blog-card";
import { TagFilter } from "@/components/tag-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const allTags = await getAllTags();
  const tag = allTags.find((t) => t.slug === slug);
  if (!tag) return {};
  return {
    title: `#${tag.name}`,
    description: tag.description ?? `Posts tagged with #${tag.name} on Frozen Dice.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const [posts, allTags] = await Promise.all([getPostsByTagSlug(slug), getAllTags()]);
  const tag = allTags.find((t) => t.slug === slug);
  if (!tag) notFound();

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
          { name: `#${tag.name}`, href: `/blog/tag/${tag.slug}` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">#{tag.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {tag.description ?? `All posts tagged with #${tag.name}.`}
          </p>
        </div>

        <div className="mb-8">
          <TagFilter tags={allTags} activeTagSlug={tag.slug} />
        </div>

        {postsWithLabels.length === 0 ? (
          <p className="text-muted-foreground">No posts with this tag yet.</p>
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

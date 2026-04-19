import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { BreadcrumbJsonLd } from "@/components/json-ld";

type Props = { params: Promise<{ tag: string }> };

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const label = decodeURIComponent(tag);
  return {
    title: `#${label}`,
    description: `Posts tagged with #${label} on Frozen Dice.`,
    alternates: { canonical: `/blog/tag/${label}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const label = decodeURIComponent(tag);
  const posts = getPostsByTag(label);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: `#${label}`, href: `/blog/tag/${label}` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            #{label}
          </h1>
          <p className="mt-2 text-muted-foreground">
            All posts tagged with #{label}.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts with this tag yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

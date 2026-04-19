import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/sanity/queries";
import { readingTimeLabel } from "@/sanity/reading-time";
import { BlogPostContent } from "@/components/blog-post";
import { BlogCard } from "@/components/blog-card";
import { siteConfig } from "@/lib/site-config";
import { urlForImage } from "@/sanity/image";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const ogImage = post.seo?.ogImage ?? post.coverImage;
  const ogUrl = ogImage ? urlForImage(ogImage).width(1200).height(630).url() : undefined;

  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seo?.title ?? post.title,
      description: post.seo?.description ?? post.excerpt,
      url: `${siteConfig.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: ogUrl ? [ogUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const readingLabel = readingTimeLabel(post.body);
  const tagSlugs = post.tags.map((t) => t.slug);
  const related = await getRelatedPosts(post.slug, tagSlugs, 3);
  const relatedWithLabels = await Promise.all(
    related.map(async (p) => {
      const detail = await getPostBySlug(p.slug);
      return { post: p, label: detail ? readingTimeLabel(detail.body) : "" };
    }),
  );

  return (
    <>
      <BlogPostContent post={post} readingLabel={readingLabel} />
      {relatedWithLabels.length > 0 && (
        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold">Related Posts</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedWithLabels.map(({ post: p, label }) => (
                <BlogCard key={p._id} post={p} readingLabel={label} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

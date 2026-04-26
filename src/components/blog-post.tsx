import Image from "next/image";
import { Calendar, Clock, User } from "lucide-react";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site-config";
import { PortableText } from "@/components/portable-text";
import { urlForImage } from "@/sanity/image";
import type { PostDetail } from "@/sanity/types";
import { PatreonCtaBlock } from "@/components/portable-text/patreon-cta-block";

export async function BlogPostContent({
  post,
  readingLabel,
}: {
  post: PostDetail;
  readingLabel: string;
}) {
  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(1920).height(1080).auto("format").url()
    : null;
  const ogImage = post.seo?.ogImage ?? post.coverImage;
  const ogUrl = ogImage ? urlForImage(ogImage).width(1200).height(630).url() : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: ogUrl ?? undefined,
          datePublished: post.publishedAt,
          author: {
            "@type": "Person",
            name: post.author.name,
          },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
          },
          mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag._id}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User aria-hidden="true" className="h-4 w-4" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar aria-hidden="true" className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {readingLabel}
            </span>
          </div>
        </header>

        {coverUrl && (
          <Image
            src={coverUrl}
            alt={post.coverImage?.alt ?? post.title}
            width={1920}
            height={1080}
            priority
            className="mb-10 aspect-video w-full rounded-lg object-cover"
          />
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <PortableText value={post.body} />
        </div>

        <PatreonCtaBlock
          value={{
            heading: "Enjoying the saga?",
            body: "Our patrons get behind-the-scenes notes, exclusive session recaps, and early access to every stream.",
            buttonLabel: "Join on Patreon",
          }}
        />
      </article>
    </>
  );
}

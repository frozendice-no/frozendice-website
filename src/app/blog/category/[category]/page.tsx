import type { Metadata } from "next";
import { getAllCategories, getPostsByCategory } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { CategoryFilter } from "@/components/category-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ category: c.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = decodeURIComponent(category);
  return {
    title: `${label} Posts`,
    description: `Browse ${label} articles on the Frozen Dice blog.`,
    alternates: { canonical: `/blog/category/${label}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const label = decodeURIComponent(category);
  const posts = getPostsByCategory(label);
  const allCategories = getAllCategories();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: label, href: `/blog/category/${label}` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {label}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Posts in the {label} category.
          </p>
        </div>

        <div className="mb-8">
          <CategoryFilter
            categories={allCategories}
            activeCategory={label}
          />
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts in this category yet.</p>
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

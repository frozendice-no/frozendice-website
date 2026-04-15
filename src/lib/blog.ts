import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  categories: string[];
  author: string;
  readingTime: string;
  content: string;
};

export type BlogPostMeta = Omit<BlogPost, "content">;

function parseMdxFile(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".mdx");
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    coverImage: data.coverImage ?? "",
    publishedAt: data.publishedAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt,
    tags: data.tags ?? [],
    categories: data.categories ?? [],
    author: data.author ?? "Frozen Dice",
    readingTime: stats.text,
    content,
  };
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { content: _, ...meta } = parseMdxFile(path.join(BLOG_DIR, f));
      return meta;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return parseMdxFile(filePath);
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((p) =>
    p.categories.map((c) => c.toLowerCase()).includes(category.toLowerCase()),
  );
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((p) =>
    p.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()),
  );
}

export function getAllCategories(): string[] {
  const cats = new Set<string>();
  for (const post of getAllPosts()) {
    for (const c of post.categories) cats.add(c);
  }
  return [...cats].sort();
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const t of post.tags) tags.add(t);
  }
  return [...tags].sort();
}

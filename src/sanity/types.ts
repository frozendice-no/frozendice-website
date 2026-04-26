import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";

export type SanityImage = SanityImageSource & {
  alt?: string;
};

export type AuthorRef = {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: SanityImage;
};

export type TagRef = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: SanityImage;
  publishedAt: string;
  featured: boolean;
  tags: TagRef[];
  author: AuthorRef;
};

export type PostDetail = PostCard & {
  body: PortableTextBlock[];
  seo?: {
    title?: string;
    description?: string;
    ogImage?: SanityImage;
  };
};

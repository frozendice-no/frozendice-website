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

// --- Stream schedule singleton ---

export type UpcomingSession = {
  _key: string;
  title: string;
  scheduledAt: string;
  description?: string;
};

export type StreamSchedule = {
  youtubeChannelId: string;
  upcoming?: UpcomingSession[];
};

// --- Featured VODs singleton ---

export type Vod = {
  _key: string;
  youtubeVideoId: string;
  title?: string;
};

export type FeaturedVods = {
  vods: Vod[];
};

// --- Privacy policy singleton ---

export type PrivacyPolicySection = {
  _key: string;
  heading: string;
  body?: PortableTextBlock[];
};

export type PrivacyPolicy = {
  title: string;
  lastUpdated: string;
  intro?: PortableTextBlock[];
  sections?: PrivacyPolicySection[];
  dataControllerName?: string;
  dataControllerOrgNumber?: string;
  dataControllerAddress?: string;
  contactEmail?: string;
};

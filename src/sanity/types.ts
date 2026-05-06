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
  isShort?: boolean;
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

// --- About page ---

export type AboutValue = {
  _key: string;
  icon: string;
  title: string;
  description: string;
};

export type AboutPageSeo = {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
};

export type AboutPage = {
  eyebrow: string;
  headline: string;
  intro: string;
  storyBody: PortableTextBlock[];
  values: AboutValue[];
  businessEmail: string;
  seo?: AboutPageSeo;
};

export type CastMember = {
  _id: string;
  name: string;
  role: "dm" | "player";
  portrait: SanityImage;
  characterName?: string;
  characterClass?: string;
  bio: string;
  isActive: boolean;
  order: number;
};

export type CampaignBlogTag = {
  _id: string;
  name: string;
  slug: string;
};

export type Campaign = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  status: "current" | "upcoming" | "past";
  coverImage: SanityImage;
  startDate?: string;
  endDate?: string;
  youtubePlaylistUrl?: string;
  blogTag?: CampaignBlogTag;
};

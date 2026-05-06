import { client } from "./client";
import type {
  FeaturedVods,
  PostCard,
  PostDetail,
  PrivacyPolicy,
  StreamSchedule,
  TagRef,
} from "./types";

const POST_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage { ..., "alt": coalesce(alt, "") },
  publishedAt,
  featured,
  "tags": tags[]->{ _id, name, "slug": slug.current, description },
  "author": author->{ _id, name, "slug": slug.current, bio, avatar }
`;

const POST_DETAIL_PROJECTION = `
  ${POST_CARD_PROJECTION},
  body,
  seo
`;

export async function getAllPosts(): Promise<PostCard[]> {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) { ${POST_CARD_PROJECTION} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getFeaturedPost(): Promise<PostCard | null> {
  return client.fetch(
    `*[_type == "post" && featured == true && defined(publishedAt)] | order(publishedAt desc) [0] { ${POST_CARD_PROJECTION} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] { ${POST_DETAIL_PROJECTION} }`,
    { slug },
    { next: { tags: ["post"] } },
  );
}

export async function getPostsByTagSlug(tagSlug: string): Promise<PostCard[]> {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt) && $tagSlug in tags[]->slug.current] | order(publishedAt desc) { ${POST_CARD_PROJECTION} }`,
    { tagSlug },
    { next: { tags: ["post", "tag"] } },
  );
}

export async function getAllTags(): Promise<TagRef[]> {
  return client.fetch(
    `*[_type == "tag"] | order(name asc) { _id, name, "slug": slug.current, description }`,
    {},
    { next: { tags: ["tag"] } },
  );
}

// ---------------------------------------------------------------------------
// Phase 4: Stream schedule + featured VODs singletons (used by hero stage 4)
// ---------------------------------------------------------------------------

export async function getStreamSchedule(): Promise<StreamSchedule | null> {
  return client.fetch(
    `*[_type == "streamSchedule"][0] {
      youtubeChannelId,
      "upcoming": upcoming[] {
        _key,
        title,
        scheduledAt,
        description
      }
    }`,
    {},
    { next: { tags: ["streamSchedule"] } },
  );
}

export async function getPrivacyPolicy(): Promise<PrivacyPolicy | null> {
  return client.fetch(
    `*[_type == "privacyPolicy"][0] {
      title,
      lastUpdated,
      intro,
      "sections": sections[] {
        _key,
        heading,
        body
      },
      dataControllerName,
      dataControllerOrgNumber,
      dataControllerAddress,
      contactEmail
    }`,
    {},
    { next: { tags: ["privacyPolicy"] } },
  );
}

export async function getFeaturedVods(): Promise<FeaturedVods | null> {
  return client.fetch(
    `*[_type == "featuredVods"][0] {
      "vods": vods[] {
        _key,
        youtubeVideoId,
        title
      }
    }`,
    {},
    { next: { tags: ["featuredVods"] } },
  );
}

export async function getRelatedPosts(
  slug: string,
  tagSlugs: string[],
  limit = 3,
): Promise<PostCard[]> {
  if (tagSlugs.length === 0) return [];
  return client.fetch(
    `*[_type == "post" && slug.current != $slug && count((tags[]->slug.current)[@ in $tagSlugs]) > 0] | order(publishedAt desc) [0...$limit] { ${POST_CARD_PROJECTION} }`,
    { slug, tagSlugs, limit },
    { next: { tags: ["post"] } },
  );
}

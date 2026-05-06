import { client } from "./client";
import type { AboutPage, Campaign, CastMember } from "./types";

export async function getAboutPage(): Promise<AboutPage | null> {
  return client.fetch(
    `*[_type == "aboutPage"][0] {
      "eyebrow": coalesce(eyebrow, "About"),
      headline,
      intro,
      storyBody,
      values[] {
        _key,
        icon,
        title,
        description
      },
      businessEmail,
      seo
    }`,
    {},
    { next: { tags: ["aboutPage"] } },
  );
}

export async function getActiveCastMembers(): Promise<CastMember[]> {
  return client.fetch(
    `*[_type == "castMember" && isActive == true] | order(order asc) {
      _id,
      name,
      role,
      portrait { ..., "alt": coalesce(alt, "") },
      characterName,
      characterClass,
      bio,
      isActive,
      order
    }`,
    {},
    { next: { tags: ["castMember"] } },
  );
}

export async function getCurrentCampaign(): Promise<Campaign | null> {
  return client.fetch(
    `*[_type == "campaign" && status == "current"] | order(_createdAt asc) [0] {
      _id,
      title,
      "slug": slug.current,
      summary,
      status,
      coverImage { ..., "alt": coalesce(alt, "") },
      startDate,
      endDate,
      youtubePlaylistUrl,
      "blogTag": blogTag->{ _id, name, "slug": slug.current }
    }`,
    {},
    { next: { tags: ["campaign"] } },
  );
}

import { NextResponse } from "next/server";

// Revalidate cached response every 60 seconds. With Next's response caching,
// the YouTube Data API v3 call (100 quota units) only fires once per minute
// per deploy region — well under the 10k unit/day quota.
export const revalidate = 60;

type YouTubeSearchResponse = {
  items?: unknown[];
  error?: { message: string };
};

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  // Missing env: return not-live rather than 500. The LIVE pill hides itself
  // on isLive: false, so the rest of the page degrades gracefully.
  if (!apiKey || !channelId) {
    return NextResponse.json({ isLive: false, error: "env_missing" });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "id");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  let data: YouTubeSearchResponse;
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    data = (await res.json()) as YouTubeSearchResponse;
  } catch {
    return NextResponse.json({ isLive: false, error: "fetch_failed" });
  }

  if (data.error) {
    console.error("YouTube live-status API error:", data.error.message);
    return NextResponse.json({ isLive: false, error: "api_error" });
  }

  const isLive = Array.isArray(data.items) && data.items.length > 0;
  return NextResponse.json({ isLive });
}

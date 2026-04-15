type AnalyticsEvent =
  | { name: "patreon_click" }
  | { name: "youtube_subscribe_click" }
  | { name: "discord_join_click" }
  | { name: "newsletter_signup"; email?: string }
  | { name: "session_video_play"; videoId: string }
  | { name: "store_purchase"; productId: string; value: number; currency: string }
  | { name: "product_view"; productId: string; productName: string }
  | { name: "add_to_cart"; productId: string; value: number };

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: event.name, ...event });
}

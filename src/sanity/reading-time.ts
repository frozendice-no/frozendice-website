import type { PortableTextBlock } from "@portabletext/react";

const WORDS_PER_MINUTE = 200;

function blockText(block: PortableTextBlock): string {
  if (block._type !== "block") return "";
  const children = (block as unknown as { children?: Array<{ text?: string }> }).children ?? [];
  return children.map((c) => c.text ?? "").join(" ");
}

export function readingTimeMinutes(body: PortableTextBlock[] | undefined): number {
  if (!body || body.length === 0) return 1;
  const text = body.map(blockText).join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function readingTimeLabel(body: PortableTextBlock[] | undefined): string {
  const minutes = readingTimeMinutes(body);
  return `${minutes} min read`;
}

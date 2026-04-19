import { createToolOgImage, toolOgImageSize, toolOgImageType } from "@/components/tools/tool-og-image";

export const alt = "Frozen Dice free D&D tools";
export const size = toolOgImageSize;
export const contentType = toolOgImageType;

export default function Image() {
  return createToolOgImage({
    eyebrow: "Free D&D tools",
    title: "Frozen Dice Tools",
    description: "Free online utilities for initiative, names, and session prep.",
  });
}

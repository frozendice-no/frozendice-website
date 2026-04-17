import { createToolOgImage, toolOgImageSize, toolOgImageType } from "@/components/tools/tool-og-image";

export const alt = "Frozen Dice fantasy name generator";
export const size = toolOgImageSize;
export const contentType = toolOgImageType;

export default function Image() {
  return createToolOgImage({
    eyebrow: "D&D inspiration",
    title: "Fantasy Name Generator",
    description: "Character, NPC, and tavern names ready for your next session.",
  });
}

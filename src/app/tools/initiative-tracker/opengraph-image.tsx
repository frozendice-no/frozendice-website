import { createToolOgImage, toolOgImageSize, toolOgImageType } from "@/components/tools/tool-og-image";

export const alt = "Frozen Dice initiative tracker";
export const size = toolOgImageSize;
export const contentType = toolOgImageType;

export default function Image() {
  return createToolOgImage({
    eyebrow: "D&D combat",
    title: "Initiative Tracker",
    description: "Add combatants, sort initiative, and keep battles moving.",
  });
}

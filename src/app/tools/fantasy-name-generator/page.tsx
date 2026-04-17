import type { Metadata } from "next";
import { FantasyNameGenerator } from "@/components/tools/fantasy-name-generator";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

export const metadata: Metadata = {
  title: "Fantasy Name Generator",
  description:
    "Generate fantasy names for D&D characters, NPCs, and taverns. Quick inspiration for dungeon masters and players with race-flavored results.",
  alternates: { canonical: "/tools/fantasy-name-generator" },
};

export default function FantasyNameGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free D&D prep tool"
      title="Fantasy Name Generator"
      description="Generate character names, NPC hooks, and tavern names fast when you need something better than the first placeholder that pops into your head."
      howTo={[
        "Choose whether you need character, NPC, or tavern names.",
        "Set the fantasy flavor for the kind of names you want.",
        "Generate a fresh batch until one fits the scene.",
      ]}
    >
      <FantasyNameGenerator />
    </ToolPageShell>
  );
}

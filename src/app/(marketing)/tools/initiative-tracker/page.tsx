import type { Metadata } from "next";
import { InitiativeTracker } from "@/components/tools/initiative-tracker";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

export const metadata: Metadata = {
  title: "Initiative Tracker",
  description:
    "Track initiative order online for D&D combat. Add combatants, sort the turn order, and keep battles moving on desktop or mobile.",
  alternates: { canonical: "/tools/initiative-tracker" },
};

export default function InitiativeTrackerPage() {
  return (
    <ToolPageShell
      eyebrow="Free D&D combat tool"
      title="Initiative Tracker"
      description="Keep combat clean and fast with a lightweight initiative tracker that lets you add combatants, organize the order, and advance the turn from any device."
      howTo={[
        "Add party members, monsters, or NPCs with initiative values.",
        "Use the active turn banner to see who acts now.",
        "Tap next turn to cycle the encounter order at the table.",
      ]}
    >
      <InitiativeTracker />
    </ToolPageShell>
  );
}

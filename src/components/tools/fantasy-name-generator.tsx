"use client";

import { useMemo, useState } from "react";
import { RefreshCw, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const prefixes = {
  human: ["Al", "Mar", "Ser", "Talia", "Bren", "Cael", "Rhea", "Tor"],
  elf: ["Ae", "Lyth", "Syl", "Vael", "Iria", "Thal", "Eli", "Nae"],
  dwarf: ["Brom", "Dain", "Tor", "Helga", "Orik", "Sigr", "Kara", "Bruni"],
  tiefling: ["Az", "Vex", "Nyx", "Ruin", "Kall", "Zev", "Mora", "Ash"],
};

const suffixes = {
  human: ["ric", "wyn", "ford", "mere", "ian", "ella", "stone", "ard"],
  elf: ["thir", "lora", "driel", "wyn", "sara", "vash", "riel", "nor"],
  dwarf: ["grin", "hild", "bek", "dunn", "drak", "veig", "mund", "rik"],
  tiefling: ["azar", "eth", "vane", "is", "ara", "yx", "ion", "ira"],
};

const tavernStarts = ["The Frozen", "The Lucky", "The Hollow", "The Wandering", "The Sable", "The Crooked"];
const tavernEnds = ["Lantern", "Wyvern", "Stag", "Cask", "Giant", "Fox"];
const npcTitles = ["Keeper", "Warden", "Smuggler", "Seer", "Ranger", "Innkeeper", "Archivist", "Mercenary"];

type GeneratorMode = "character" | "tavern" | "npc";
type Race = keyof typeof prefixes;

export function FantasyNameGenerator() {
  const [mode, setMode] = useState<GeneratorMode>("character");
  const [race, setRace] = useState<Race>("elf");
  const [batch, setBatch] = useState(0);

  const results = useMemo(() => generateNames(mode, race, batch), [mode, race, batch]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText aria-hidden="true" className="h-5 w-5 text-primary" />
              Fresh names on demand
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick a name style, tune the fantasy flavor, and pull a new batch for NPCs, heroes, or taverns.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBatch((value) => value + 1)}
            className={buttonVariants({ size: "sm" })}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Generate
          </button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Generator
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as GeneratorMode)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="character">Character names</option>
                <option value="npc">NPC hooks</option>
                <option value="tavern">Tavern names</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Fantasy flavor
              <select
                value={race}
                onChange={(event) => setRace(event.target.value as Race)}
                disabled={mode === "tavern"}
                className="rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="human">Human</option>
                <option value="elf">Elf</option>
                <option value="dwarf">Dwarf</option>
                <option value="tiefling">Tiefling</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((result) => (
              <div key={result} className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="text-lg font-semibold">{result}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {mode === "tavern"
                    ? "Ready for the next quest hub."
                    : mode === "npc"
                      ? "Drop it into your next improv scene."
                      : "Fits a character sheet or quick NPC pull."}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateNames(mode: GeneratorMode, race: Race, seed: number) {
  if (mode === "tavern") {
    return Array.from({ length: 6 }, () => {
      const start = pick(tavernStarts, seed);
      const end = pick(tavernEnds, seed);
      return `${start} ${end}`;
    });
  }

  if (mode === "npc") {
    return Array.from({ length: 6 }, () => {
      const first = `${pick(prefixes[race], seed)}${pick(suffixes[race], seed)}`;
      return `${pick(npcTitles, seed)} ${first}`;
    });
  }

  return Array.from({ length: 8 }, () => `${pick(prefixes[race], seed)}${pick(suffixes[race], seed)}`);
}

function pick<T>(values: T[], seed: number) {
  const index = (Math.floor(Math.random() * values.length) + seed) % values.length;
  return values[index];
}

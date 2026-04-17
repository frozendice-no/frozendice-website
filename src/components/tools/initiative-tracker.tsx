"use client";

import { useMemo, useState } from "react";
import { Dices, Plus, RotateCcw, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Combatant = {
  id: number;
  name: string;
  initiative: number;
  armorClass: number | null;
  hitPoints: number | null;
  notes: string;
};

export function InitiativeTracker() {
  const [combatants, setCombatants] = useState<Combatant[]>([
    { id: 1, name: "Frost Warden", initiative: 18, armorClass: 15, hitPoints: 36, notes: "Hold the bridge." },
    { id: 2, name: "Mira the Bard", initiative: 16, armorClass: 13, hitPoints: 24, notes: "Inspiration ready." },
    { id: 3, name: "Ice Mephit", initiative: 11, armorClass: 11, hitPoints: 21, notes: "Flyby troublemaker." },
  ]);
  const [activeId, setActiveId] = useState<number>(1);
  const [name, setName] = useState("");
  const [initiative, setInitiative] = useState("");
  const [armorClass, setArmorClass] = useState("");
  const [hitPoints, setHitPoints] = useState("");
  const [notes, setNotes] = useState("");

  const orderedCombatants = useMemo(
    () => [...combatants].sort((left, right) => right.initiative - left.initiative),
    [combatants],
  );

  const activeIndex = orderedCombatants.findIndex((combatant) => combatant.id === activeId);
  const currentCombatant = activeIndex >= 0 ? orderedCombatants[activeIndex] : orderedCombatants[0];

  function rollInitiative() {
    const roll = Math.floor(Math.random() * 20) + 1;
    setInitiative(String(roll));
  }

  function addCombatant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const value = Number(initiative || Math.floor(Math.random() * 20) + 1);
    const nextCombatant: Combatant = {
      id: Date.now(),
      name: name.trim(),
      initiative: Number.isFinite(value) ? value : 10,
      armorClass: armorClass ? Number(armorClass) : null,
      hitPoints: hitPoints ? Number(hitPoints) : null,
      notes: notes.trim(),
    };

    const nextCombatants = [...combatants, nextCombatant].sort(
      (left, right) => right.initiative - left.initiative,
    );

    setCombatants(nextCombatants);
    setActiveId((current) => current ?? nextCombatant.id);
    setName("");
    setInitiative("");
    setArmorClass("");
    setHitPoints("");
    setNotes("");
  }

  function nextTurn() {
    if (orderedCombatants.length === 0) return;
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % orderedCombatants.length : 0;
    setActiveId(orderedCombatants[nextIndex]?.id ?? orderedCombatants[0].id);
  }

  function resetEncounter() {
    setCombatants([]);
    setActiveId(0);
  }

  function removeCombatant(id: number) {
    const nextCombatants = combatants.filter((combatant) => combatant.id !== id);
    setCombatants(nextCombatants);
    if (id === activeId) {
      setActiveId(nextCombatants[0]?.id ?? 0);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Swords aria-hidden="true" className="h-5 w-5 text-primary" />
              Encounter order
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add combatants, sort by initiative, and cycle through turns without paper scraps.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={nextTurn} className={buttonVariants({ size: "sm" })}>
              Next turn
            </button>
            <button
              type="button"
              onClick={resetEncounter}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentCombatant ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Active turn
              </div>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold">{currentCombatant.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Initiative {currentCombatant.initiative}
                    {currentCombatant.armorClass ? ` | AC ${currentCombatant.armorClass}` : ""}
                    {currentCombatant.hitPoints ? ` | HP ${currentCombatant.hitPoints}` : ""}
                  </div>
                </div>
                {currentCombatant.notes ? (
                  <div className="max-w-sm text-sm text-muted-foreground">{currentCombatant.notes}</div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              Add a few combatants to start tracking initiative.
            </div>
          )}

          <div className="grid gap-3">
            {orderedCombatants.map((combatant, index) => (
              <div
                key={combatant.id}
                className={cn(
                  "grid gap-3 rounded-2xl border p-4 transition-colors sm:grid-cols-[auto_1fr_auto]",
                  combatant.id === activeId
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-background",
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{combatant.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Init {combatant.initiative}
                    {combatant.armorClass ? ` | AC ${combatant.armorClass}` : ""}
                    {combatant.hitPoints ? ` | HP ${combatant.hitPoints}` : ""}
                  </div>
                  {combatant.notes ? (
                    <div className="mt-2 text-sm text-muted-foreground">{combatant.notes}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeCombatant(combatant.id)}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "ghost" }),
                    "justify-self-start text-muted-foreground hover:text-foreground sm:justify-self-end",
                  )}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus aria-hidden="true" className="h-5 w-5 text-primary" />
            Add a combatant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={addCombatant}>
            <label className="grid gap-2 text-sm font-medium">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Glacier troll"
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Initiative
              <div className="flex gap-2">
                <input
                  value={initiative}
                  onChange={(event) => setInitiative(event.target.value)}
                  inputMode="numeric"
                  placeholder="14"
                  className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={rollInitiative}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Dices aria-hidden="true" className="h-4 w-4" />
                  Roll
                </button>
              </div>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Armor Class
              <input
                value={armorClass}
                onChange={(event) => setArmorClass(event.target.value)}
                inputMode="numeric"
                placeholder="15"
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Hit Points
              <input
                value={hitPoints}
                onChange={(event) => setHitPoints(event.target.value)}
                inputMode="numeric"
                placeholder="52"
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Notes
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Concentrating on sleet storm"
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className={buttonVariants({ size: "lg" })}>
                Add to tracker
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { getLucideIcon } from "@/lib/lucide-icon";
import type { AboutValue } from "@/sanity/types";

async function ValuePillar({ value }: { value: AboutValue }) {
  const Icon: LucideIcon = await getLucideIcon(value.icon);
  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-6">
      <Icon aria-hidden="true" className="h-8 w-8 text-primary" />
      <h3 className="font-semibold">{value.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {value.description}
      </p>
    </div>
  );
}

export async function ValuesGrid({ values }: { values: AboutValue[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {values.map((v) => (
        <ValuePillar key={v._key} value={v} />
      ))}
    </div>
  );
}

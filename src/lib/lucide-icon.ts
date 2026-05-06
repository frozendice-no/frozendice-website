import type { LucideIcon } from "lucide-react";

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

export async function getLucideIcon(kebabName: string | undefined): Promise<LucideIcon> {
  const pascalName = toPascalCase(kebabName ?? "sparkles");
  const icons = (await import("lucide-react")) as Record<string, unknown>;
  const candidate = icons[pascalName];
  if (typeof candidate === "function" || typeof candidate === "object") {
    return candidate as LucideIcon;
  }
  return icons.Sparkles as LucideIcon;
}

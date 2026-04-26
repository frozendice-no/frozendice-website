import type { Metadata } from "next";
import Link from "next/link";
import { Dice6, ScrollText, Swords } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const tools = [
  {
    href: "/tools/initiative-tracker",
    icon: Swords,
    title: "Initiative Tracker",
    description:
      "Add combatants, sort initiative, and move to the next turn without losing the flow at the table.",
  },
  {
    href: "/tools/fantasy-name-generator",
    icon: ScrollText,
    title: "Fantasy Name Generator",
    description:
      "Spin up memorable character, NPC, and tavern names for fast prep or in-session improvisation.",
  },
];

export const metadata: Metadata = {
  title: "Free D&D Tools",
  description:
    "Free online D&D tools from Frozen Dice, including an initiative tracker and fantasy name generator for faster prep and smoother sessions.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
        ]}
      />

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background py-24 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-2 text-sm font-medium text-primary">
              <Dice6 aria-hidden="true" className="h-4 w-4" />
              Free community tools
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Practical D&D helpers that earn their place in your bookmarks
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Frozen Dice is building a library of free tools for dungeon masters and players.
              Start with quick utilities that remove friction at the table, then jump into the Discord for feedback and new ideas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={siteConfig.social.discord}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Join the Discord
              </Link>
              <Link
                href="/#newsletter"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Get newsletter updates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Start with these table-ready tools</h2>
          <p className="mt-3 text-muted-foreground">
            Every tool runs client-side, works on mobile, and is designed to be useful in the middle of an actual session.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.href} className="border-primary/10 shadow-sm">
              <CardHeader>
                <tool.icon aria-hidden="true" className="mb-3 h-8 w-8 text-primary" />
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription className="text-base">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Free to use, no login, and built for quick decisions when the table is waiting on you.
              </CardContent>
              <CardFooter>
                <Link href={tool.href} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  Open tool
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

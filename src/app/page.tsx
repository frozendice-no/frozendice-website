import Link from "next/link";
import { Map, BookOpen, ShoppingBag, ArrowRight, Dice5 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Map,
    title: "Battle Maps",
    description:
      "High-quality battle maps ready for your virtual tabletop or print-and-play sessions.",
  },
  {
    icon: BookOpen,
    title: "Campaign Resources",
    description:
      "Adventure modules, NPC generators, and lore guides to elevate your campaigns.",
  },
  {
    icon: ShoppingBag,
    title: "Digital Store",
    description:
      "Browse and purchase premium D&D resources — PDFs, maps, and bundles delivered instantly.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-24 sm:py-32 lg:py-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Dice5 className="h-12 w-12 text-primary sm:h-16 sm:w-16" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Roll into Adventure
            </h1>
            <p className="mt-2 text-lg font-medium text-primary/80">
              Norwegian D&amp;D Community &amp; Creator Hub
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Premium battle maps, campaign guides, and tabletop RPG
              resources — crafted by dungeon masters in Norway, built for
              tables everywhere.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/store"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Browse the Store
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blog"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Read the Blog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need at the Table
            </h2>
            <p className="mt-4 text-muted-foreground">
              Resources crafted by dungeon masters, for dungeon masters.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 bg-background shadow-sm"
              >
                <CardHeader>
                  <feature.icon className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Join the Community
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get new battle maps, campaign tips, and exclusive content delivered
              to your inbox.
            </p>
            <NewsletterSignup className="mt-8 mx-auto max-w-md" />
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Dice5, Users, Heart, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Frozen Dice is a Norwegian D&D community creating premium tabletop RPG content — battle maps, campaign guides, and digital resources.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Dice5 aria-hidden="true" className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Frozen Dice
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              A Norwegian community for Dungeons &amp; Dragons enthusiasts,
              building premium content to make every session unforgettable.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Our Story</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  Frozen Dice started as a small group of friends rolling dice
                  around a kitchen table in Norway. What began as homebrew
                  campaigns and hand-drawn maps grew into a passion for creating
                  high-quality tabletop RPG content.
                </p>
                <p>
                  Today we share that passion with the wider D&amp;D community
                  &mdash; from detailed battle maps to complete campaign
                  resources, everything we make is designed to save DMs time and
                  elevate the experience at the table.
                </p>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <MapPin aria-hidden="true" className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Based in Norway</h3>
                <p className="text-sm text-muted-foreground">
                  Creating content inspired by Nordic landscapes and mythology.
                </p>
              </div>
              <div className="space-y-2">
                <Users aria-hidden="true" className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  Built by dungeon masters who play every week and know what
                  tables actually need.
                </p>
              </div>
              <div className="space-y-2">
                <Heart aria-hidden="true" className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Made with Care</h3>
                <p className="text-sm text-muted-foreground">
                  Every map, guide, and resource is crafted and playtested before
                  release.
                </p>
              </div>
              <div className="space-y-2">
                <Dice5 aria-hidden="true" className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Always Rolling</h3>
                <p className="text-sm text-muted-foreground">
                  New content every month &mdash; maps, encounters, and campaign
                  supplements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Get Involved</h2>
            <p className="mt-4 text-muted-foreground">
              Join our community, browse the store, or subscribe for updates.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/store"
                className={buttonVariants({ size: "lg" })}
              >
                Browse the Store
              </Link>
              <Link
                href="/blog"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Read the Blog
              </Link>
            </div>
            <div className="mt-12">
              <h3 className="mb-4 text-lg font-semibold">Stay in the Loop</h3>
              <NewsletterSignup className="mx-auto max-w-md" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

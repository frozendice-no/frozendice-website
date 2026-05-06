import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaStrip() {
  return (
    <div className="rounded-2xl bg-primary/5 px-6 py-12 text-center sm:px-12">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Join the saga
      </h2>
      <p className="mt-4 text-muted-foreground">
        Support the show on Patreon, tune in live, or grab something from the
        shop.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="https://www.patreon.com/FrozenDice"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Become a Patreon
        </a>
        <a
          href="https://www.youtube.com/@FrozenDice_no"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Watch Live
        </a>
        <Link
          href="/store"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Shop
        </Link>
      </div>
    </div>
  );
}

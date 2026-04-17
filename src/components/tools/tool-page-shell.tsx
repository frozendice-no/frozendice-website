import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ToolPageShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  howTo: string[];
  children: ReactNode;
};

export function ToolPageShell({
  title,
  description,
  eyebrow,
  howTo,
  children,
}: ToolPageShellProps) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: title, href: `/tools/${slugify(title)}` },
        ]}
      />

      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.18),transparent_30%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.14),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {eyebrow}
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={siteConfig.social.discord}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Join the Discord
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/#newsletter"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Get tool drops by email
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8 lg:py-16">
        <div>{children}</div>
        <aside>
          <Card className="sticky top-24 border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen aria-hidden="true" className="h-5 w-5 text-primary" />
                How to use it
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {howTo.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

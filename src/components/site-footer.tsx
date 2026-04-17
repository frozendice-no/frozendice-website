import Link from "next/link";
import { Dice5 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { SocialLinks } from "@/components/social-links";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Dice5 aria-hidden="true" className="h-5 w-5 text-primary" />
              Frozen Dice
            </Link>
            <p className="text-sm text-muted-foreground">
              Your Norwegian D&amp;D community for adventures, maps, and digital
              resources.
            </p>
            <SocialLinks className="mt-4" />
          </div>

          <nav aria-label="Footer">
            <h3 className="mb-3 text-sm font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/store" className="hover:text-foreground">Store</Link></li>
              <li><Link href="/tools" className="hover:text-foreground">Tools</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/store" className="hover:text-foreground">Maps &amp; PDFs</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Campaign Tips</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Stay Updated</h3>
            <NewsletterSignup />
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Frozen Dice. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

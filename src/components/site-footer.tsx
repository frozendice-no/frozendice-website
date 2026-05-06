import Link from "next/link";
import { Dice5 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SocialLinks } from "@/components/social-links";
import { ManageCookiesButton } from "@/components/manage-cookies-button";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Dice5 aria-hidden="true" className="h-5 w-5 text-primary" />
              Frozen Dice
            </Link>
            <p className="text-sm text-muted-foreground">
              Nordic D&amp;D streamed live, with a community on Patreon and
              ongoing campaign recaps on the blog.
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
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <ManageCookiesButton className="hover:text-foreground" />
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Bru &amp; Broch AS. All rights
          reserved. Org. nr. 932&nbsp;104&nbsp;822.
        </p>
      </div>
    </footer>
  );
}

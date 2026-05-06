"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCookieConsent } from "./cookie-consent-provider";

export function CookieConsent() {
  const { bannerOpen, accept, decline } = useCookieConsent();

  if (!bannerOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6"
    >
      <p className="text-sm text-muted-foreground">
        We use a small set of cookies and analytics to understand how the site
        is used. Nothing loads until you accept. See our{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>{" "}
        for details.
      </p>
      <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
        <button
          type="button"
          onClick={decline}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setConsent } from "@/app/actions/consent";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CookieConsent({ open }: { open: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function decide(value: "accepted" | "declined") {
    startTransition(async () => {
      await setConsent(value);
      // Re-render the layout so the (server-side) cookie read picks up
      // the new value — this is what conditionally mounts <GoogleTagManager>
      // (or removes it on Decline) without a full page reload.
      router.refresh();
    });
  }

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
          onClick={() => decide("declined")}
          disabled={pending}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          disabled={pending}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

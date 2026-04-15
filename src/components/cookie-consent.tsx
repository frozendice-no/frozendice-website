"use client";

import { useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <p className="text-sm text-muted-foreground">
        We use cookies and analytics to improve your experience. By continuing,
        you agree to our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
        <button
          onClick={decline}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
          )}
        >
          Decline
        </button>
        <button
          onClick={accept}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

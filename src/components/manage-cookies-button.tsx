"use client";

import { useCookieConsent } from "./cookie-consent-provider";

export function ManageCookiesButton({ className }: { className?: string }) {
  const { openBanner } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openBanner}
      className={className}
    >
      Manage cookies
    </button>
  );
}

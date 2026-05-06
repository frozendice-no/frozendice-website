"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clearConsent } from "@/app/actions/consent";

export function ManageCookiesButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await clearConsent();
      // Re-render the layout: with the cookie gone, the banner will mount
      // again so the user can change their mind.
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={className}
    >
      Manage cookies
    </button>
  );
}

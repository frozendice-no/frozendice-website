"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { createCheckoutSession } from "@/app/actions/checkout";

export function CheckoutButton({
  productId,
  productName,
  priceInCents,
}: {
  productId: string;
  productName: string;
  priceInCents: number;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    trackEvent({
      name: "add_to_cart",
      productId,
      value: priceInCents / 100,
    });

    const result = await createCheckoutSession(productId);
    if (result.url) {
      window.location.href = result.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
    >
      {loading ? "Redirecting to checkout..." : `Buy Now — ${productName}`}
    </button>
  );
}

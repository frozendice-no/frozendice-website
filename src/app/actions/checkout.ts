"use server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { siteConfig } from "@/lib/site-config";

export async function createCheckoutSession(
  productId: string,
): Promise<{ url: string | null }> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  const product = rows[0];
  if (!product) return { url: null };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description ?? undefined,
            images: product.imageUrl ? [product.imageUrl] : undefined,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      productId: product.id,
      productSlug: product.slug,
    },
    success_url: `${siteConfig.url}/store/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteConfig.url}/store/${product.slug}`,
  });

  return { url: session.url };
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const productId = session.metadata?.productId;

    if (productId && session.customer_details?.email) {
      const downloadToken = crypto.randomBytes(32).toString("hex");
      const downloadExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      await db.insert(orders).values({
        productId,
        customerEmail: session.customer_details.email,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        amountInCents: session.amount_total ?? 0,
        status: "completed",
        downloadToken,
        downloadExpiresAt,
      });
    }
  }

  return NextResponse.json({ received: true });
}

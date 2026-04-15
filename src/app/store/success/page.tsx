import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Purchase Complete",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let downloadUrl: string | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const orderRows = await db
          .select()
          .from(orders)
          .where(eq(orders.stripeSessionId, session_id))
          .limit(1);

        if (orderRows[0]?.downloadToken) {
          downloadUrl = `/api/download?token=${orderRows[0].downloadToken}`;
        }
      }
    } catch {
      // Session lookup failed — show generic success
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Thank you for your purchase!
      </h1>
      <p className="mt-4 text-muted-foreground">
        Your order has been confirmed. Check your email for a receipt.
      </p>

      {downloadUrl && (
        <div className="mt-8">
          <a
            href={downloadUrl}
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Download Your Files
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Link expires in 7 days.
          </p>
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/store"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Store
        </Link>
      </div>
    </div>
  );
}

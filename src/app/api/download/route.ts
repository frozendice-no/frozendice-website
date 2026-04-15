import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const rows = await db
    .select({
      order: orders,
      fileUrl: products.fileUrl,
      productName: products.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.downloadToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (
    row.order.downloadExpiresAt &&
    new Date() > new Date(row.order.downloadExpiresAt)
  ) {
    return NextResponse.json({ error: "Download link expired" }, { status: 410 });
  }

  if (!row.fileUrl) {
    return NextResponse.json(
      { error: "File not available" },
      { status: 404 },
    );
  }

  await db
    .update(orders)
    .set({ downloadCount: sql`${orders.downloadCount} + 1` })
    .where(eq(orders.id, row.order.id));

  return NextResponse.redirect(row.fileUrl);
}

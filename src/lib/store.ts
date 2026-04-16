import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Product = typeof products.$inferSelect;

const sampleProducts: Product[] = [
  {
    id: "sample-1",
    name: "Frozen North: Starter Campaign Guide",
    slug: "frozen-north-starter-guide",
    description:
      "A 40-page campaign guide set in the frozen reaches of the north. Includes three starter adventures, faction summaries, and a regional map perfect for kicking off a Nordic-themed campaign.",
    priceInCents: 999,
    productType: "pdf",
    imageUrl: null,
    fileUrl: null,
    isPublished: true,
    createdAt: new Date("2026-04-01"),
    updatedAt: new Date("2026-04-01"),
  },
  {
    id: "sample-2",
    name: "Glacier Caverns Battle Map Pack",
    slug: "glacier-caverns-map-pack",
    description:
      "Five high-resolution battle maps depicting icy caverns, frozen lakes, and a frost giant throne room. Gridded and ungridded versions included for VTT and print.",
    priceInCents: 599,
    productType: "map",
    imageUrl: null,
    fileUrl: null,
    isPublished: true,
    createdAt: new Date("2026-04-05"),
    updatedAt: new Date("2026-04-05"),
  },
  {
    id: "sample-3",
    name: "DM Essentials: Nordic Adventures Bundle",
    slug: "dm-essentials-nordic-bundle",
    description:
      "Everything you need for a Nordic D&D campaign in one bundle: the Frozen North campaign guide, the Glacier Caverns map pack, plus 20 custom NPC stat blocks and encounter tables.",
    priceInCents: 1499,
    productType: "bundle",
    imageUrl: null,
    fileUrl: null,
    isPublished: true,
    createdAt: new Date("2026-04-10"),
    updatedAt: new Date("2026-04-10"),
  },
];

export async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isPublished, true));
    return rows.length > 0 ? rows : sampleProducts;
  } catch {
    return sampleProducts;
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (rows[0]) return rows[0];
  } catch {
    // fall through to sample lookup
  }
  return sampleProducts.find((p) => p.slug === slug);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

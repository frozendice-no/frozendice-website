import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { ProductFilter } from "@/components/product-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Browse premium D&D battle maps, campaign PDFs, and content bundles from Frozen Dice.",
  alternates: { canonical: "/store" },
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const allProducts = await getAllProducts();
  const products =
    type && type !== "all"
      ? allProducts.filter((p) => p.productType === type)
      : allProducts;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Store", href: "/store" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Store
          </h1>
          <p className="mt-2 text-muted-foreground">
            Premium D&D battle maps, campaign guides, and content bundles.
          </p>
        </div>

        <div className="mb-8">
          <Suspense>
            <ProductFilter />
          </Suspense>
        </div>

        {products.length === 0 ? (
          <p className="text-muted-foreground">
            No products available yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, formatPrice } from "@/lib/store";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { CheckoutButton } from "@/components/checkout-button";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? `${product.name} — available on Frozen Dice.`,
    alternates: { canonical: `/store/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description ?? undefined,
      url: `${siteConfig.url}/store/${product.slug}`,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.imageUrl ?? undefined,
          url: `${siteConfig.url}/store/${product.slug}`,
          offers: {
            "@type": "Offer",
            price: (product.priceInCents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Store", href: "/store" },
          { name: product.name, href: `/store/${product.slug}` },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          {product.imageUrl && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {product.productType.toUpperCase()}
            </span>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.priceInCents)}
              </span>
            </div>
            <div className="mt-8">
              <CheckoutButton
                productId={product.id}
                productName={product.name}
                priceInCents={product.priceInCents}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

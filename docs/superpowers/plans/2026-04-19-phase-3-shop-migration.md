# Phase 3: Shop Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Drizzle/Neon-backed shop (`src/lib/store.ts`, `sampleProducts`, hand-rolled download tokens in the `orders` table) with a Sanity-backed catalog + Stripe-session-backed digital delivery. Products managed in Sanity Studio; digital files in Vercel Blob; checkout flow unchanged on Stripe's side; fulfillment email sent via Resend with a proxied download URL that verifies payment through the Stripe API instead of a DB token.

**Architecture:** RSC pages query Sanity (`getAllProducts`, `getProductBySlug`) via the same tag-cache pattern used for blog. Buy button calls `createCheckoutSession(productId)` where `productId` is now the Sanity `_id`; server action fetches the product from Sanity and creates a Stripe Checkout session with ad-hoc `price_data` (unchanged). On `checkout.session.completed` webhook, instead of inserting into the `orders` table, we fetch the product from Sanity by the slug stored in Stripe metadata, then send a Resend email containing `/api/download?session_id={session_id}` — a stateless proxy route that re-verifies the Stripe session at click-time before redirecting to the `digitalFile` Vercel Blob URL. Lost-email recovery page looks up paid sessions by customer email via `stripe.checkout.sessions.list()` and re-triggers the email.

**Tech Stack:** Next.js 16 (App Router, RSC), Sanity v5 + `next-sanity`, Stripe v22, Resend + `@react-email/components` (already installed), `@vercel/blob` (added in this phase), TypeScript.

**⚠️ Next.js 16 note:** This version has breaking changes from prior majors. Before touching route handlers, server actions, `generateMetadata`, or metadata API shapes, consult `node_modules/next/dist/docs/` — don't rely on pre-16 knowledge.

---

## Spec reference

This plan implements spec section 4 (Shop page) end-to-end, plus the Vercel Blob portion of section 8 (Asset pipeline). Source: [`docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md`](../specs/2026-04-19-frozendice-redesign-design.md).

**Out of scope** (deferred to later plans):
- Landing page rebuild (Phase 4) — though the featured-products 3-up grid on the landing depends on the `featured` flag we wire up here.
- About page rewrite (Phase 5)
- Removing Drizzle/Neon + the `orders` + `subscribers` + `products` + `blogPosts` tables (Phase 6). The `orders` table stops being written to in this phase but stays in the schema.

## Key decisions locked in the spec

- **No local order rows.** Stripe is the source of truth for "did they pay?" We keep the DB `orders` table for one more phase (removed in 6) but stop writing to it in Phase 3.
- **Download URLs are session-verified, not token-based.** The `/api/download` endpoint accepts `?session_id=cs_xxx`, looks up the Stripe session, confirms it's paid, resolves the product's `digitalFile` via Sanity, and redirects. No random tokens, no expiry columns.
- **Vercel Blob stores digital files** via its Native integration (like the Sanity integration we used in Phase 1). The user creates a Blob store in Vercel → `BLOB_READ_WRITE_TOKEN` is auto-injected into env. Editors upload files manually into Blob and paste the resulting URL into the Sanity product's `digitalFile` field.
- **No catalog migration script.** The existing `sampleProducts` in `src/lib/store.ts` is placeholder data with empty `fileUrl` — nothing of real value to preserve. A fresh test product gets created in Sanity Studio during implementation (Task 19). Real catalog is built post-phase.
- **`formatPrice` helper extracted** to `src/sanity/format.ts` so it can be shared across store, checkout, email template, and future landing-page components without dragging `src/lib/store.ts` along.

---

## File structure

### Created

```
src/sanity/
  format.ts                                    # formatPrice helper (moved from lib/store.ts)
src/lib/email/
  purchase-confirmation.tsx                    # React Email template
src/app/(marketing)/store/recover/
  page.tsx                                     # "lost your download email?" form
src/app/actions/
  resend-download.ts                           # server action for the recover page
```

### Modified

```
src/sanity/
  types.ts                                     # add ProductCard, ProductDetail
  queries.ts                                   # add product queries
src/components/
  product-card.tsx                             # Sanity shape
  product-filter.tsx                           # minor tweaks (URL-driven, still works)
  checkout-button.tsx                          # productId now Sanity _id (compatible signature)
src/app/(marketing)/store/
  page.tsx                                     # Sanity-sourced + sort
  [slug]/page.tsx                              # Sanity-sourced + Portable Text longDescription
  success/page.tsx                             # drop DB lookup; show "check your email"
src/app/actions/checkout.ts                    # read product from Sanity
src/app/api/webhooks/stripe/route.ts           # send download email; stop inserting orders
src/app/api/download/route.ts                  # Stripe-session-based verification
src/app/sitemap.ts                             # include product URLs
.env.example                                    # document BLOB_READ_WRITE_TOKEN
package.json                                    # add @vercel/blob
```

### Deleted (once migration verified)

```
src/lib/store.ts                               # replaced by Sanity queries + format.ts
```

---

## Task 1: User — create Vercel Blob store (external)

This is **external to the codebase** — the user does it in Vercel.

- [ ] **Step 1:** In the Vercel dashboard for project `frozendice-website`, go to **Storage** → **Create Database** → **Blob**. Name it `frozendice-digital-files` (or similar).
- [ ] **Step 2:** Confirm `BLOB_READ_WRITE_TOKEN` appears in **Settings → Environment Variables** across Production, Preview, and Development.
- [ ] **Step 3:** Run `vercel env pull .env.local` locally and confirm `BLOB_READ_WRITE_TOKEN` is now in `.env.local`.
- [ ] **Step 4:** No commit needed — this is an external configuration task.

---

## Task 2: Install `@vercel/blob`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1:** Install

```bash
pnpm add @vercel/blob
```

- [ ] **Step 2:** Verify

`grep '"@vercel/blob"' package.json` shows a version in `dependencies`.

- [ ] **Step 3:** Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @vercel/blob for digital product file storage"
```

---

## Task 3: Document `BLOB_READ_WRITE_TOKEN` in `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1:** Replace the commented-out `BLOB_READ_WRITE_TOKEN` section at the bottom of `.env.example` with:

```bash
# --- Vercel Blob (auto-injected by Vercel Native Blob integration) ---
# Create a Blob store in the Vercel dashboard; token injects automatically.
BLOB_READ_WRITE_TOKEN=""
```

(The line was previously commented out with `# BLOB_READ_WRITE_TOKEN=""` — replace that section.)

- [ ] **Step 2:** Commit

```bash
git add .env.example
git commit -m "chore: document BLOB_READ_WRITE_TOKEN"
```

---

## Task 4: Add product types to `src/sanity/types.ts`

**Files:**
- Modify: `src/sanity/types.ts`

- [ ] **Step 1:** Append the following types to the end of `src/sanity/types.ts` (keep all existing types — `SanityImage`, `AuthorRef`, `TagRef`, `PostCard`, `PostDetail` — intact):

```typescript
export type ProductType = "pdf" | "map" | "bundle" | "physical" | "other";

export type ProductCard = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  currency: string;
  productType: ProductType;
  heroImage: SanityImage;
  featured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  tags: TagRef[];
};

export type ProductDetail = ProductCard & {
  longDescription?: PortableTextBlock[];
  gallery?: SanityImage[];
  digitalFile?: string;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: SanityImage;
  };
};
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/sanity/types.ts
git commit -m "feat(sanity): add Product types"
```

---

## Task 5: Add product queries to `src/sanity/queries.ts`

**Files:**
- Modify: `src/sanity/queries.ts`

- [ ] **Step 1:** At the top of `src/sanity/queries.ts`, add `ProductCard, ProductDetail` to the existing `import type` line from `"./types"`. The line should read:

```typescript
import type { PostCard, PostDetail, ProductCard, ProductDetail, TagRef } from "./types";
```

- [ ] **Step 2:** Append the following queries at the end of the file:

```typescript
const PRODUCT_CARD_PROJECTION = `
  _id,
  name,
  "slug": slug.current,
  description,
  priceInCents,
  currency,
  productType,
  heroImage { ..., "alt": coalesce(alt, "") },
  featured,
  isPublished,
  publishedAt,
  "tags": tags[]->{ _id, name, "slug": slug.current, description }
`;

const PRODUCT_DETAIL_PROJECTION = `
  ${PRODUCT_CARD_PROJECTION},
  longDescription,
  gallery[] { ..., "alt": coalesce(alt, "") },
  digitalFile,
  seo
`;

export async function getAllProducts(): Promise<ProductCard[]> {
  return client.fetch(
    `*[_type == "product" && isPublished == true] | order(coalesce(publishedAt, _createdAt) desc) { ${PRODUCT_CARD_PROJECTION} }`,
    {},
    { next: { tags: ["product"] } },
  );
}

export async function getFeaturedProducts(limit = 3): Promise<ProductCard[]> {
  return client.fetch(
    `*[_type == "product" && isPublished == true && featured == true] | order(coalesce(publishedAt, _createdAt) desc) [0...$limit] { ${PRODUCT_CARD_PROJECTION} }`,
    { limit },
    { next: { tags: ["product"] } },
  );
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return client.fetch(
    `*[_type == "product" && slug.current == $slug][0] { ${PRODUCT_DETAIL_PROJECTION} }`,
    { slug },
    { next: { tags: ["product"] } },
  );
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  return client.fetch(
    `*[_type == "product" && _id == $id][0] { ${PRODUCT_DETAIL_PROJECTION} }`,
    { id },
    { next: { tags: ["product"] } },
  );
}
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add src/sanity/queries.ts
git commit -m "feat(sanity): add product queries"
```

---

## Task 6: Create price-formatting helper

**Files:**
- Create: `src/sanity/format.ts`

- [ ] **Step 1:** Create with this exact content:

```typescript
const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toLowerCase();
  let f = CURRENCY_FORMATTERS.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: key.toUpperCase(),
    });
    CURRENCY_FORMATTERS.set(key, f);
  }
  return f;
}

export function formatPrice(cents: number, currency = "usd"): string {
  return getFormatter(currency).format(cents / 100);
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/sanity/format.ts
git commit -m "feat(sanity): add price formatter helper"
```

---

## Task 7: Rewrite `ProductCard` for Sanity shape

**Files:**
- Modify: `src/components/product-card.tsx`

- [ ] **Step 1:** Replace file contents with:

```tsx
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlForImage } from "@/sanity/image";
import { formatPrice } from "@/sanity/format";
import type { ProductCard as ProductCardType } from "@/sanity/types";

const typeBadgeColors: Record<string, string> = {
  pdf: "bg-blue-500/10 text-blue-600",
  map: "bg-green-500/10 text-green-600",
  bundle: "bg-purple-500/10 text-purple-600",
  physical: "bg-amber-500/10 text-amber-600",
  other: "bg-gray-500/10 text-gray-600",
};

export function ProductCard({ product }: { product: ProductCardType }) {
  const heroUrl = urlForImage(product.heroImage).width(640).height(480).auto("format").url();

  return (
    <Link href={`/store/${product.slug}`} className="group">
      <Card className="h-full border-0 bg-muted/30 transition-colors group-hover:bg-muted/50">
        <div className="overflow-hidden rounded-t-lg">
          <Image
            src={heroUrl}
            alt={product.heroImage.alt ?? product.name}
            width={640}
            height={480}
            className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColors[product.productType] ?? typeBadgeColors.other}`}
            >
              {product.productType.toUpperCase()}
            </span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.priceInCents, product.currency)}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">{product.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

Expected errors in `/store/page.tsx`, `/store/[slug]/page.tsx` (still import old `Product` shape from `@/lib/store`). Fixed in Tasks 9 and 10.

- [ ] **Step 3:** Commit

```bash
git add src/components/product-card.tsx
git commit -m "feat(store): rewrite ProductCard against Sanity types"
```

---

## Task 8: Update `ProductFilter` to include `physical` type

**Files:**
- Modify: `src/components/product-filter.tsx`

This component is mostly fine — it's URL-driven and reads/writes `?type=`. Only tweak: add `physical` to the list of product types so the Sanity-schema option is available.

- [ ] **Step 1:** Replace the `productTypes` array:

```tsx
const productTypes = ["all", "pdf", "map", "bundle", "physical"] as const;
```

(That's the only line change — the rest of the file stays.)

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors introduced (existing errors carry over).

- [ ] **Step 3:** Commit

```bash
git add src/components/product-filter.tsx
git commit -m "feat(store): add physical type to ProductFilter"
```

---

## Task 9: Rewrite `/store` listing page

**Files:**
- Modify: `src/app/(marketing)/store/page.tsx`

- [ ] **Step 1:** Replace file contents with:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/sanity/queries";
import { ProductCard } from "@/components/product-card";
import { ProductFilter } from "@/components/product-filter";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Browse premium D&D battle maps, campaign PDFs, and content bundles from Frozen Dice.",
  alternates: { canonical: "/store" },
};

type SortKey = "newest" | "price-asc" | "price-desc";

function sortProducts<T extends { priceInCents: number; publishedAt: string | null }>(
  products: T[],
  sort: SortKey,
): T[] {
  const out = [...products];
  if (sort === "price-asc") out.sort((a, b) => a.priceInCents - b.priceInCents);
  else if (sort === "price-desc") out.sort((a, b) => b.priceInCents - a.priceInCents);
  // "newest" is already the query order — no-op
  return out;
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const { type, sort: sortParam } = await searchParams;
  const sort: SortKey =
    sortParam === "price-asc" || sortParam === "price-desc" ? sortParam : "newest";

  const allProducts = await getAllProducts();
  const filtered =
    type && type !== "all"
      ? allProducts.filter((p) => p.productType === type)
      : allProducts;
  const products = sortProducts(filtered, sort);

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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Store</h1>
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
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

Sort control is deferred to a future polish pass — the `sort` searchParam is read and applied, but there's no UI dropdown yet. Tag-chip type filter covers the bulk of the UX need.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

Remaining expected errors in `/store/[slug]/page.tsx`, `src/app/actions/checkout.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/download/route.ts`, `src/app/(marketing)/store/success/page.tsx` — all fixed in later tasks.

- [ ] **Step 3:** Commit

```bash
git add "src/app/(marketing)/store/page.tsx"
git commit -m "feat(store): rewrite /store listing against Sanity"
```

---

## Task 10: Rewrite `/store/[slug]` detail page

**Files:**
- Modify: `src/app/(marketing)/store/[slug]/page.tsx`

- [ ] **Step 1:** Replace file contents with:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/sanity/queries";
import { formatPrice } from "@/sanity/format";
import { urlForImage } from "@/sanity/image";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { CheckoutButton } from "@/components/checkout-button";
import { PortableText } from "@/components/portable-text";
import { siteConfig } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const ogImage = product.seo?.ogImage ?? product.heroImage;
  const ogUrl = ogImage ? urlForImage(ogImage).width(1200).height(630).url() : undefined;

  return {
    title: product.seo?.title ?? product.name,
    description: product.seo?.description ?? product.description,
    alternates: { canonical: `/store/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.seo?.title ?? product.name,
      description: product.seo?.description ?? product.description,
      url: `${siteConfig.url}/store/${product.slug}`,
      images: ogUrl ? [ogUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const heroUrl = urlForImage(product.heroImage).width(960).height(720).auto("format").url();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: heroUrl,
          url: `${siteConfig.url}/store/${product.slug}`,
          offers: {
            "@type": "Offer",
            price: (product.priceInCents / 100).toFixed(2),
            priceCurrency: product.currency.toUpperCase(),
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
          <div className="overflow-hidden rounded-lg">
            <Image
              src={heroUrl}
              alt={product.heroImage.alt ?? product.name}
              width={960}
              height={720}
              priority
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {product.productType.toUpperCase()}
            </span>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-4 text-muted-foreground">{product.description}</p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.priceInCents, product.currency)}
              </span>
            </div>
            <div className="mt-8">
              <CheckoutButton
                productId={product._id}
                productName={product.name}
                priceInCents={product.priceInCents}
              />
            </div>
          </div>
        </div>

        {product.longDescription && product.longDescription.length > 0 && (
          <div className="prose prose-neutral dark:prose-invert mt-12 max-w-none">
            <PortableText value={product.longDescription} />
          </div>
        )}
      </div>
    </>
  );
}
```

Note: removed the old `export const dynamic = "force-dynamic"`. The detail page becomes statically generated via `generateStaticParams` with Sanity-tag-based revalidation. No mutation requires dynamic rendering.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

Remaining expected errors in checkout action, webhook, download route, success page — fixed later.

- [ ] **Step 3:** Commit

```bash
git add "src/app/(marketing)/store/[slug]/page.tsx"
git commit -m "feat(store): rewrite /store/[slug] against Sanity"
```

---

## Task 11: Rewrite `createCheckoutSession` for Sanity

**Files:**
- Modify: `src/app/actions/checkout.ts`

- [ ] **Step 1:** Replace file contents with:

```typescript
"use server";

import { stripe } from "@/lib/stripe";
import { getProductById } from "@/sanity/queries";
import { urlForImage } from "@/sanity/image";
import { siteConfig } from "@/lib/site-config";

export async function createCheckoutSession(
  productId: string,
): Promise<{ url: string | null }> {
  const product = await getProductById(productId);
  if (!product) return { url: null };

  const heroUrl = urlForImage(product.heroImage).width(1200).height(900).url();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: [heroUrl],
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      productId: product._id,
      productSlug: product.slug,
    },
    success_url: `${siteConfig.url}/store/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteConfig.url}/store/${product.slug}`,
  });

  return { url: session.url };
}
```

Key changes from the old version:
- Reads from Sanity (`getProductById`) instead of Drizzle `products` table.
- `productId` is now a Sanity `_id` string (e.g. `drafts.xxx` in Studio or a proper ID on publish). Stripe metadata holds it as-is.
- `currency` comes from the product (so we can sell in NOK/EUR later without code changes).
- `images` now goes through `urlForImage` to produce a properly-sized Sanity CDN URL.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

Remaining expected errors in Stripe webhook, download route, success page — fixed later.

- [ ] **Step 3:** Commit

```bash
git add src/app/actions/checkout.ts
git commit -m "feat(store): source product data from Sanity in checkout action"
```

---

## Task 12: Purchase-confirmation email template

**Files:**
- Create: `src/lib/email/purchase-confirmation.tsx`

- [ ] **Step 1:** Create with this exact content:

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  productName: string;
  amountFormatted: string;
  downloadUrl: string;
  siteUrl: string;
};

export function PurchaseConfirmationEmail({
  productName,
  amountFormatted,
  downloadUrl,
  siteUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Your download for {productName} is ready.
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Thanks for your purchase!</Heading>
          <Text style={paragraphStyle}>
            You bought <strong>{productName}</strong> for {amountFormatted}. Your
            download is ready below.
          </Text>

          <Section style={buttonSection}>
            <Button style={buttonStyle} href={downloadUrl}>
              Download {productName}
            </Button>
          </Section>

          <Text style={paragraphStyle}>
            Lost this email? You can re-request the download link at{" "}
            <a href={`${siteUrl}/store/recover`}>{siteUrl}/store/recover</a>.
          </Text>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            FrozenDice —{" "}
            <a href={siteUrl} style={footerLinkStyle}>
              {siteUrl}
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = { backgroundColor: "#f6f6f6", fontFamily: "system-ui, sans-serif" };
const containerStyle = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px", backgroundColor: "#ffffff" };
const headingStyle = { fontSize: "24px", fontWeight: 700, color: "#111" };
const paragraphStyle = { fontSize: "16px", lineHeight: 1.6, color: "#333" };
const buttonSection = { margin: "32px 0", textAlign: "center" as const };
const buttonStyle = {
  backgroundColor: "#111",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 600,
};
const hrStyle = { borderColor: "#e5e5e5", margin: "32px 0 16px" };
const footerStyle = { fontSize: "12px", color: "#666" };
const footerLinkStyle = { color: "#666", textDecoration: "underline" };
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/lib/email/purchase-confirmation.tsx
git commit -m "feat(email): add purchase confirmation email template"
```

---

## Task 13: Rewrite Stripe webhook to send email

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1:** Replace file contents with:

```typescript
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { getProductBySlug } from "@/sanity/queries";
import { formatPrice } from "@/sanity/format";
import { siteConfig } from "@/lib/site-config";
import { PurchaseConfirmationEmail } from "@/lib/email/purchase-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "FrozenDice <no-reply@frozendice.no>";

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
    const productSlug = session.metadata?.productSlug;
    const email = session.customer_details?.email;

    if (!productSlug || !email) {
      console.warn("Stripe webhook: missing productSlug or email in session", session.id);
      return NextResponse.json({ received: true });
    }

    const product = await getProductBySlug(productSlug);
    if (!product) {
      console.error("Stripe webhook: Sanity product not found for slug", productSlug);
      return NextResponse.json({ received: true });
    }

    const downloadUrl = `${siteConfig.url}/api/download?session_id=${session.id}`;
    const amountFormatted = formatPrice(
      session.amount_total ?? product.priceInCents,
      product.currency,
    );

    try {
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: `Your download: ${product.name}`,
        react: PurchaseConfirmationEmail({
          productName: product.name,
          amountFormatted,
          downloadUrl,
          siteUrl: siteConfig.url,
        }),
      });
    } catch (err) {
      console.error("Stripe webhook: Resend send failed", err);
    }
  }

  return NextResponse.json({ received: true });
}
```

Notable deletions:
- No more `db.insert(orders)` call.
- No `downloadToken` generation.
- No `downloadExpiresAt` calculation.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors should remain related to this file.

- [ ] **Step 3:** Commit

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(store): send Resend email on checkout completion, drop DB order row"
```

---

## Task 14: Rewrite `/api/download` as Stripe-session-verified proxy

**Files:**
- Modify: `src/app/api/download/route.ts`

- [ ] **Step 1:** Replace file contents with:

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProductBySlug } from "@/sanity/queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 404 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const productSlug = session.metadata?.productSlug;
  if (!productSlug) {
    return NextResponse.json({ error: "Missing product reference" }, { status: 404 });
  }

  const product = await getProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.digitalFile) {
    return NextResponse.json(
      { error: "This product has no downloadable file" },
      { status: 404 },
    );
  }

  return NextResponse.redirect(product.digitalFile);
}
```

Downstream behavior:
- 400 — no `session_id` provided
- 402 — payment not yet paid (e.g. still processing, async bank transfer)
- 404 — session doesn't exist, metadata missing, product not found, or no file on the product
- 307 redirect — success

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/app/api/download/route.ts
git commit -m "feat(store): rewrite /api/download to verify via Stripe session"
```

---

## Task 15: Rewrite success page

**Files:**
- Modify: `src/app/(marketing)/store/success/page.tsx`

- [ ] **Step 1:** Replace file contents with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { stripe } from "@/lib/stripe";
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

  let paid = false;
  let customerEmail: string | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      customerEmail = session.customer_details?.email ?? null;
    } catch {
      // Session lookup failed — fall through to generic success
    }
  }

  const downloadUrl = session_id ? `/api/download?session_id=${session_id}` : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Thank you for your purchase!
      </h1>
      <p className="mt-4 text-muted-foreground">
        {customerEmail
          ? `A download link has been sent to ${customerEmail}.`
          : "A download link has been sent to your email."}
      </p>

      {paid && downloadUrl && (
        <div className="mt-8">
          <a href={downloadUrl} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            Download now
          </a>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/store/recover"
          className="text-sm text-muted-foreground underline"
        >
          Didn&apos;t get the email? Re-send it.
        </Link>
        <Link href="/store" className={buttonVariants({ variant: "outline" })}>
          Back to Store
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add "src/app/(marketing)/store/success/page.tsx"
git commit -m "feat(store): simplify success page; drop DB lookup"
```

---

## Task 16: Lost-email recovery action

**Files:**
- Create: `src/app/actions/resend-download.ts`

- [ ] **Step 1:** Create with this exact content:

```typescript
"use server";

import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { getProductBySlug } from "@/sanity/queries";
import { formatPrice } from "@/sanity/format";
import { siteConfig } from "@/lib/site-config";
import { PurchaseConfirmationEmail } from "@/lib/email/purchase-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "FrozenDice <no-reply@frozendice.no>";

export async function resendDownloadEmail(
  email: string,
): Promise<{ ok: boolean; count: number; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { ok: false, count: 0, message: "Please enter a valid email address." };
  }

  let sessions;
  try {
    const result = await stripe.checkout.sessions.list({
      limit: 20,
      customer_details: { email: trimmed },
    } as Parameters<typeof stripe.checkout.sessions.list>[0]);
    sessions = result.data.filter((s) => s.payment_status === "paid");
  } catch {
    return { ok: false, count: 0, message: "Could not look up your orders. Try again later." };
  }

  if (sessions.length === 0) {
    // Deliberately vague — don't confirm whether an email has orders or not.
    return {
      ok: true,
      count: 0,
      message: "If you have any completed purchases, a link has been sent to that address.",
    };
  }

  let sent = 0;
  for (const session of sessions) {
    const productSlug = session.metadata?.productSlug;
    if (!productSlug) continue;
    const product = await getProductBySlug(productSlug);
    if (!product) continue;

    const downloadUrl = `${siteConfig.url}/api/download?session_id=${session.id}`;
    const amountFormatted = formatPrice(
      session.amount_total ?? product.priceInCents,
      product.currency,
    );

    try {
      await resend.emails.send({
        from: fromAddress,
        to: trimmed,
        subject: `Your download: ${product.name} (re-sent)`,
        react: PurchaseConfirmationEmail({
          productName: product.name,
          amountFormatted,
          downloadUrl,
          siteUrl: siteConfig.url,
        }),
      });
      sent++;
    } catch (err) {
      console.error("resend-download: send failed", err);
    }
  }

  return {
    ok: true,
    count: sent,
    message: `Re-sent ${sent} download link${sent === 1 ? "" : "s"} to ${trimmed}.`,
  };
}
```

Note: `stripe.checkout.sessions.list` does not accept `customer_details.email` as a native filter in current Stripe API. The cast `as Parameters<...>[0]` suppresses the type mismatch; the list is filtered in-memory afterward. If the implementer finds that list returns all paid sessions unfiltered, add an explicit `.filter((s) => s.customer_details?.email?.toLowerCase() === trimmed)` step.

**Privacy note:** the response is deliberately vague about whether an email had orders or not. Prevents enumeration of customer emails.

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/app/actions/resend-download.ts
git commit -m "feat(store): add resend-download server action for lost-email recovery"
```

---

## Task 17: Recovery page

**Files:**
- Create: `src/app/(marketing)/store/recover/page.tsx`

- [ ] **Step 1:** Create with this exact content:

```tsx
import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = {
  title: "Resend download link",
  description: "Lost your FrozenDice purchase email? Re-request your download link.",
  robots: { index: false, follow: false },
};

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Resend download link</h1>
      <p className="mt-4 text-muted-foreground">
        Enter the email address you used at checkout. We&apos;ll send any active
        download links for completed purchases to that address.
      </p>
      <div className="mt-8">
        <RecoverForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Create the client component `src/app/(marketing)/store/recover/recover-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resendDownloadEmail } from "@/app/actions/resend-download";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await resendDownloadEmail(email);
    setMessage(result.message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 block w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className={cn(buttonVariants(), "w-full")}
      >
        {loading ? "Sending..." : "Resend download links"}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 4:** Commit

```bash
git add "src/app/(marketing)/store/recover"
git commit -m "feat(store): add lost-email recovery page"
```

---

## Task 18: Include products in sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1:** Add the imports and product entries. Replace the current file contents with:

```typescript
import type { MetadataRoute } from "next";
import { getAllPosts, getAllProducts, getAllTags } from "@/sanity/queries";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags, products] = await Promise.all([
    getAllPosts(),
    getAllTags(),
    getAllProducts(),
  ]);

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${siteConfig.url}/blog/tag/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteConfig.url}/store/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/store`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...blogEntries,
    ...tagEntries,
    ...productEntries,
  ];
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/app/sitemap.ts
git commit -m "feat(store): include product URLs in sitemap"
```

---

## Task 19: Delete `src/lib/store.ts`

**Files:**
- Delete: `src/lib/store.ts`

- [ ] **Step 1:** Confirm no remaining consumers

```bash
grep -r "@/lib/store" src/ scripts/ 2>/dev/null
```

Expected: no output (zero matches). If anything still imports from `@/lib/store`, BLOCK and report before deleting.

- [ ] **Step 2:** Delete

```bash
git rm src/lib/store.ts
```

- [ ] **Step 3:** Typecheck

```bash
pnpm tsc --noEmit
```

No errors.

- [ ] **Step 4:** Commit

```bash
git add src/lib/store.ts
git commit -m "refactor(store): retire lib/store.ts (replaced by Sanity queries)"
```

---

## Task 20: Seed one test product in Sanity Studio (external)

- [ ] **Step 1:** Start dev server

```bash
pnpm dev
```

- [ ] **Step 2:** Open `http://localhost:3000/studio`, log in with GitHub/Google/email (not Vercel). Navigate to **Product** in the sidebar, click **Create new Product**.
- [ ] **Step 3:** Fill in:
  - Name: `Test — Frozen North Starter Guide`
  - Slug: auto-generate
  - Short description: `A 40-page campaign guide — test listing.`
  - Price (in cents): `999`
  - Currency: `usd`
  - Product type: `pdf`
  - Hero image: upload any placeholder image from disk
  - Digital file URL (Vercel Blob): leave empty for now (tests the "no file" path). After verifying the rest of the flow, optionally upload a test PDF to Blob via `vercel blob put test.pdf` or the Vercel dashboard and paste the resulting URL.
  - `isPublished: true`
  - `featured: false`
- [ ] **Step 4:** Publish the document.
- [ ] **Step 5:** Verify via GROQ in the Vision tool:

```groq
*[_type == "product" && isPublished == true]
```

Should return exactly 1 document.

- [ ] **Step 6:** No commit — external content.

---

## Task 21: End-to-end smoke test

**Files:** None modified.

- [ ] **Step 1:** With dev server running, visit `http://localhost:3000/store`. Expected: 1 product card ("Test — Frozen North Starter Guide"). Type chips work; clicking "PDF" leaves the product visible, "MAP" empties the grid.
- [ ] **Step 2:** Click the product. Detail page renders: hero image, price `$9.99`, PDF badge, description. Buy Now button present.
- [ ] **Step 3:** Click **Buy Now**. Stripe Checkout opens in test mode (requires `STRIPE_SECRET_KEY` starting with `sk_test_`). Use `4242 4242 4242 4242` / any future date / any CVC / any ZIP. Complete the purchase.
- [ ] **Step 4:** You're redirected to `/store/success?session_id=cs_test_...`. Verify: "Thank you..." and "A download link has been sent to <your-email>."
- [ ] **Step 5:** Check the Stripe Dashboard (test mode) Events log for `checkout.session.completed`. In Vercel / local dev logs, confirm the webhook route was hit and the Resend send attempt occurred. Note: local webhook delivery requires **stripe CLI forwarding** — run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in a second terminal while testing. Copy the `whsec_...` it prints and set as your local `STRIPE_WEBHOOK_SECRET` (or use the existing one if it matches).
- [ ] **Step 6:** Check your inbox. If Resend is configured and `RESEND_FROM_EMAIL` is a verified sender, the email arrives with a "Download" button linking to `/api/download?session_id=cs_test_...`.
- [ ] **Step 7:** Click the download link. Because the test product has no `digitalFile`, the route returns 404 with `{"error": "This product has no downloadable file"}` — **this is expected**. Optionally upload a test file to Vercel Blob, paste the URL into the Sanity product's `digitalFile` field, publish, then retry — the link should 307-redirect to the Blob URL.
- [ ] **Step 8:** Visit `/store/recover`, submit your email. The response message should confirm a link was sent (privacy-preserving wording). Verify a second email arrives with the same `session_id`.
- [ ] **Step 9:** If any step fails, STOP and investigate. Do not proceed to Phase 4 until the full round-trip works.
- [ ] **Step 10:** No commit — verification task.

---

## Definition of Done (Phase 3)

Phase 3 is complete when all of these are true:

1. `pnpm tsc --noEmit` is clean.
2. `pnpm dev` starts with no compile errors. `/store`, `/store/[slug]`, `/store/success`, `/store/recover` all render.
3. At least one Sanity `product` document exists and appears on `/store`.
4. Completing a Stripe test checkout for that product triggers the webhook, which sends a Resend email containing `/api/download?session_id=...`.
5. That download URL, when the product has a `digitalFile`, redirects to the Blob URL. When it doesn't, returns a clear 404 with a message.
6. `/store/recover` works: submitting an email that has a paid session triggers a re-send; submitting an email without orders returns a vague success message (no leakage).
7. `src/lib/store.ts` and `sampleProducts` no longer exist.
8. `src/app/api/webhooks/stripe/route.ts` does **not** import `orders` or any DB helper.
9. The `/blog` experience from Phase 2 is **unaffected** by Phase 3 (smoke-check: listing, one post detail, tag archive still load).
10. Sitemap now includes product URLs.

---

## Self-review notes

**Spec coverage:**
- §4 routes (`/store`, `/store/[slug]`, `/store/success`) — Tasks 9, 10, 15 ✓
- §4 listing layout (hero strip, chip filter, grid) — Task 9 ✓
- §4 detail layout (gallery, name/price/badge, description, long-desc Portable Text, Buy button) — Task 10 ✓
- §4 Sanity `product` schema — reused from Phase 1 (no new task)
- §4 rendering strategy (RSC + `generateStaticParams` + tag cache + `generateMetadata`) — Tasks 9, 10 ✓
- §4 checkout flow (server action → Stripe price_data → webhook → Resend → signed download URL → stateless recover) — Tasks 11, 13, 14, 16, 17 ✓
- §4 explicitly-not-doing (no cart, no accounts, no search, no reviews) — honored; no extraneous tasks
- §8 Vercel Blob integration — Tasks 1, 2, 3 ✓

**Placeholder scan:** No TBDs. One deliberate vagueness: Task 16 acknowledges that Stripe's `checkout.sessions.list` filtering semantics have shifted and includes a fallback `.filter(...)` instruction if the first form returns unfiltered results. That's guidance, not a placeholder.

**Type consistency:**
- `ProductCard`, `ProductDetail` defined in Task 4; consumed in Tasks 5, 7, 9, 10.
- `formatPrice(cents, currency)` signature in Task 6; consumed consistently in Tasks 7, 10, 13, 16.
- `productId` argument to `createCheckoutSession` is always a Sanity `_id` string. `productSlug` always flows through Stripe session metadata.

**Non-goals explicitly deferred:**
- Sort UI dropdown (backend reads `?sort=` but no chip/dropdown to set it) — deferred to a future polish pass. The tag-chip type filter covers the primary UX need.
- Vercel Blob upload tooling (drag-drop in Studio, CLI script) — deferred. Editors paste URLs manually for now.
- Inventory, variants, discounts, taxes, shipping — all deferred to a future Shopify migration if/when physical sales start.
- Removing Drizzle/Neon — Phase 6.

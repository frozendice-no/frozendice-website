# FrozenDice website redesign — design spec

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope:** Full redesign of the FrozenDice marketing site — landing page, shop, blog, about page — with a content + commerce stack retarget.

---

## 1. Goals

- Position FrozenDice as a **D&D streaming brand** (Patreon-centered subscription, YouTube streams/VODs, digital + eventual physical shop, blog) — not a content-store brand.
- Funnel visitors to **Patreon**, **YouTube streams**, and the **shop**, in that priority order.
- Let humans *and* AI agents create products and blog posts with minimal friction.
- Static-render everything that can be static, for SEO and Vercel edge performance.
- Stay lean: no infrastructure until a real feature needs it.

## 2. Stack decisions

### Keep
- Next.js 16 (App Router, RSC), React 19, TypeScript
- shadcn/ui (`base-nova` style, neutral palette, Lucide icons) + Tailwind v4
- framer-motion v12
- Stripe (Checkout Sessions, webhooks, Customer Portal)
- Resend (transactional email only — order confirmations, digital download links)
- Vercel (hosting)

### Add
- **Sanity** — single CMS for blog posts, products, site singletons (about page, Patreon perks, stream schedule)
  - Embedded Studio at `/studio` via `next-sanity/studio`
  - `@sanity/client`, `next-sanity`, `@portabletext/react`, `@sanity/block-tools`
- **Vercel Blob** (`@vercel/blob`) — storage for digital product files and large product images
- **YouTube Data API v3** — live-status polling only (not VOD listing)
- `sharp` (dev dep) — one-time image pipeline for hero dice frames

### Remove
- **Neon + Drizzle** — the entire DB layer. No feature currently needs persistent state; re-add when one actually does.
- DB tables: `products`, `blogPosts` (unused), `orders`, `subscribers`
- MDX blog pipeline: `content/blog/`, `next-mdx-remote`, `gray-matter`, `reading-time` (migration uses these temporarily, then deleted)
- `NewsletterSignup` component + `subscribe` server action
- `sampleProducts` fallback array in `src/lib/store.ts`

### Explicitly deferred
- Commerce platform swap (Shopify) — revisit only when first physical SKU is ready to ship
- Newsletter / customer hub (Klaviyo, Brevo, Beehiiv) — all membership/community routes through Patreon for now
- User accounts / authentication — Stripe Customer Portal covers post-purchase needs
- Cart — single-item Stripe Checkout only
- Search — catalog + post count too small

---

## 3. Landing page (`/`)

### 3.1 Hero: scroll-scrubbed dice animation

**Technique:** 121-frame WebP image sequence drawn to `<canvas>`, scroll-linked via framer-motion `useScroll` + `useTransform` + `useMotionValueEvent`. Section is pinned with sticky CSS (`h-[500vh]` wrapper + `sticky top-0` content), no JS pinning.

**Why framer-motion over GSAP:** framer-motion is already installed; sticky-CSS pinning makes GSAP's pinning ergonomics unnecessary; ~40 KB bundle savings.

**Assets (responsive, two sets):**
- **Desktop** (`min-width: 768px`): `public/images/hero/desktop/1.webp`…`121.webp`, 1280px wide, target ~25 KB/frame → ~3 MB total.
- **Mobile** (below `768px`): `public/images/hero/mobile/1.webp`…`121.webp`, 640px wide, target ~10 KB/frame → ~1.2 MB total.
- Client picks the set at mount via `window.matchMedia('(min-width: 768px)')`. Preloaded via `new Image()`; skeleton until frame 1 is ready. Canvas redraws on `window.resize` with "contain" fit so the die stays centered at any viewport.

**Accessibility:** on `prefers-reduced-motion`, replace the canvas with a single static frame (frame 60, mid-roll) on any device. This is an explicit user accessibility preference, not a device-capability guess — the animation runs on mobile by default.

**Implementation checkpoint:** during phase 4, real-device test on a mid-range Android (e.g. Pixel 6a or equivalent). If the 121-frame scrub stutters visibly on the mobile asset set, fall back to snapping to every-2nd frame on mobile (60 frames drawn, 121 mapped). Design stays the same; only the canvas draw cadence changes.

**Narrative copy, mapped to scroll progress (three beats):**

- **Beat 1 (0–33%)** — die tumbles in. H1 *"FrozenDice"*, tagline *"Cold dice. Hot stories."* (placeholder; tunable without code).
- **Beat 2 (33–66%)** — die mid-roll, snow swirling. H2 *"Live D&D from the frozen north."*, sub *"Original campaigns. Nordic lore. Streamed weekly on YouTube."*
- **Beat 3 (66–100%)** — die settles, snow drifts. H2 *"Join the saga."* + three CTA buttons:
  - **Patreon** (primary, filled, brand accent) → `patreon.com/frozendice`
  - **Watch Live** (secondary, outlined) → YouTube channel
  - **Shop** (secondary, outlined) → `/store`

Copy overlays fade in/out via `useTransform(scrollYProgress, [a, b, c, d], [0, 1, 1, 0])` per beat.

### 3.2 Patreon section

**Layout:** two-column sticky.

- **Left (sticky):** eyebrow *"Patreon"*, headline *"The full saga lives here."*, short body on member perks, primary CTA *"Become a Patron →"* (external).
- **Right (scroll-animated):** stack of 4–5 "pages" representing D&D artifacts members unlock — campaign map, monster stat block, NPC portrait + bio, handwritten journal / session recap, Discord community moment.

**Animation:** dealt-card reveal. Each page flies in from offscreen, rotates slightly, stacks/fans like cards dealt onto a tavern table. framer-motion `useTransform` on rotation + translation, staggered by mapping each card to a different scroll range.

**Below the stack (optional):** tier summary (2–3 placeholder tiers, e.g. *Campfire / Ranger / Dragonslayer*). Patreon itself remains the pricing source of truth.

**Content source:** Sanity `patreonPerks` singleton — ordered array of `{ image, label, blurb }` cards, plus tier summary fields.

### 3.3 Streams / VOD section

**Layout:**

- Eyebrow *"Live & on-demand"*, headline *"Watch the saga unfold."*
- **Hero player (always visible):** YouTube embed at `youtube.com/embed/live_stream?channel=<CHANNEL_ID>` — YouTube auto-serves the live stream when live, falls back to the channel's recent premiere/pinned video otherwise.
- **LIVE pill overlay** (pulsing red dot) when channel is live, detected via a polled `/api/youtube/live-status` route handler using YouTube Data API v3 `search.list?eventType=live`.
- **Schedule strip** — next 2–3 scheduled sessions, e.g. *"Next: Thursday 8pm CET — Session 14: The Glacier's Tomb."* Content from Sanity `streamSchedule` singleton.
- **VOD grid** — 6 featured VODs rendered from `i.ytimg.com` thumbnails; click opens an inline lightbox with a YouTube iframe. Content from Sanity `featuredVods` array (video IDs + optional titles).
- **CTA:** *Subscribe on YouTube →* + *See all VODs on YouTube →*.

**Data split (hybrid):** Sanity owns curated VODs + schedule (editor pastes video IDs after each stream). YouTube Data API owns live status only.

**Quota:** default 10k units/day. `search.list?eventType=live` costs 100 units/call; 60-second `revalidate` in the route handler keeps us well under budget.

### 3.4 Shop featured items section

**Layout:** eyebrow *"Shop"*, headline *"Gear for your table."*, one-line sub. **3-up grid** of featured products.

**Cards:** image, name, one-line description, price, *View product →* link to `/store/[slug]`. Staggered `opacity + translateY` on scroll (`whileInView`), subtle hover lift. Reuses the same `ProductCard` component as `/store`.

**Query:** `*[_type == "product" && featured == true && isPublished == true][0...3]`.

**Footer link:** *See all products →* to `/store`.

---

## 4. Shop page (`/store`)

### Routes
- `/store` — product listing
- `/store/[slug]` — product detail
- `/store/success` — post-checkout thank-you + download link display

### Layout (`/store`)
- Hero strip — eyebrow + headline *"Gear for your table."* + intro.
- Toolbar — **chip row** filter (`All / Adventures / Maps / Bundles / Physical`) + sort select (`Newest / Price ↑ / Price ↓`). URL-driven (`?type=maps&sort=newest`).
- Responsive product grid (3/2/1 by breakpoint).
- Empty state when filters return no results.
- No pagination until catalog exceeds ~24 items.

### Layout (`/store/[slug]`)
- Image gallery (hero + additional images from Sanity).
- Name, price, product-type pill.
- Short description.
- Long description rendered from Portable Text.
- Buy button → `createCheckoutSession` server action → Stripe Checkout.
- Related products (3 sharing at least one tag).

### Rendering strategy (RSC composition)
- `/store` and `/store/[slug]` are Server Components; Sanity queries use `next: { tags: ['products'] }`.
- `generateStaticParams` in `/store/[slug]/page.tsx` pre-renders every published product at build.
- Sanity webhook → `/api/revalidate` route handler → `revalidateTag('products')` on publish/update.
- Toolbar filter/sort is a small Client Component reading/writing URL `searchParams`; the RSC page re-queries on nav. Grid is never hydrated.
- `generateMetadata` per product page produces OG tags, title, description, canonical from Sanity `seo` fields.

### Checkout flow (updated source, unchanged shape)
1. Buy button → server action `createCheckoutSession(productId)`.
2. Action reads product from Sanity (replacing current Drizzle read).
3. `stripe.checkout.sessions.create` with ad-hoc `price_data` built from Sanity fields (currency, `priceInCents`, name, description, image).
4. `success_url` → `/store/success?session_id={CHECKOUT_SESSION_ID}`.
5. Stripe webhook `checkout.session.completed` → Resend email with a **short-lived signed Vercel Blob URL** for the product's `digitalFile`. No local order row.
6. If the customer loses the email: they enter their email → server action calls `stripe.checkout.sessions.list({ customer_email })` → verify purchase → re-send link. Fully stateless.

### Sanity `product` schema
```ts
product {
  name, slug
  description           // short, ~15 words — cards + OG description fallback
  longDescription       // Portable Text — detail page
  priceInCents, currency // default USD
  productType: 'pdf' | 'map' | 'bundle' | 'physical' | 'other'
  heroImage (alt), gallery[]
  digitalFile            // Vercel Blob URL (digital products only)
  featured: boolean      // drives landing 3-up
  isPublished: boolean
  publishedAt: datetime
  seo { title, description, ogImage }
  tags[] → tag reference
}
```

---

## 5. Blog page (`/blog`)

### Routes
- `/blog` — post listing with tag filter
- `/blog/[slug]` — post detail
- `/blog/tag/[slug]` — tag archive (optional, defer)

### Layout (`/blog`)
- Hero strip — eyebrow *"Blog"*, headline *"Dispatches from the frozen north."*, intro.
- Featured post card — large, full-width, when a post has `featured: true`.
- **Tag filter chips** (same pattern as shop), URL-driven.
- Post grid — cover image, title, excerpt, date, reading time, tag pill. 3/2/1 responsive.
- No pagination until post count exceeds ~30.

### Layout (`/blog/[slug]`)
- Cover image (16:9, `next/image` with blurhash).
- Title, publish date, author, reading time, tag pills.
- Portable Text body rendered via `@portabletext/react`. Custom block renderers:
  - Headings with Tailwind `prose` class
  - Images with `next/image`
  - Code blocks (syntax highlighting via `shiki` or similar)
  - Pull-quotes / callouts
  - **Inline `patreonCta` block** — editors can drop a Patreon CTA mid-article where narratively appropriate
- **Always-on footer CTA block:** *Join us on Patreon →* primary + *Watch live on YouTube →* secondary. Rendered automatically after the body, not part of content.
- Related posts — 3 posts sharing at least one tag, excluding current.

### Rendering strategy
- RSC pages, Sanity queries with `next: { tags: ['posts', 'tags'] }`.
- `generateStaticParams` pre-renders every post at build.
- `generateMetadata` per post → OG tags, Twitter card, canonical from Sanity `seo`.
- Sanity webhook → `/api/revalidate` → `revalidateTag('posts')` / `revalidateTag('tags')`.
- Reading time computed at render from Portable Text (words ÷ 200 wpm). No stored field.

### Sanity schemas
```ts
post {
  title, slug
  excerpt               // short, ~25 words
  body                  // Portable Text, with custom block types: image, code, callout, patreonCta
  coverImage (alt), ogImage
  author → author reference
  tags[] → tag reference
  featured: boolean
  publishedAt: datetime
  seo { title, description, ogImage }
}

tag { name, slug, description? }

author { name, bio, avatar }
```

**Tags as references, not free-form strings** — prevents drift ("DM tips" vs "DM-tips" vs "Dungeon Master Tips"). Editor (and AI MCP) picks from existing documents or creates new explicitly.

### Existing plumbing to re-wire
- `feed.xml` RSS endpoint — swap data source MDX → Sanity.
- `sitemap.ts` — include blog post URLs from Sanity.
- `json-ld.tsx` — emit `BlogPosting` JSON-LD on post pages from Sanity fields.

---

## 6. About page (`/about`)

The existing `/about` page is hardcoded, still references `NewsletterSignup`, and frames the brand as a content store. Full rewrite.

### Sections
1. **Hero** — eyebrow *"About"*, headline *"The story behind FrozenDice."*, one-line intro.
2. **Our Story** — 2–3 paragraphs of origin + streaming focus. Portable Text from Sanity.
3. **The Crew** — cast cards (DM + players). Each card: portrait, real name, role (DM / Player), character name + class in the active campaign, short bio. Grid, 3–4 across desktop.
4. **Current Campaign** — single feature block: campaign name, setting blurb, cover image, *"Watch from the beginning →"* link to the YouTube playlist or `/blog/tag/<campaign-slug>`.
5. **Values** — 3–4 pillars (placeholders: *"Lore-first storytelling / Immersion over optimization / Nordic soul / Show up every week"*). Editor-controlled in Sanity.
6. **CTA strip** — Patreon (primary) / Watch Live / Shop. Replaces current newsletter block.
7. **Contact** — `mailto:` link at footer. No form.

### Sanity schemas
```ts
aboutPage (singleton) {
  hero { eyebrow, headline, intro }
  storyBody               // Portable Text
  values[] { icon, title, description }
  businessEmail
}

castMember {
  name, role: 'dm' | 'player'
  portrait (alt)
  characterName, characterClass
  bio, isActive, order
}

campaign {
  title, slug, summary
  status: 'current' | 'past' | 'upcoming'
  coverImage, startDate, endDate
  youtubePlaylistUrl, blogTag → tag reference
}
```

### Rendering
Same RSC + Sanity tag-revalidation pattern as shop/blog. Fully static at build; rebuilds on publish. `generateMetadata` from `aboutPage.hero`.

---

## 7. Sanity Studio

**Embedded at `/studio`** via `next-sanity/studio`.

- Single deployment with the Next app.
- Editors (and the user) log in via sanity.io auth.
- Bookmarkable at `frozendice.com/studio`.
- AI agents hit the same Sanity API surface via the **official Sanity MCP server**.
- Schemas live in `src/sanity/schemas/` and are imported into the Studio config.

### Sanity document index
- Singletons: `aboutPage`, `patreonPerks`, `streamSchedule`, `featuredVods`
- Collections: `post`, `tag`, `author`, `product`, `castMember`, `campaign`

---

## 8. Asset pipeline & migration

### One-time scripts (committed, not run at build)
- `scripts/optimize-hero-frames.ts` — `sharp`-based, converts `frozendice_dice/ezgif-frame-###.jpg` into two sets: `public/images/hero/desktop/N.webp` at 1280px (~25 KB/frame) and `public/images/hero/mobile/N.webp` at 640px (~10 KB/frame). Run once, output committed.
- `scripts/import-mdx-to-sanity.ts` — parses each file in `content/blog/` with `gray-matter`, converts Markdown body to Portable Text via `@sanity/block-tools`, uploads cover images, upserts `post` documents. Dry-run flag first.

### Cleanup after verification
- `frozendice_dice/` → add to `.gitignore` (keep locally as backup).
- `content/blog/` → delete once Sanity import verified.
- Drizzle + Neon → uninstall once no consumer reads the DB.

### Environment variables
- **Add:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, `SANITY_WEBHOOK_SECRET`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `BLOB_READ_WRITE_TOKEN`
- **Keep:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- **Remove:** `DATABASE_URL` (after Drizzle retirement)

---

## 9. Implementation phases

Each phase ships as a normal git branch; no feature flags, no parallel code paths.

1. **Foundation** — Sanity project, embedded Studio at `/studio`, schemas defined, `/api/revalidate` webhook handler, env vars wired in Vercel.
2. **Content migration** — MDX import script; `/blog` + `/blog/[slug]` switched to Sanity queries; `content/blog/` deleted; `feed.xml`, `sitemap.ts`, `json-ld.tsx` updated.
3. **Shop migration** — `product` schema populated in Sanity; `/store` + `/store/[slug]` + `createCheckoutSession` switched to Sanity; `sampleProducts` + Drizzle `products` table dropped; Vercel Blob wired for `digitalFile`; Stripe webhook → Resend signed-link flow.
4. **Landing rebuild** — hero frame pipeline, scroll animation component, copy overlays, Patreon section (card deck reveal), streams section (live embed + LIVE pill + VOD grid + schedule), featured products 3-up.
5. **About rebuild** — `aboutPage`, `castMember`, `campaign` schemas; new `/about` page; old page deleted.
6. **Cleanup** — remove Neon, Drizzle, `NewsletterSignup`, `subscribe` action, unused tables, unused deps. Final sweep of `sitemap.ts`, `feed.xml`, `json-ld.tsx`.

---

## 10. Explicit non-goals (launch scope)

- Shopify, Wix, WooCommerce, or any commerce platform swap
- Customer hub / CRM (Klaviyo, Brevo, HubSpot, Mailchimp)
- Newsletter signup
- User accounts / authentication beyond Stripe Customer Portal
- Cart / multi-item checkout
- Search (blog or shop)
- Comments, reviews, wishlists
- Paid memberships on our own infrastructure (Patreon owns this)
- Real-time inventory, shipping, tax engine, POS — deferred until first physical SKU
- In-browser studio preview mode — add when an editor actually asks for it
- Internationalization — English only for launch

---

## 11. Open questions carried to implementation planning

- **Tagline finalization** — *"Cold dice. Hot stories."* is a placeholder; can be tuned during implementation without code changes.
- **Tier names and perks** for the Patreon section — placeholder (*Campfire / Ranger / Dragonslayer*); finalize with real Patreon tier data.
- **Values pillars** for `/about` — placeholder; author in Sanity.
- **Mobile frame-snapping fallback** — if the 121-frame scrub visibly stutters on a real mid-range Android with the 640px mobile set, switch to every-2nd-frame draw on mobile. Decided during phase 4 implementation.
- **Syntax highlighting library** for blog code blocks — `shiki` (build-time, zero runtime) vs `highlight.js` (runtime). Recommend `shiki`.

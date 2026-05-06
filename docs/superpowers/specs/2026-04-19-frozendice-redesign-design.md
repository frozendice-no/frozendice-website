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

The landing page is a single sticky-pinned hero with **four scroll-linked stages** that share a 121-frame reverse-direction dice canvas as continuous background. Stages cross-fade as scroll progresses; copy, CTAs, and per-stage decorative animations layer over the dice. A floating snow-pill site header overlays the whole experience.

Architecturally this differs from the original 3-beat single-hero design that was approved at the start of Phase 4. Stages 2 (Patreon), 3 (Blog), and 4 (Streams) are now *inside* the hero pin rather than separate sections following it. Stage 5 (Shop) is reserved for after the hero, displayed against the static final dice frame as background.

### 3.1 Hero: 4-stage scroll-pinned dice animation

**Container:**

- Outer wrapper: `position: relative` with `h-[500vh]` (~one viewport-height of scroll per stage) inside `<main>`.
- Inner sticky div: `sticky top-0 h-screen overflow-hidden bg-black`.
- Anchor divs at `top: 0%/25%/50%/75%` (`#stage-intro` / `#stage-patreon` / `#stage-blog` / `#stage-streams`) provide deep-link targets and `scroll-smooth` jumps.
- Page root requires `position: relative` on `<html>` so framer-motion's scroll-container measurements resolve.

**Asset pipeline:**

Source video `frozendice_dice/frozendice_animation.mp4` (h264, 1928×1072, 24 fps × 5 s = 121 frames). One-shot `scripts/optimize-hero-frames.ts` decodes the video to lossless PNG via `ffmpeg-static`, then sharp encodes two WebP sets:

- **Desktop:** source resolution 1928px wide, Q85, effort 6, ~85 KB/frame → ~10 MB total.
- **Mobile:** 800px wide, Q82, effort 6, ~30 KB/frame → ~3.5 MB total.

Output committed to `public/images/hero/{desktop,mobile}/N.webp`. The intermediate PNG temp dir is removed after each run. `frozendice_dice/` is gitignored; the source `.mp4` is kept locally as backup.

**Canvas:**

- Scroll-linked via framer-motion `useScroll({ target: heroRef, offset: ["start start", "end end"] })` lifted into `HeroSection`. `frameIndex = useTransform(scrollYProgress, [0, 1], [TOTAL_FRAMES, 1])` — **reverse direction**: the die starts settled (frame 121) at the top of the page and rolls away to frame 1 as the user scrolls through all four stages.
- Cover-fit painting (`Math.max` scale) so the dice fills the viewport at any aspect ratio — no letterbox.
- Internal pixel buffer is `window.innerWidth × devicePixelRatio` (capped at 2×) for crisp rendering on retina/4K displays.
- Asset set picked at mount via `window.matchMedia('(min-width: 768px)')`. All frames are preloaded via `new Image()`; `onload` is wired before `src` to handle synchronous cache-hits (frame 1 is preloaded via `<link rel="preload" fetchPriority="high">` so it appears at LCP).
- `drawFrame(n)` falls back to the nearest already-loaded earlier frame if frame N hasn't arrived yet, eliminating mid-scrub blank flashes.

**Reduced motion:** `prefers-reduced-motion: reduce` collapses the wrapper to `h-screen` (no scroll pinning), loads only frame 60 (skipping the other 120 entirely — saves ~9 MB), and renders Stage 1 statically with CTAs pointing at direct external destinations (since `#stage-X` anchors don't exist in this mode).

**Stage 1 — Intro (scroll 0–25%, visible at scroll 0):**

- Left-aligned panel, `max-w-xl`.
- H1 *"FrozenDice"*, tagline *"Cold dice. Hot stories."*, intro paragraph mentioning live D&D + Patreon + blog.
- Three CTAs: **Become a Patreon** (primary, brand-red `#FF424D`) → `patreon.com/FrozenDice`; **Read the Blog** → `/blog`; **Watch Stream** → channel handle URL.
- Opacity is computed via the function form of `useTransform` (every scroll position maps to an explicit return value, avoiding keyframe-interpolation edge cases). `visibleAtStart: true` flag holds opacity at 1 from scroll 0 through 20%, then fades to 0 by 25%.

**Stage 2 — Patreon (scroll 25–50%):**

- Two-column layout. Left: eyebrow *"Patreon"*, headline *"The full saga lives here."*, body, *"Become a Patreon →"* CTA.
- Right (desktop only, `hidden lg:block`): three placeholder PDF cards fly in from off-screen-right via `useTransform(scrollYProgress, [in, out], [800, 0])` between scroll progress 0.28 and 0.42, staggered. Cards use page-mockup styling (header bar, faux text rows, image block placeholder).
- Final art replaces placeholders with real PDF preview images of Patreon perks. Sanity-backed via the Phase 1 `patreonPerks` singleton (TODO — currently hardcoded copy).

**Stage 3 — Blog (scroll 50–75%):**

- Two-column. Left: eyebrow *"Blog"*, headline *"Dispatches from the frozen north."*, body, *"Read the Blog →"* link.
- Right (desktop only): up to 3 latest blog posts from Sanity. `(marketing)/page.tsx` server-fetches `getAllPosts()` and transforms `PostCard[]` to a serializable `BlogPreview` shape (slug, title, excerpt, pre-built `coverUrl` string from `urlForImage`, alt, publishedAt) before threading down through the Client overlay. Each preview: 16:9 thumbnail, title (line-clamp-2), excerpt (line-clamp-2), formatted date, link to `/blog/[slug]`.

**Stage 4 — Streams (scroll 75–100%):**

- Two-column. Left: eyebrow *"Live & on-demand"*, headline *"Watch the saga unfold."*, body, *"Subscribe on YouTube →"* CTA. Below the CTA: up to 2 upcoming sessions from Sanity `streamSchedule.upcoming` as glassmorphic cards (title + formatted date/time).
- Right (desktop only): YouTube live embed `youtube.com/embed/live_stream?channel=<id>` — channel ID from `streamSchedule.youtubeChannelId` with fallback to `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`. YouTube auto-serves the live stream when live, falls back to the channel's recent video otherwise.
- **LIVE pill** overlay (pulsing red dot + "LIVE" label, `bg-black/70 backdrop-blur-sm`) appears when `/api/youtube/live-status` returns `{isLive: true}`. The route handler polls YouTube Data API v3 `search.list?eventType=live&channelId=<id>&type=video` (100 quota units/call) and is cached for 60 s — keeps the daily call count well under the 10k unit quota.
- **VOD grid (TODO):** 6 featured VOD thumbnails with click-to-play `<dialog>` lightbox, sourced from Sanity `featuredVods` singleton. Pending follow-up; Stage 4 currently renders embed + schedule only.

**Stage 5 — Shop (TODO, post-hero):**

- Below the sticky hero, against the static frame-1 dice as background.
- 3-up featured products grid reusing `ProductCard` from `/store`, query `*[_type == "product" && featured == true && isPublished == true][0...3]`, `whileInView` staggered fade-in.
- Deferred until Phase 3 ships the underlying product schema and storefront.

### 3.2 Render-context threading

`HeroCopyOverlay` is a Client Component (uses framer-motion hooks). Per-stage data fetched on the server (Sanity blog posts, stream schedule) is threaded through a `StageRenderContext` object passed to each stage's `render` function:

```ts
type StageRenderContext = {
  scrollYProgress: MotionValue<number>;
  blogPreviews: BlogPreview[];
  streamSchedule: StreamSchedule | null;
};
```

This avoids prop-drilling and lets future stages receive additional server-resolved data without breaking changes.

### 3.3 Site header

Sticky-pill floating header (`position: fixed; top: 1rem; mx-auto w-fit`) overlaying the hero at all times. Three layers stacked:

1. **Outer halo** — `bg-white/20 blur-2xl`, soft snow-light glow.
2. **Snow shell** — `bg-white/70` with SVG turbulence displacement filter (`feTurbulence baseFrequency=0.85 numOctaves=2 + feDisplacementMap scale=5`) for organic flurry edges. Filter applied via `.snow-flurry-edge` utility class in `globals.css`.
3. **Crisp content pill** — `bg-white/95 backdrop-blur-md rounded-full`, border `white/60`. Logo + nav links (Blog, Tools, About) + primary "Become a Patreon" CTA in brand red.

Mobile collapses to hamburger via shadcn `Sheet`. Same items inside.

The Store nav item is deferred pending Phase 3.

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
  // Hero fields are flat at the top level (per Phase 1 schema); not nested under a `hero` object.
  eyebrow, headline, intro
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

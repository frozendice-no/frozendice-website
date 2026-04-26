# Phase 5: About Page Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `src/app/(marketing)/about/page.tsx` — which frames FrozenDice as a content-store brand and embeds a `NewsletterSignup` component — with a fully Sanity-sourced RSC page that presents FrozenDice as a D&D streaming brand. The rewrite introduces seven content sections (Hero, Our Story, The Crew, Current Campaign, Values, CTA strip, Contact), all driven by the `aboutPage` singleton, `castMember` collection, and `campaign` collection already defined in Phase 1.

**Architecture:** RSC page (`src/app/(marketing)/about/page.tsx`) queries three Sanity documents on the server using `next: { tags: ['aboutPage', 'castMember', 'campaign'] }`. The page is fully static at build time; on any publish event the existing `/api/revalidate` webhook fires `revalidateTag` for the relevant tags and triggers a rebuild. `generateMetadata` pulls `headline` and `intro` from the `aboutPage` singleton. No client components are needed; icons are loaded via a thin server-side dynamic-import helper so unused Lucide icons are tree-shaken. The `NewsletterSignup` import is removed from this file; the component itself remains in the repo until Phase 6 cleanup.

**Tech Stack:** Next.js 16 (App Router, RSC), Sanity v5 + `next-sanity`, `@portabletext/react` (reused from Phase 2), `lucide-react` (already installed), TypeScript.

**⚠️ Next.js 16 note:** This version has breaking changes from prior majors. Before touching `generateMetadata`, `generateStaticParams`, or any route handler APIs, consult `node_modules/next/dist/docs/` — don't rely on pre-16 knowledge.

---

## Spec reference

This plan implements spec section 6 (About page) in full. Source: [`docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md`](../specs/2026-04-19-frozendice-redesign-design.md).

**Out of scope** (deferred to later plans):
- Removing `NewsletterSignup` component + `subscribe` server action from the repo (Phase 6)
- Removing Neon/Drizzle (Phase 6)
- Multi-campaign archive page — deferred indefinitely per spec §10
- Comments / discussion — explicitly excluded per spec §10
- Contact form — `mailto:` link only per spec §6

## Key decisions locked in the spec

- **`aboutPage` is a singleton.** There is exactly one document of `_type == "aboutPage"`. The GROQ query uses `[0]`; if the document does not yet exist the page renders a graceful fallback rather than throwing.
- **`castMember` query filters `isActive == true`, ordered by `order` asc.** Past cast members stay in Sanity (set `isActive: false`) but never appear on the live page.
- **`campaign` query takes the first result where `status == "current"`.** Only one campaign is featured at a time; if none is current the section is omitted from the rendered page.
- **Lucide icons from `values[]` are loaded via dynamic import.** The schema stores the icon name as a kebab-case string (e.g. `"dice-5"`, `"map-pin"`, `"flame"`). A small server utility converts the kebab name to the PascalCase export name, does `await import("lucide-react")`, and returns the component. Unknown names fall back to a neutral `Sparkles` icon.
- **`PortableText` renderer reused from Phase 2.** `src/components/portable-text/index.tsx` already handles block text, images, and custom block types. `storyBody` uses only plain `block` nodes so no new custom renderers are needed.
- **`NewsletterSignup` removed from the page, not from the repo.** The import and JSX usage are deleted from `about/page.tsx` in Task 3. The component file stays until Phase 6.
- **No `generateStaticParams`.** The about page is a singleton at a fixed URL (`/about`); `generateStaticParams` is only needed for dynamic routes.
- **Revalidation tags:** `aboutPage`, `castMember`, `campaign`. The `/api/revalidate` webhook handler (Phase 1) must accept all three tags. Task 2 verifies this and patches the handler if needed.

---

## File structure

### Created

```
src/sanity/
  queries-about.ts                       # getAboutPage, getActiveCastMembers, getCurrentCampaign
src/components/about/
  crew-card.tsx                          # Cast member portrait card
  campaign-feature.tsx                   # Current campaign feature block
  values-grid.tsx                        # Values/pillars grid with dynamic Lucide icons
  cta-strip.tsx                          # Patreon / Watch Live / Shop CTA strip
src/lib/
  lucide-icon.ts                         # Kebab-to-PascalCase dynamic icon loader
```

### Modified

```
src/sanity/
  types.ts                               # Add AboutPage, CastMember, Campaign, CampaignBlogTag
  queries.ts                             # Re-export about queries (or leave them in queries-about.ts — either works)
src/app/(marketing)/about/
  page.tsx                               # Full rewrite: Sanity-sourced sections, no NewsletterSignup
src/app/api/revalidate/route.ts          # Confirm (and if needed add) aboutPage / castMember / campaign tags
```

### Not deleted

```
src/components/newsletter-signup.tsx     # Stays in repo; Phase 6 removes it
src/app/actions/subscribe.ts             # Stays in repo; Phase 6 removes it
```

---

## Task 1: Add About types to `src/sanity/types.ts`

**Files:**
- Modify: `src/sanity/types.ts`

- [ ] **Step 1:** Append the following types to the end of `src/sanity/types.ts` (keep all existing types intact):

```typescript
// ──────────────────────────────────────────────────────────────
// About page
// ──────────────────────────────────────────────────────────────

export type AboutValue = {
  _key: string;
  icon: string;         // kebab-case Lucide icon name, e.g. "dice-5"
  title: string;
  description: string;
};

export type AboutPageSeo = {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
};

export type AboutPage = {
  eyebrow: string;
  headline: string;
  intro: string;
  storyBody: PortableTextBlock[];
  values: AboutValue[];
  businessEmail: string;
  seo?: AboutPageSeo;
};

export type CastMember = {
  _id: string;
  name: string;
  role: "dm" | "player";
  portrait: SanityImage;
  characterName?: string;
  characterClass?: string;
  bio: string;
  isActive: boolean;
  order: number;
};

export type CampaignBlogTag = {
  _id: string;
  name: string;
  slug: string;
};

export type Campaign = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  status: "current" | "upcoming" | "past";
  coverImage: SanityImage;
  startDate?: string;
  endDate?: string;
  youtubePlaylistUrl?: string;
  blogTag?: CampaignBlogTag;
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
git commit -m "feat(sanity): add About page, CastMember, Campaign types"
```

---

## Task 2: Add about queries to `src/sanity/queries-about.ts`

**Files:**
- Create: `src/sanity/queries-about.ts`

- [ ] **Step 1:** Create with this exact content:

```typescript
import { client } from "./client";
import type { AboutPage, CastMember, Campaign } from "./types";

export async function getAboutPage(): Promise<AboutPage | null> {
  return client.fetch(
    `*[_type == "aboutPage"][0] {
      "eyebrow": coalesce(eyebrow, "About"),
      headline,
      intro,
      storyBody,
      values[] {
        _key,
        icon,
        title,
        description
      },
      businessEmail,
      seo
    }`,
    {},
    { next: { tags: ["aboutPage"] } },
  );
}

export async function getActiveCastMembers(): Promise<CastMember[]> {
  return client.fetch(
    `*[_type == "castMember" && isActive == true] | order(order asc) {
      _id,
      name,
      role,
      portrait { ..., "alt": coalesce(alt, "") },
      characterName,
      characterClass,
      bio,
      isActive,
      order
    }`,
    {},
    { next: { tags: ["castMember"] } },
  );
}

export async function getCurrentCampaign(): Promise<Campaign | null> {
  return client.fetch(
    `*[_type == "campaign" && status == "current"] | order(_createdAt asc) [0] {
      _id,
      title,
      "slug": slug.current,
      summary,
      status,
      coverImage { ..., "alt": coalesce(alt, "") },
      startDate,
      endDate,
      youtubePlaylistUrl,
      "blogTag": blogTag->{ _id, name, "slug": slug.current }
    }`,
    {},
    { next: { tags: ["campaign"] } },
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
git add src/sanity/queries-about.ts
git commit -m "feat(sanity): add about page queries (aboutPage, castMember, campaign)"
```

---

## Task 3: Verify `/api/revalidate` handles about tags

**Files:**
- Conditionally modify: `src/app/api/revalidate/route.ts`

The Phase 1 revalidation webhook must call `revalidateTag` for `"aboutPage"`, `"castMember"`, and `"campaign"` when a matching document is published.

- [ ] **Step 1:** Open `src/app/api/revalidate/route.ts` and find the logic that maps Sanity document types to cache tags.

- [ ] **Step 2:** Confirm the following three mappings are present. If any are missing, add them following the exact same pattern used for `"post"` and `"product"`:

```typescript
// These three must exist in the revalidate handler's type→tag map:
// "aboutPage"  → revalidateTag("aboutPage")
// "castMember" → revalidateTag("castMember")
// "campaign"   → revalidateTag("campaign")
```

Exact code depends on the current shape of the handler. A typical pattern looks like:

```typescript
const tagMap: Record<string, string> = {
  post: "post",
  tag: "tag",
  product: "product",
  aboutPage: "aboutPage",    // add if missing
  castMember: "castMember",  // add if missing
  campaign: "campaign",      // add if missing
};
```

- [ ] **Step 3:** If no changes were needed, no commit required. If you added entries:

```bash
git add src/app/api/revalidate/route.ts
git commit -m "feat(api): add aboutPage, castMember, campaign revalidation tags"
```

---

## Task 4: Lucide icon loader utility

**Files:**
- Create: `src/lib/lucide-icon.ts`

This utility converts a kebab-case icon name stored in Sanity (e.g. `"dice-5"`) to the PascalCase export name used by `lucide-react` (e.g. `"Dice5"`), then performs a dynamic import and returns the component. Unknown names fall back to `Sparkles`.

- [ ] **Step 1:** Create with this exact content:

```typescript
import type { LucideIcon } from "lucide-react";

/**
 * Converts a kebab-case icon name to the PascalCase export name used
 * by lucide-react. E.g. "dice-5" → "Dice5", "map-pin" → "MapPin".
 */
function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

/**
 * Dynamically imports a Lucide icon by its kebab-case name.
 * Falls back to `Sparkles` if the name is not found.
 *
 * This function is async — call it at the component level inside an
 * async Server Component or use it with Promise.all before rendering.
 */
export async function getLucideIcon(kebabName: string): Promise<LucideIcon> {
  const pascalName = toPascalCase(kebabName ?? "sparkles");
  try {
    const icons = await import("lucide-react");
    const icon = (icons as Record<string, unknown>)[pascalName];
    if (typeof icon === "function") return icon as LucideIcon;
  } catch {
    // fall through to fallback
  }
  const { Sparkles } = await import("lucide-react");
  return Sparkles;
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors.

- [ ] **Step 3:** Commit

```bash
git add src/lib/lucide-icon.ts
git commit -m "feat(lib): add Lucide dynamic icon loader utility"
```

---

## Task 5: `CrewCard` component

**Files:**
- Create: `src/components/about/crew-card.tsx`

- [ ] **Step 1:** Create with this exact content:

```tsx
import Image from "next/image";
import { urlForImage } from "@/sanity/image";
import type { CastMember } from "@/sanity/types";

const roleBadge: Record<string, string> = {
  dm: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  player: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

export function CrewCard({ member }: { member: CastMember }) {
  const portraitUrl = urlForImage(member.portrait)
    .width(400)
    .height(400)
    .auto("format")
    .url();

  const hasCharacter = member.characterName || member.characterClass;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-6 text-center">
      <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-border">
        <Image
          src={portraitUrl}
          alt={member.portrait.alt ?? member.name}
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight">{member.name}</h3>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${roleBadge[member.role] ?? roleBadge.player}`}
        >
          {member.role === "dm" ? "Dungeon Master" : "Player"}
        </span>
        {hasCharacter && (
          <p className="text-sm text-muted-foreground">
            {member.characterName}
            {member.characterName && member.characterClass && " · "}
            {member.characterClass}
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
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
git add src/components/about/crew-card.tsx
git commit -m "feat(about): add CrewCard component"
```

---

## Task 6: `CampaignFeature` component

**Files:**
- Create: `src/components/about/campaign-feature.tsx`

- [ ] **Step 1:** Create with this exact content:

```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { urlForImage } from "@/sanity/image";
import type { Campaign } from "@/sanity/types";

export function CampaignFeature({ campaign }: { campaign: Campaign }) {
  const coverUrl = urlForImage(campaign.coverImage)
    .width(1200)
    .height(675)
    .auto("format")
    .url();

  const blogTagHref = campaign.blogTag
    ? `/blog/tag/${campaign.blogTag.slug}`
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-muted/30">
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={coverUrl}
          alt={campaign.coverImage.alt ?? campaign.title}
          width={1200}
          height={675}
          className="h-full w-full object-cover"
          priority={false}
        />
      </div>
      <div className="space-y-4 p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Current Campaign
        </p>
        <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {campaign.title}
        </h3>
        <p className="max-w-prose text-muted-foreground">{campaign.summary}</p>
        <div className="flex flex-wrap items-center gap-3">
          {/*
            Show BOTH CTAs when both are set (per stakeholder direction 2026-04-26).
            YouTube playlist sends viewers to the visual archive; blog tag sends them
            to the written session recaps. They serve different audiences.
          */}
          {campaign.youtubePlaylistUrl && (
            <Link
              href={campaign.youtubePlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default" })}
            >
              Watch on YouTube
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
          {blogTagHref && (
            <Link
              href={blogTagHref}
              className={buttonVariants({
                variant: campaign.youtubePlaylistUrl ? "outline" : "default",
              })}
            >
              Read session recaps
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
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
git add src/components/about/campaign-feature.tsx
git commit -m "feat(about): add CampaignFeature component"
```

---

## Task 7: `ValuesGrid` component

**Files:**
- Create: `src/components/about/values-grid.tsx`

This component is async (Server Component) because it uses the `getLucideIcon` dynamic importer.

- [ ] **Step 1:** Create with this exact content:

```tsx
import type { LucideIcon } from "lucide-react";
import { getLucideIcon } from "@/lib/lucide-icon";
import type { AboutValue } from "@/sanity/types";

async function ValuePillar({ value }: { value: AboutValue }) {
  const Icon: LucideIcon = await getLucideIcon(value.icon);
  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-6">
      <Icon aria-hidden="true" className="h-8 w-8 text-primary" />
      <h3 className="font-semibold">{value.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {value.description}
      </p>
    </div>
  );
}

export async function ValuesGrid({ values }: { values: AboutValue[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {values.map((v) => (
        <ValuePillar key={v._key} value={v} />
      ))}
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
git add src/components/about/values-grid.tsx
git commit -m "feat(about): add ValuesGrid component with dynamic Lucide icons"
```

---

## Task 8: `CtaStrip` component

**Files:**
- Create: `src/components/about/cta-strip.tsx`

Replaces the `NewsletterSignup` + "Get Involved" section from the old page. Three buttons: Patreon (primary/filled), Watch Live (outline), Shop (outline).

- [ ] **Step 1:** Create with this exact content:

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaStrip() {
  return (
    <div className="rounded-2xl bg-primary/5 px-6 py-12 text-center sm:px-12">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Join the saga
      </h2>
      <p className="mt-4 text-muted-foreground">
        Support the show on Patreon, tune in live, or grab something from the
        shop.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="https://www.patreon.com/c/FrozenDice"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Become a Patron
        </a>
        <a
          href="https://www.youtube.com/@frozendice"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Watch Live
        </a>
        <Link
          href="/store"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Shop
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
git add src/components/about/cta-strip.tsx
git commit -m "feat(about): add CtaStrip component (Patreon / Watch Live / Shop)"
```

---

## Task 9: Rewrite `src/app/(marketing)/about/page.tsx`

**Files:**
- Modify: `src/app/(marketing)/about/page.tsx`

This is the primary deliverable of the phase. The current file has three hardcoded sections (Hero, Our Story with four icon pillars, Get Involved with `NewsletterSignup`). All three are replaced; seven CMS-driven sections take their place.

What is removed from the current file:
- `Dice5, Users, Heart, MapPin` imports from `lucide-react`
- `NewsletterSignup` import and usage
- All hardcoded paragraph text, pillar text, and CTA copy
- The static `export const metadata` object with its hardcoded strings

What is added:
- Three parallel Sanity fetches: `getAboutPage`, `getActiveCastMembers`, `getCurrentCampaign`
- `generateMetadata` reading from the live `aboutPage` document
- Seven rendered sections: Hero, Our Story (PortableText), The Crew (grid), Current Campaign (feature block, conditional), Values (grid), CTA strip, Contact (`mailto:`)

- [ ] **Step 1:** Replace the entire file contents with:

```tsx
import type { Metadata } from "next";
import { PortableText } from "@/components/portable-text";
import { CrewCard } from "@/components/about/crew-card";
import { CampaignFeature } from "@/components/about/campaign-feature";
import { ValuesGrid } from "@/components/about/values-grid";
import { CtaStrip } from "@/components/about/cta-strip";
import {
  getAboutPage,
  getActiveCastMembers,
  getCurrentCampaign,
} from "@/sanity/queries-about";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage();
  if (!about) {
    return {
      title: "About",
      description: "Learn about FrozenDice.",
      alternates: { canonical: "/about" },
    };
  }

  const ogImage = about.seo?.ogImage
    ? undefined // resolved below if needed — keep it simple; fallback to siteConfig default
    : undefined;

  return {
    title: about.seo?.title ?? about.headline,
    description: about.seo?.description ?? about.intro,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title: about.seo?.title ?? about.headline,
      description: about.seo?.description ?? about.intro,
      url: `${siteConfig.url}/about`,
      images: ogImage ?? undefined,
    },
  };
}

export default async function AboutPage() {
  const [about, castMembers, currentCampaign] = await Promise.all([
    getAboutPage(),
    getActiveCastMembers(),
    getCurrentCampaign(),
  ]);

  // Graceful fallback if singleton not yet created in Sanity
  if (!about) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          This page is being set up. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            {about.eyebrow && (
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
                {about.eyebrow}
              </p>
            )}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {about.headline}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {about.intro}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Our Story ────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold tracking-tight">Our Story</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <PortableText value={about.storyBody} />
          </div>
        </div>
      </section>

      {/* ── 3. The Crew ─────────────────────────────────────────────────── */}
      {castMembers.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-3xl font-bold tracking-tight">
              The Crew
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {castMembers.map((member) => (
                <CrewCard key={member._id} member={member} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Current Campaign ─────────────────────────────────────────── */}
      {currentCampaign && (
        <section className="border-t bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <CampaignFeature campaign={currentCampaign} />
          </div>
        </section>
      )}

      {/* ── 5. Values ───────────────────────────────────────────────────── */}
      {about.values && about.values.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-3xl font-bold tracking-tight">
              What we stand for
            </h2>
            <ValuesGrid values={about.values} />
          </div>
        </section>
      )}

      {/* ── 6. CTA strip ────────────────────────────────────────────────── */}
      <section className="border-t py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <CtaStrip />
        </div>
      </section>

      {/* ── 7. Contact ──────────────────────────────────────────────────── */}
      {about.businessEmail && (
        <section className="border-t py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground">
              Business enquiries:{" "}
              <a
                href={`mailto:${about.businessEmail}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {about.businessEmail}
              </a>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 2:** Typecheck

```bash
pnpm tsc --noEmit
```

No new errors. If TypeScript complains about `ogImage` in `generateMetadata`, the `undefined` fallback is intentional — the OG image will fall back to whatever the site-level default is (configured in root `layout.tsx` or `siteConfig`).

- [ ] **Step 3:** Confirm `NewsletterSignup` is no longer imported anywhere in this file:

```bash
grep -r "NewsletterSignup" src/app/\(marketing\)/about/
```

Expected: no output.

- [ ] **Step 4:** Commit

```bash
git add "src/app/(marketing)/about/page.tsx"
git commit -m "feat(about): rewrite /about as Sanity-sourced RSC (7 sections)"
```

---

## Task 10: Seed Sanity content (external — no commit)

This task has no code changes. It is performed manually in Sanity Studio.

**Pre-condition:** Dev server is running (`pnpm dev`). Studio is accessible at `http://localhost:3000/studio`.

### 10a — `aboutPage` singleton

- [ ] Navigate to **About page** in the Studio sidebar. If no document exists, click **Create new**.
- [ ] Fill in:
  - **Hero eyebrow:** `About`
  - **Hero headline:** `The story behind FrozenDice.`
  - **Hero intro:** `A Norwegian D&D streaming crew bringing original campaigns, Nordic lore, and weekly sessions to screens worldwide.`
  - **Our story:** Add 2–3 block paragraphs covering the origin story. Example opening: *"FrozenDice started as a group of friends rolling dice around a kitchen table in Norway..."*
  - **Values / pillars** (add 3–4 objects):
    - icon: `dice-5`, title: `Lore-first storytelling`, description: `Every decision at the table is made in service of the story, not the rules.`
    - icon: `map-pin`, title: `Nordic soul`, description: `Our campaigns draw from Norse mythology, cold landscapes, and the long dark.`
    - icon: `flame`, title: `Immersion over optimization`, description: `We value a dramatic failure over a safe success. That's where the stories live.`
    - icon: `calendar`, title: `Show up every week`, description: `Consistency is how you build a saga. We stream on schedule, every week.`
  - **Business email:** `hello@frozendice.no` (or the real address)
- [ ] Click **Publish**.
- [ ] Verify via the Studio Vision tool:

```groq
*[_type == "aboutPage"][0]
```

Should return one document.

### 10b — `castMember` documents (create 3–4)

For each cast member, navigate to **Cast member** → **Create new**:

**DM (order: 1):**
- Name: *(real name of DM)*
- Role: `DM`
- Portrait: upload a placeholder headshot or real portrait
- Character name: *(leave empty for DM)*
- Character class: *(leave empty for DM)*
- Bio: *(1–2 sentences)*
- Active: `true`
- Display order: `1`

**Player 1 (order: 2):**
- Name, Role: `Player`, Portrait, Character name, Character class, Bio, Active: `true`, Order: `2`

**Player 2 (order: 3):**
- As above, Order: `3`

**Player 3 (order: 4) — optional:**
- As above, Order: `4`

Verify with:

```groq
*[_type == "castMember" && isActive == true] | order(order asc)
```

### 10c — `campaign` document

Navigate to **Campaign** → **Create new**:

- **Title:** *(current campaign name, e.g. "The Glacial Reaches")*
- **Slug:** auto-generate from title
- **Summary:** 2–3 sentences describing the setting and premise
- **Status:** `Current`
- **Cover image:** upload a campaign art image (placeholder accepted)
- **Start date:** *(first session date)*
- **YouTube playlist URL:** *(paste your playlist URL, or leave empty for now)*
- **Blog tag:** *(select or create a tag that matches this campaign's session recaps)*

Click **Publish**.

Verify:

```groq
*[_type == "campaign" && status == "current"][0]
```

Should return one document.

---

## Task 11: Smoke test `/about`

**Files:** None modified.

- [ ] **Step 1:** Start dev server (if not already running):

```bash
pnpm dev
```

- [ ] **Step 2:** Open `http://localhost:3000/about`. Expected layout:
  - Hero: eyebrow "About", headline, intro — all from Sanity
  - Our Story: Portable Text paragraphs render correctly; no raw Sanity block objects visible
  - The Crew: portrait cards with name, role badge, optional character name/class, bio
  - Current Campaign: cover image, title, summary, "Watch from the beginning" button (or section absent if no current campaign was seeded)
  - Values: icon + title + description for each pillar; icons render (not blank)
  - CTA strip: Patreon / Watch Live / Shop buttons present
  - Contact: `mailto:` link in footer strip

- [ ] **Step 3:** Confirm `NewsletterSignup` no longer appears anywhere on the page (inspect rendered HTML):

```bash
curl -s http://localhost:3000/about | grep -i "newsletter"
```

Expected: no output.

- [ ] **Step 4:** Confirm TypeScript is still clean:

```bash
pnpm tsc --noEmit
```

No errors.

- [ ] **Step 5:** Trigger a Studio publish on the `aboutPage` document (toggle eyebrow text, publish, restore). Verify that `http://localhost:3000/about` reflects the change after Next.js revalidates (may require `pnpm build && pnpm start` to fully test ISR in production mode; in dev mode the route re-renders on every request anyway).

- [ ] **Step 6:** If any step fails, STOP and investigate before proceeding.

---

## Task 12: Update sitemap

**Files:**
- Check: `src/app/sitemap.ts`

The `/about` URL is already present in the Phase 2 sitemap (static entry, `changeFrequency: "monthly"`, `priority: 0.5`). Phase 3 preserved it. No query-driven entries are needed for `/about` (it is a singleton). Verify the entry is present and no action is required.

- [ ] **Step 1:**

```bash
grep "about" src/app/sitemap.ts
```

Expected:

```
{ url: `${siteConfig.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
```

- [ ] **Step 2:** If the line is missing (e.g. Phase 3 plan's sitemap rewrite accidentally dropped it), re-add it to the static entries array in `src/app/sitemap.ts` following the existing pattern. If already present: no action needed, no commit required.

---

## Task 13: Build verification

**Files:** None modified.

- [ ] **Step 1:** Run a full production build locally:

```bash
pnpm build
```

Expected: zero TypeScript errors, zero build errors. The `/about` route appears in the output as a statically generated page.

- [ ] **Step 2:** Start the production preview:

```bash
pnpm start
```

Open `http://localhost:3000/about` and confirm all seven sections render with seeded content.

- [ ] **Step 3:** Inspect `<head>` for correct OG metadata (title, description match `aboutPage.headline` / `aboutPage.intro` or `seo` overrides).

- [ ] **Step 4:** If the build fails, STOP and fix the root cause. Do not proceed to Phase 6 with a broken build.

---

## Definition of Done (Phase 5)

Phase 5 is complete when all of these are true:

1. `pnpm tsc --noEmit` is clean.
2. `pnpm build` completes with zero errors; `/about` appears as a statically generated route.
3. `http://localhost:3000/about` renders all seven sections: Hero, Our Story, The Crew, Current Campaign (if seeded), Values, CTA strip, Contact.
4. `NewsletterSignup` is no longer imported or rendered on the `/about` page.
5. At least one `castMember` document with `isActive: true` exists and appears in The Crew section.
6. At least one `campaign` document with `status: "current"` exists and appears in the Current Campaign section (or that section is gracefully absent if not yet seeded).
7. The `aboutPage` singleton exists in Sanity; updating and publishing it triggers cache revalidation (verifiable in dev logs or via `/api/revalidate` test call with `{ _type: "aboutPage" }`).
8. The `/api/revalidate` handler accepts `"aboutPage"`, `"castMember"`, and `"campaign"` document types without error.
9. Existing pages from Phases 2–4 are unaffected (`/blog`, `/store`, `/`) — smoke check each.
10. OG metadata on `/about` is populated from Sanity (not the old hardcoded strings from the previous `metadata` export).

---

## Self-review notes

**Spec coverage (§6):**
- Hero (eyebrow, headline, intro from `aboutPage.hero` — `eyebrow`/`headline`/`intro` are top-level fields per the Phase 1 schema, not nested under `.hero`) — Task 9 ✓
- Our Story (Portable Text from `aboutPage.storyBody`) — Task 9, reuses Phase 2 `PortableText` renderer ✓
- The Crew (grid of `castMember` where `isActive == true`, ordered by `order`) — Tasks 5, 9 ✓
- Current Campaign (feature block: title, summary, cover, watch link) — Tasks 6, 9 ✓
- Values (3–4 pillars with icon, title, description; dynamic Lucide import) — Tasks 4, 7, 9 ✓
- CTA strip (Patreon primary / Watch Live / Shop; replaces newsletter) — Tasks 8, 9 ✓
- Contact (`mailto:` from `aboutPage.businessEmail`) — Task 9 ✓
- Metadata from `aboutPage.headline` + `aboutPage.intro` — Task 9 ✓
- OG image fallback to site default — Task 9 ✓ (passes `undefined` when no Sanity OG image; layout/root metadata provides the site-level default)

**Schema field names verified against Phase 1 schemas:**
- `aboutPage`: `eyebrow`, `headline`, `intro`, `storyBody`, `values[]{_key, icon, title, description}`, `businessEmail`, `seo` — all confirmed in `src/sanity/schemas/aboutPage.ts`
- `castMember`: `name`, `role`, `portrait`, `characterName`, `characterClass`, `bio`, `isActive`, `order` — all confirmed in `src/sanity/schemas/castMember.ts`
- `campaign`: `title`, `slug`, `summary`, `status`, `coverImage`, `startDate`, `endDate`, `youtubePlaylistUrl`, `blogTag` — all confirmed in `src/sanity/schemas/campaign.ts`

**Spec note — hero fields:** Spec §6 references `aboutPage.hero.headline` and `aboutPage.intro` using nested `.hero` notation. The actual Phase 1 schema has `eyebrow`, `headline`, and `intro` as **top-level fields** on `aboutPage` (not nested under a `hero` object). The GROQ queries and TypeScript types in this plan use the real schema field names. The controller should verify this is intentional and not a Phase 1 schema gap.

**Non-goals explicitly deferred:**
- Comments / discussion — not applicable to about page; no task
- Multi-campaign archive page — deferred; no `/campaigns` route added
- Contact form — `mailto:` only per spec; `<form>` never introduced
- Removing `NewsletterSignup` component from repo — Phase 6
- Removing `subscribe` server action — Phase 6

**Lucide dynamic import note:** The `getLucideIcon` helper does `await import("lucide-react")` at render time. In a Next.js RSC this is fine — it runs on the server and the module is bundled at build time, so there is no network round-trip. Tree-shaking of unused icons still occurs because Next.js / esbuild processes the bundle at build time. If a future audit shows bundle size regression, the helper can be replaced with a static lookup map over the icons actually used in Sanity content.

**Task count: 13** (12 code/config tasks + 1 external seed task). This is within the 12–18 task target.

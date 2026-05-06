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
import { urlForImage } from "@/sanity/image";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage();
  if (!about) {
    return {
      title: "About",
      description: "Learn about Frozen Dice.",
      alternates: { canonical: "/about" },
    };
  }

  const title = about.seo?.title ?? about.headline;
  const description = about.seo?.description ?? about.intro;
  const ogImage = about.seo?.ogImage
    ? [
        {
          url: urlForImage(about.seo.ogImage)
            .width(1200)
            .height(630)
            .auto("format")
            .url(),
          width: 1200,
          height: 630,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteConfig.url}/about`,
      images: ogImage,
    },
  };
}

export default async function AboutPage() {
  const [about, castMembers, currentCampaign] = await Promise.all([
    getAboutPage(),
    getActiveCastMembers(),
    getCurrentCampaign(),
  ]);

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

      <section className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold tracking-tight">Our Story</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <PortableText value={about.storyBody} />
          </div>
        </div>
      </section>

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

      {currentCampaign && (
        <section className="border-t bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <CampaignFeature campaign={currentCampaign} />
          </div>
        </section>
      )}

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

      <section className="border-t py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <CtaStrip />
        </div>
      </section>

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

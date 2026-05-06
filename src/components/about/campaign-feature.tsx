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

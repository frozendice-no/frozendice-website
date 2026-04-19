import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { TagRef } from "@/sanity/types";

export function TagFilter({
  tags,
  activeTagSlug,
}: {
  tags: TagRef[];
  activeTagSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={cn(
          buttonVariants({
            variant: activeTagSlug ? "outline" : "default",
            size: "sm",
          }),
        )}
      >
        All
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag._id}
          href={`/blog/tag/${tag.slug}`}
          className={cn(
            buttonVariants({
              variant: activeTagSlug === tag.slug ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}

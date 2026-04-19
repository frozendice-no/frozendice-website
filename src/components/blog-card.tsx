import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlForImage } from "@/sanity/image";
import type { PostCard } from "@/sanity/types";

export function BlogCard({ post, readingLabel }: { post: PostCard; readingLabel: string }) {
  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(640).height(360).auto("format").url()
    : null;
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <Card className="h-full border-0 bg-muted/30 transition-colors group-hover:bg-muted/50">
        {coverUrl && (
          <div className="overflow-hidden rounded-t-lg">
            <Image
              src={coverUrl}
              alt={post.coverImage?.alt ?? post.title}
              width={640}
              height={360}
              className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {post.tags.map((tag) => (
              <span
                key={tag._id}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar aria-hidden="true" className="h-3 w-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock aria-hidden="true" className="h-3 w-3" />
              {readingLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

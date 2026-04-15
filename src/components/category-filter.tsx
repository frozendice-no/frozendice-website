import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CategoryFilter({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={cn(
          buttonVariants({
            variant: activeCategory ? "outline" : "default",
            size: "sm",
          }),
        )}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
          className={cn(
            buttonVariants({
              variant:
                activeCategory?.toLowerCase() === cat.toLowerCase()
                  ? "default"
                  : "outline",
              size: "sm",
            }),
          )}
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const productTypes = ["all", "pdf", "map", "bundle"] as const;

export function ProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get("type") ?? "all";

  function handleFilter(type: string) {
    const params = new URLSearchParams(searchParams);
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/store?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {productTypes.map((type) => (
        <button
          key={type}
          onClick={() => handleFilter(type)}
          className={cn(
            buttonVariants({
              variant: activeType === type ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          {type === "all" ? "All" : type.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

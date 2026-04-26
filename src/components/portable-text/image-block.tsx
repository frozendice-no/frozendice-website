import Image from "next/image";
import { urlForImage } from "@/sanity/image";
import type { SanityImage } from "@/sanity/types";

type Props = { value: SanityImage };

export function ImageBlock({ value }: Props) {
  const url = urlForImage(value).width(1200).auto("format").url();
  const alt = value.alt ?? "";
  return (
    <figure className="my-8">
      <Image
        src={url}
        alt={alt}
        width={1200}
        height={675}
        className="w-full rounded-lg object-cover"
      />
      {alt && (
        <figcaption className="mt-2 text-sm text-muted-foreground">{alt}</figcaption>
      )}
    </figure>
  );
}

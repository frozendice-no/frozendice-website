import { PortableText as PortableTextLib, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";

import { ImageBlock } from "./image-block";
import { CodeBlock } from "./code-block";
import { PatreonCtaBlock } from "./patreon-cta-block";

const components: PortableTextComponents = {
  types: {
    image: ImageBlock,
    code: CodeBlock,
    patreonCta: PatreonCtaBlock,
  },
};

type Props = { value: PortableTextBlock[] };

export function PortableText({ value }: Props) {
  return <PortableTextLib value={value} components={components} />;
}

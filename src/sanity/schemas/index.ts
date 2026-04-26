import type { SchemaTypeDefinition } from "sanity";

import { seo } from "./objects/seo";
import { patreonCta } from "./blocks/patreonCta";
import { tag } from "./tag";
import { author } from "./author";
import { post } from "./post";
import { product } from "./product";
import { castMember } from "./castMember";
import { campaign } from "./campaign";
import { aboutPage } from "./aboutPage";
import { patreonPerks } from "./patreonPerks";
import { streamSchedule } from "./streamSchedule";
import { featuredVods } from "./featuredVods";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Shared objects
  seo,
  // Portable Text blocks
  patreonCta,
  // Documents
  tag,
  author,
  post,
  product,
  castMember,
  campaign,
  // Singletons
  aboutPage,
  patreonPerks,
  streamSchedule,
  featuredVods,
];

export const singletonTypes: string[] = [
  "aboutPage",
  "patreonPerks",
  "streamSchedule",
  "featuredVods",
];

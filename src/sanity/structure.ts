import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { singletonTypes } from "./schemas";

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      // Singletons at the top
      S.listItem()
        .title("About page")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.listItem()
        .title("Patreon perks (landing)")
        .id("patreonPerks")
        .child(S.document().schemaType("patreonPerks").documentId("patreonPerks")),
      S.listItem()
        .title("Stream schedule")
        .id("streamSchedule")
        .child(S.document().schemaType("streamSchedule").documentId("streamSchedule")),
      S.listItem()
        .title("Featured VODs")
        .id("featuredVods")
        .child(S.document().schemaType("featuredVods").documentId("featuredVods")),

      S.divider(),

      // All other document types except singletons
      ...S.documentTypeListItems().filter(
        (listItem) => !singletonTypes.includes(listItem.getId() ?? ""),
      ),
    ]);

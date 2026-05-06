import { defineArrayMember, defineField, defineType } from "sanity";

export const featuredVods = defineType({
  name: "featuredVods",
  title: "Featured VODs",
  type: "document",
  fields: [
    defineField({
      name: "vods",
      title: "Featured VODs",
      type: "array",
      validation: (rule) => rule.min(1).max(6),
      of: [
        defineArrayMember({
          type: "object",
          name: "vod",
          fields: [
            defineField({
              name: "youtubeVideoId",
              title: "YouTube video ID",
              type: "string",
              description: "The 11-character ID from the video URL.",
              validation: (rule) => rule.required().length(11),
            }),
            defineField({
              name: "title",
              title: "Title override",
              type: "string",
              description: "Optional. Falls back to the YouTube title.",
            }),
            defineField({
              name: "isShort",
              title: "Is a YouTube Short?",
              type: "boolean",
              initialValue: false,
              description:
                "When true, the lightbox renders this video at 9:16 (vertical). The grid thumbnail stays 16:9 with a 'Shorts' badge.",
            }),
          ],
          preview: { select: { title: "title", subtitle: "youtubeVideoId" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Featured VODs" };
    },
  },
});

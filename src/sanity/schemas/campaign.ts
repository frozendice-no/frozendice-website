import { defineField, defineType } from "sanity";

export const campaign = defineType({
  name: "campaign",
  title: "Campaign",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Current", value: "current" },
          { title: "Upcoming", value: "upcoming" },
          { title: "Past", value: "past" },
        ],
      },
      initialValue: "upcoming",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "startDate", title: "Start date", type: "date" }),
    defineField({ name: "endDate", title: "End date", type: "date" }),
    defineField({
      name: "youtubePlaylistUrl",
      title: "YouTube playlist URL",
      type: "url",
    }),
    defineField({
      name: "blogTag",
      title: "Blog tag",
      type: "reference",
      to: [{ type: "tag" }],
      description: "Used to surface related session recaps.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "status", media: "coverImage" },
  },
});

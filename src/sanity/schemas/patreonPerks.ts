import { defineArrayMember, defineField, defineType } from "sanity";

export const patreonPerks = defineType({
  name: "patreonPerks",
  title: "Patreon perks (landing section)",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      initialValue: "Patreon",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      initialValue: "The full saga lives here.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Intro body",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: "patreonUrl",
      title: "Patreon URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cards",
      title: "Perk cards (page stack)",
      type: "array",
      validation: (rule) => rule.min(4).max(5),
      of: [
        defineArrayMember({
          type: "object",
          name: "perkCard",
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: "e.g. 'Campaign map', 'NPC portrait'",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "blurb",
              title: "Blurb",
              type: "text",
              rows: 2,
              validation: (rule) => rule.required().max(150),
            }),
          ],
          preview: { select: { title: "label", subtitle: "blurb", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "tiers",
      title: "Tier summary (optional)",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "tierSummary",
          fields: [
            defineField({ name: "name", title: "Tier name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "price", title: "Price (display)", type: "string", description: "e.g. '$5/mo'" }),
            defineField({ name: "summary", title: "Summary", type: "text", rows: 2, validation: (r) => r.required().max(150) }),
          ],
          preview: { select: { title: "name", subtitle: "price" } },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Patreon perks section" };
    },
  },
});

import { defineField, defineType } from "sanity";

export const castMember = defineType({
  name: "castMember",
  title: "Cast member",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Real name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "DM", value: "dm" },
          { title: "Player", value: "player" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "characterName",
      title: "Character name",
      type: "string",
      description: "Current campaign character. Leave empty for the DM.",
    }),
    defineField({
      name: "characterClass",
      title: "Character class",
      type: "string",
      description: "e.g. Paladin, Warlock, etc.",
    }),
    defineField({
      name: "bio",
      title: "Short bio",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      description: "Currently part of the streaming cast.",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first.",
      initialValue: 10,
    }),
  ],
  orderings: [
    { title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "portrait" },
  },
});

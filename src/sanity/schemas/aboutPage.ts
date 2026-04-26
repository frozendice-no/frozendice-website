import { defineArrayMember, defineField, defineType } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Hero eyebrow",
      type: "string",
      initialValue: "About",
    }),
    defineField({
      name: "headline",
      title: "Hero headline",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Hero intro",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "storyBody",
      title: "Our story",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "values",
      title: "Values / pillars",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "value",
          fields: [
            defineField({ name: "icon", title: "Icon name (Lucide)", type: "string", description: "e.g. 'dice-5', 'map-pin', 'flame'" }),
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 2, validation: (r) => r.required().max(200) }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
      validation: (rule) => rule.min(3).max(4),
    }),
    defineField({
      name: "businessEmail",
      title: "Business email",
      type: "email",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    prepare() {
      return { title: "About page" };
    },
  },
});

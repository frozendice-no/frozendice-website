import { defineArrayMember, defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Used on cards and as OG description fallback. ~25 words.",
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Promote to the featured slot on /blog.",
      initialValue: false,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
        defineArrayMember({
          type: "code",
          options: { language: "typescript", languageAlternatives: [
            { title: "TypeScript", value: "typescript" },
            { title: "JavaScript", value: "javascript" },
            { title: "Shell", value: "shell" },
            { title: "JSON", value: "json" },
            { title: "Markdown", value: "markdown" },
          ] },
        }),
        defineArrayMember({ type: "patreonCta" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt", media: "coverImage" },
  },
});

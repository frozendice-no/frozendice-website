import { defineArrayMember, defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 2,
      description: "~15 words. Used on product cards and as OG description fallback.",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      description: "Rich text shown on the product detail page.",
    }),
    defineField({
      name: "priceInCents",
      title: "Price (in cents)",
      type: "number",
      description: "Price in smallest currency unit. 999 = $9.99.",
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      options: { list: ["usd", "eur", "nok"] },
      initialValue: "usd",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "productType",
      title: "Product type",
      type: "string",
      options: {
        list: [
          { title: "PDF / Adventure", value: "pdf" },
          { title: "Map pack", value: "map" },
          { title: "Bundle", value: "bundle" },
          { title: "Physical", value: "physical" },
          { title: "Other", value: "other" },
        ],
      },
      initialValue: "pdf",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r) => r.required() }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
      ],
    }),
    defineField({
      name: "digitalFile",
      title: "Digital file URL (Vercel Blob)",
      type: "url",
      description: "Vercel Blob URL for digital products. Leave empty for physical products.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
    }),
    defineField({
      name: "featured",
      title: "Featured on landing page",
      type: "boolean",
      description: "Appears in the 3-up featured grid on the landing page.",
      initialValue: false,
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      description: "Unpublished products are hidden from the store.",
      initialValue: false,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
    { title: "Price low to high", name: "priceAsc", by: [{ field: "priceInCents", direction: "asc" }] },
    { title: "Price high to low", name: "priceDesc", by: [{ field: "priceInCents", direction: "desc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "productType", media: "heroImage" },
  },
});

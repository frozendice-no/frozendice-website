import { defineArrayMember, defineField, defineType } from "sanity";

export const privacyPolicy = defineType({
  name: "privacyPolicy",
  title: "Privacy Policy",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Privacy Policy",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lastUpdated",
      title: "Last updated",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Introduction",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "section",
          fields: [
            defineField({
              name: "heading",
              title: "Heading",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              title: "Body",
              type: "array",
              of: [defineArrayMember({ type: "block" })],
            }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
    }),
    defineField({
      name: "dataControllerName",
      title: "Data controller name",
      type: "string",
      initialValue: "Bru & Broch AS",
    }),
    defineField({
      name: "dataControllerOrgNumber",
      title: "Org number",
      type: "string",
      initialValue: "932 104 822",
    }),
    defineField({
      name: "dataControllerAddress",
      title: "Postal address",
      type: "text",
      rows: 3,
      description: "Multi-line address; rendered with line breaks preserved.",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Privacy Policy" };
    },
  },
});

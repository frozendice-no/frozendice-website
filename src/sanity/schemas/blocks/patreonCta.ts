import { defineField, defineType } from "sanity";

export const patreonCta = defineType({
  name: "patreonCta",
  title: "Patreon CTA",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Want more?",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 3,
      description: "One or two sentences framing the CTA.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "buttonLabel",
      title: "Button label",
      type: "string",
      initialValue: "Join on Patreon",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { heading: "heading" },
    prepare({ heading }) {
      return { title: `Patreon CTA: ${heading ?? "(no heading)"}` };
    },
  },
});

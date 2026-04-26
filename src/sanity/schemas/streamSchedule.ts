import { defineArrayMember, defineField, defineType } from "sanity";

export const streamSchedule = defineType({
  name: "streamSchedule",
  title: "Stream schedule",
  type: "document",
  fields: [
    defineField({
      name: "youtubeChannelId",
      title: "YouTube channel ID",
      type: "string",
      description: "Used by the hero player embed and the LIVE pill poll.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "upcoming",
      title: "Upcoming sessions",
      type: "array",
      validation: (rule) => rule.max(3),
      of: [
        defineArrayMember({
          type: "object",
          name: "upcomingSession",
          fields: [
            defineField({ name: "title", title: "Session title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "scheduledAt", title: "Scheduled at", type: "datetime", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 2, validation: (r) => r.max(200) }),
          ],
          preview: { select: { title: "title", subtitle: "scheduledAt" } },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Stream schedule" };
    },
  },
});

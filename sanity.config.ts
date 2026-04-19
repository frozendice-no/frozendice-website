import { defineConfig, type DocumentActionsResolver } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { codeInput } from "@sanity/code-input";

import { schemaTypes, singletonTypes } from "./src/sanity/schemas";
import { structure } from "./src/sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

const disallowedSingletonActions = new Set(["unpublish", "delete", "duplicate"]);

const documentActions: DocumentActionsResolver = (prev, { schemaType }) => {
  if (singletonTypes.includes(schemaType)) {
    return prev.filter((action) => !disallowedSingletonActions.has(action.action ?? ""));
  }
  return prev;
};

export default defineConfig({
  name: "frozendice",
  title: "FrozenDice",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.includes(schemaType)),
  },
  document: { actions: documentActions },
});

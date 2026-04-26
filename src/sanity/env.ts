export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET",
);

export const apiVersion = "2025-03-04";

export const readToken = process.env.SANITY_API_READ_TOKEN;
export const writeToken = process.env.SANITY_API_WRITE_TOKEN;
export const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }
  return v;
}

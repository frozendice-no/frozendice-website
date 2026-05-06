import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { getPrivacyPolicy } from "@/sanity/queries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FrozenDice collects, uses, and protects your personal information. Editable by the data controller via Sanity Studio.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const policy = await getPrivacyPolicy();

  if (!policy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted-foreground">
          The privacy policy is being prepared. Please check back shortly.
        </p>
      </div>
    );
  }

  const updated = new Date(policy.lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {policy.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {updated}
      </p>

      {policy.intro && (
        <div className="prose prose-stone mt-8 dark:prose-invert">
          <PortableText value={policy.intro} />
        </div>
      )}

      {policy.sections?.map((section) => (
        <section key={section._key} className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          {section.body && (
            <div className="prose prose-stone mt-4 dark:prose-invert">
              <PortableText value={section.body} />
            </div>
          )}
        </section>
      ))}

      {(policy.dataControllerName ||
        policy.dataControllerAddress ||
        policy.contactEmail) && (
        <section className="mt-12 rounded-lg border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold">Data controller</h2>
          {policy.dataControllerName && (
            <p className="mt-2 font-medium">{policy.dataControllerName}</p>
          )}
          {policy.dataControllerOrgNumber && (
            <p className="text-sm text-muted-foreground">
              Org. nr. {policy.dataControllerOrgNumber}
            </p>
          )}
          {policy.dataControllerAddress && (
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {policy.dataControllerAddress}
            </p>
          )}
          {policy.contactEmail && (
            <p className="mt-3 text-sm">
              Email:{" "}
              <a
                href={`mailto:${policy.contactEmail}`}
                className="underline hover:text-foreground"
              >
                {policy.contactEmail}
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

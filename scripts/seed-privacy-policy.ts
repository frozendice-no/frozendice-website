#!/usr/bin/env -S pnpm tsx
/**
 * One-shot: seed (or replace) the privacyPolicy singleton with a starter
 * Norwegian/EU GDPR draft. Treat the resulting document as a FIRST PASS that
 * the data controller (and ideally a Norwegian privacy-law specialist)
 * should review before relying on legally. It is NOT legal advice.
 *
 * Run via:
 *   set -a && source .env.local && set +a && pnpm tsx scripts/seed-privacy-policy.ts
 *
 * Re-running overwrites the document, including any edits made via Studio.
 * After the first run, prefer editing via Studio.
 */
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing env: need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

// Helpers to build Portable Text blocks succinctly.
let blockKeyCounter = 0;
function block(text: string, style: "normal" | "h3" = "normal") {
  blockKeyCounter += 1;
  return {
    _type: "block",
    _key: `block-${blockKeyCounter}`,
    style,
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `span-${blockKeyCounter}`,
        text,
        marks: [],
      },
    ],
  };
}

let sectionKeyCounter = 0;
function section(heading: string, paragraphs: string[]) {
  sectionKeyCounter += 1;
  return {
    _type: "section",
    _key: `section-${sectionKeyCounter}`,
    heading,
    body: paragraphs.map((p) => block(p)),
  };
}

const today = new Date().toISOString().split("T")[0];

const policy = {
  // Match the canonical singleton _id used by structure.ts so the doc
  // shows up in the Studio sidebar.
  _id: "privacyPolicy",
  _type: "privacyPolicy",
  title: "Privacy Policy",
  lastUpdated: today,
  intro: [
    block(
      "FrozenDice is operated by Bru & Broch AS, a Norwegian company. This Privacy Policy explains how we collect, use, store, and share information when you visit frozendice.no, watch our streams, follow our blog, or interact with us through Patreon, YouTube, or email.",
    ),
    block(
      "We follow the EU General Data Protection Regulation (GDPR) and the Norwegian Personal Data Act (personopplysningsloven). If anything here is unclear, contact us using the details at the bottom of this page.",
    ),
  ],
  sections: [
    section("Information we collect", [
      "When you visit our site we may collect technical information such as your IP address, browser type, device type, the pages you visit, and how you arrived at our site. This is done through our analytics tools (Google Analytics via Google Tag Manager) — but only after you give consent through our cookie banner.",
      "If you make a purchase from our store, our payment processor Stripe handles your name, billing address, email, and payment details. We never see your full card number. If we send you a transactional email, that delivery is handled by Resend.",
      "If you contact us by email, we keep the email and any information you choose to share for as long as necessary to respond and follow up.",
    ]),
    section("Why we use this information (legal basis)", [
      "Site operation, security, and abuse prevention — legitimate interest (GDPR art. 6(1)(f)).",
      "Analytics and website improvement — your consent (GDPR art. 6(1)(a)). You can withdraw consent at any time using the 'Manage cookies' link in the footer.",
      "Order processing and digital delivery — performance of contract (GDPR art. 6(1)(b)).",
      "Bookkeeping and tax records — legal obligation (GDPR art. 6(1)(c)) under Norwegian bookkeeping law (bokføringsloven).",
    ]),
    section("Cookies and similar technologies", [
      "We use cookies and localStorage in two categories. Necessary cookies are required for the site to function and include your cookie consent choice itself. Analytics cookies (Google Analytics) are loaded only if you click 'Accept' on our cookie banner; they help us understand which content people use most.",
      "You can change your decision anytime by clicking 'Manage cookies' in the footer. You can also block cookies in your browser settings, though some site features may not work as well.",
    ]),
    section("Who we share information with", [
      "We share information only with service providers who need it to operate the site or deliver our service:",
      "Vercel (US/EU) — hosting and content delivery.",
      "Sanity (US/EU) — content management for the blog, store, and this privacy policy itself.",
      "Stripe (US/Ireland) — payment processing for store purchases.",
      "Resend (US) — transactional email delivery.",
      "Google (US) — analytics, only with your consent.",
      "YouTube (US, Google) — when you watch an embedded video; YouTube applies its own privacy practices.",
      "Most of these providers are based in or operate from countries outside the EU/EEA. Where personal data is transferred, we rely on the European Commission's Standard Contractual Clauses or equivalent safeguards.",
    ]),
    section("How long we keep your information", [
      "Analytics data is retained according to Google Analytics defaults (currently 14 months) and is then automatically deleted.",
      "Order and payment records are retained for at least five years after the calendar year in which the transaction occurred, as required by Norwegian bookkeeping law.",
      "Email correspondence is retained as long as needed to handle your enquiry, then deleted.",
    ]),
    section("Your rights under GDPR", [
      "You have the right to ask us for a copy of the personal information we hold about you (right of access).",
      "You have the right to ask us to correct inaccurate information about you (rectification).",
      "You have the right to ask us to delete your information when we no longer need it for the purpose we collected it (erasure).",
      "You have the right to ask us to restrict or object to certain types of processing (restriction, objection).",
      "You have the right to receive a copy of your information in a structured, commonly used format and ask us to send it to another provider (portability), where the processing is based on your consent or a contract.",
      "You have the right to withdraw your consent at any time, without affecting the lawfulness of processing carried out before you withdrew consent.",
      "To exercise any of these rights, contact us at the email address below.",
    ]),
    section("Children", [
      "Our services are not directed at children under 13. If you believe we have collected information from a child under 13, please contact us and we will delete it.",
    ]),
    section("Complaints", [
      "If you believe we are not handling your personal information correctly, please contact us first so we can try to resolve it. You also have the right to lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet) — https://www.datatilsynet.no.",
    ]),
    section("Changes to this policy", [
      "We may update this Privacy Policy from time to time. The 'Last updated' date at the top of the page reflects the most recent change. Material changes will be communicated through a banner on our site and, where appropriate, by email.",
    ]),
  ],
  dataControllerName: "Bru & Broch AS",
  dataControllerOrgNumber: "932 104 822",
  dataControllerAddress: "Norway",
  contactEmail: "kontakt@frozendice.no",
};

async function main() {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "privacyPolicy"][0] { _id }`,
  );
  console.log("Existing document:", existing?._id ?? "(none)");

  if (existing?._id) {
    policy._id = existing._id;
  }

  const result = await client.createOrReplace(policy);
  console.log("Wrote:", result._id);
  console.log("Sections:", policy.sections.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

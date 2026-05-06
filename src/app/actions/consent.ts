"use server";

import { cookies } from "next/headers";

const CONSENT_COOKIE = "cookie-consent";
const HALF_YEAR_SECONDS = 60 * 60 * 24 * 180;

export type ConsentValue = "accepted" | "declined";

export async function setConsent(value: ConsentValue): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: CONSENT_COOKIE,
    value,
    path: "/",
    maxAge: HALF_YEAR_SECONDS,
    sameSite: "lax",
    // localhost dev runs on http; Vercel preview + production are https.
    secure: process.env.NODE_ENV === "production",
  });
}

// Used by the "Manage cookies" footer button. Removing the cookie causes the
// next render to see no consent and re-show the banner.
export async function clearConsent(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CONSENT_COOKIE);
}

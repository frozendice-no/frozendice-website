"use server";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type SubscribeResult =
  | { success: true }
  | { success: false; error: string };

export async function subscribe(formData: FormData): Promise<SubscribeResult> {
  const honeypot = formData.get("website");
  if (honeypot) return { success: true };

  const email = formData.get("email");
  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    await db.insert(subscribers).values({ email: trimmed }).onConflictDoNothing();
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Frozen Dice <hello@send.frozendice.no>",
        to: trimmed,
        subject: "Welcome to Frozen Dice!",
        react: WelcomeEmail(),
      });
    } catch {
      // Subscription succeeded even if email fails
    }
  }

  return { success: true };
}

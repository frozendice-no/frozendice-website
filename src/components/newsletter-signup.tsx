"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/actions/subscribe";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type State = { success?: boolean; error?: string } | null;

async function subscribeAction(_prev: State, formData: FormData): Promise<State> {
  const result = await subscribe(formData);
  if (result.success) {
    trackEvent({ name: "newsletter_signup" });
  }
  return result;
}

export function NewsletterSignup({ className }: { className?: string }) {
  const [state, action, pending] = useActionState(subscribeAction, null);

  if (state?.success) {
    return (
      <div className={cn("rounded-lg bg-primary/5 p-6 text-center", className)}>
        <p className="font-medium text-primary">You're in!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your inbox for a welcome email from Frozen Dice.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          name="website"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(buttonVariants({ size: "default" }))}
        >
          {pending ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PatreonCtaValue = {
  heading: string;
  body: string;
  buttonLabel: string;
};

type Props = { value: PatreonCtaValue };

export function PatreonCtaBlock({ value }: Props) {
  return (
    <aside className="my-10 rounded-xl border bg-primary/5 p-6 not-prose">
      <h3 className="text-xl font-semibold">{value.heading}</h3>
      <p className="mt-2 text-muted-foreground">{value.body}</p>
      <Link
        href="https://www.patreon.com/frozendice"
        className={cn(buttonVariants(), "mt-4")}
      >
        {value.buttonLabel}
      </Link>
    </aside>
  );
}

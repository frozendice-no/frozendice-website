"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Dice5 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PATREON_URL = "https://www.patreon.com/c/FrozenDice";

const navLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        SVG filter producing a turbulent displacement, applied below to the
        snow-shell layer behind the crisp content. The displacement makes
        the shell's edges look wavy / flurried rather than geometric.
        High baseFrequency + small scale = subtle, snow-grain edge.
      */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="snow-flurry">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed="3"
            />
            <feDisplacementMap in="SourceGraphic" scale="5" />
          </filter>
        </defs>
      </svg>

      <header className="fixed inset-x-0 top-4 z-50 px-4">
        <div className="relative mx-auto w-fit">
          {/* Outer halo: a soft, generously-blurred white glow that
              fades into whatever's behind the header. Reads as "snow
              light" against the dark dice hero. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 rounded-full bg-white/20 blur-2xl"
          />

          {/* Snow shell: white shape with the turbulence filter applied
              so its outer edge is irregular/flurried. Sits behind the
              crisp content layer. */}
          <div
            aria-hidden="true"
            className="snow-flurry-edge absolute -inset-[3px] rounded-full bg-white/70"
          />

          {/* Crisp content pill */}
          <div className="relative flex h-14 items-center gap-4 rounded-full border border-white/60 bg-white/95 px-5 shadow-xl shadow-blue-950/10 backdrop-blur-md sm:gap-6 sm:px-7">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold text-stone-900"
            >
              <Dice5 aria-hidden="true" className="h-5 w-5 text-primary" />
              <span>Frozen Dice</span>
            </Link>

            <nav
              aria-label="Main"
              className="hidden items-center gap-6 md:flex"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={PATREON_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "border-0 bg-[#FF424D] text-white hover:bg-[#e63a45]",
                )}
              >
                Become a Patron
              </Link>
            </nav>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "md:hidden",
                )}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Dice5
                      aria-hidden="true"
                      className="h-5 w-5 text-primary"
                    />
                    Frozen Dice
                  </SheetTitle>
                </SheetHeader>
                <nav
                  aria-label="Mobile"
                  className="mt-8 flex flex-col gap-4 px-4"
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={PATREON_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants(),
                      "mt-4 border-0 bg-[#FF424D] text-white hover:bg-[#e63a45]",
                    )}
                  >
                    Become a Patron
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}

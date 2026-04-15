import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frozendice.no"),
  title: {
    default: "Frozen Dice — Norwegian D&D Community",
    template: "%s | Frozen Dice",
  },
  description:
    "Frozen Dice is a Norwegian Dungeons & Dragons community offering campaign resources, battle maps, digital products, and tabletop RPG content.",
  keywords: [
    "D&D",
    "Dungeons and Dragons",
    "tabletop RPG",
    "Norway",
    "battle maps",
    "campaign resources",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://frozendice.no",
    siteName: "Frozen Dice",
    title: "Frozen Dice — Norwegian D&D Community",
    description:
      "Campaign resources, battle maps, and digital products for tabletop RPG players.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frozen Dice — Norwegian D&D Community",
    description:
      "Campaign resources, battle maps, and digital products for tabletop RPG players.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

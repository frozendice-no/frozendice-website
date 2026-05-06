import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  GoogleTagManager,
  GoogleTagManagerNoscript,
} from "@/components/google-tag-manager";
import { CookieConsent } from "@/components/cookie-consent";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/json-ld";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-read the consent cookie set by the setConsent / clearConsent
  // server actions. Mount Google Tag Manager only when consent === "accepted";
  // show the banner whenever the user has not yet decided.
  const consent = (await cookies()).get("cookie-consent")?.value;
  const consentGranted = consent === "accepted";
  const showBanner = consent !== "accepted" && consent !== "declined";

  return (
    <>
      {consentGranted && <GoogleTagManager />}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {consentGranted && <GoogleTagManagerNoscript />}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieConsent open={showBanner} />
    </>
  );
}

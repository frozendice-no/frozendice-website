"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "cookie-consent";

export type ConsentState = "unknown" | "accepted" | "declined";

type ConsentContextValue = {
  state: ConsentState;
  bannerOpen: boolean;
  accept: () => void;
  decline: () => void;
  openBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConsentState>("unknown");
  const [bannerOpen, setBannerOpen] = useState(false);

  // Read persisted choice on mount. If none, show the banner.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      setState(stored);
    } else {
      setBannerOpen(true);
    }
  }, []);

  const accept = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setState("accepted");
    setBannerOpen(false);
  }, []);

  const decline = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "declined");
    setState("declined");
    setBannerOpen(false);
  }, []);

  const openBanner = useCallback(() => {
    setBannerOpen(true);
  }, []);

  return (
    <ConsentContext.Provider
      value={{ state, bannerOpen, accept, decline, openBanner }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider",
    );
  }
  return ctx;
}

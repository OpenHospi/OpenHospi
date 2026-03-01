"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const TRUSTPILOT_BUID = "69a41a474a822941538339a1";

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement, reload: boolean) => void;
    };
  }
}

export function TrustpilotWidget({ locale }: { locale: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  const localeMap: Record<string, string> = { nl: "nl-NL", de: "de-DE" };
  const tpLocale = localeMap[locale] ?? "en-US";

  return (
    <>
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (ref.current && window.Trustpilot) {
            window.Trustpilot.loadFromElement(ref.current, true);
          }
        }}
      />
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale={tpLocale}
        data-template-id="5419b6a8b0d04a076446a9ad"
        data-businessunit-id={TRUSTPILOT_BUID}
        data-style-height="24px"
        data-style-width="100%"
        data-theme="dark"
      >
        <a
          href="https://nl.trustpilot.com/review/openhospi.nl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}

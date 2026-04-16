"use client";

import { useEffect, useState } from "react";
import { events } from "@/lib/analytics";
import { nl } from "@/content/nl";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-white border-t border-surface-200 md:hidden">
      <a
        href="/demo"
        onClick={() => events.stickyCta()}
        className="btn-primary w-full text-center block py-3.5"
      >
        {nl.stickyCta.text}
      </a>
      <p className="text-center text-xs text-surface-400 mt-1">
        {nl.stickyCta.subtext}
      </p>
    </div>
  );
}

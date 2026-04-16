"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface-50/80 backdrop-blur-lg border-b border-surface-100/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">SC</span>
            </div>
            <span className="text-base font-semibold text-surface-900 tracking-tight">
              {nl.nav.logo}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#hoe-het-werkt"
              className="text-sm text-surface-500 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.howItWorks}
            </a>
            <a
              href="#testimonials"
              className="text-sm text-surface-500 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.pricing}
            </a>
            <Link
              href="/demo"
              className="text-sm text-surface-500 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.demo}
            </Link>
            <Link
              href="/login"
              className="text-sm text-surface-500 hover:text-surface-900 transition-colors"
            >
              Inloggen
            </Link>
            <Link
              href="/demo"
              onClick={() => events.ctaClick("header", "primary")}
              className="btn-primary text-sm px-5 py-2"
            >
              {nl.nav.cta}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-surface-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-surface-100/40">
            <div className="flex flex-col gap-3">
              <a
                href="#hoe-het-werkt"
                className="text-surface-500 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.howItWorks}
              </a>
              <a
                href="#testimonials"
                className="text-surface-500 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.pricing}
              </a>
              <Link
                href="/demo"
                className="text-surface-500 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.demo}
              </Link>
              <Link
                href="/login"
                className="text-surface-500 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                Inloggen
              </Link>
              <Link href="/demo" className="btn-primary text-center text-sm">
                {nl.nav.cta}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

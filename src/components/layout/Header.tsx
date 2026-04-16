"use client";

import { useState } from "react";
import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-surface-900">
              {nl.nav.logo}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#hoe-het-werkt"
              className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.howItWorks}
            </a>
            <a
              href="#hoe-het-werkt"
              className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.pricing}
            </a>
            <Link
              href="/demo"
              className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              {nl.nav.links.demo}
            </Link>
            <Link
              href="/login"
              className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              Inloggen
            </Link>
            <Link
              href="/demo"
              onClick={() => events.ctaClick("header", "primary")}
              className="btn-primary text-sm px-4 py-2"
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
          <div className="md:hidden py-3 border-t border-surface-200">
            <div className="flex flex-col gap-3">
              <a
                href="#hoe-het-werkt"
                className="text-surface-600 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.howItWorks}
              </a>
              <a
                href="#hoe-het-werkt"
                className="text-surface-600 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.pricing}
              </a>
              <Link
                href="/demo"
                className="text-surface-600 hover:text-surface-900 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                {nl.nav.links.demo}
              </Link>
              <Link
                href="/login"
                className="text-surface-600 hover:text-surface-900 text-sm py-1"
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

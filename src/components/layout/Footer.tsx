import Link from "next/link";
import { nl } from "@/content/nl";

export function Footer() {
  return (
    <footer className="bg-surface-900 text-surface-300 pb-24 md:pb-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white"
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
              <span className="text-sm font-bold text-white">Speed Leads</span>
            </div>
            <p className="text-surface-400 text-sm">{nl.footer.tagline}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              {nl.footer.links.privacy}
            </Link>
            <Link href="/voorwaarden" className="hover:text-white transition-colors">
              {nl.footer.links.terms}
            </Link>
            <Link href="/verwerkersovereenkomst" className="hover:text-white transition-colors">
              {nl.footer.links.dpa}
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              {nl.footer.links.contact}
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-800 text-xs text-surface-500">
          {nl.footer.copyright}
        </div>
      </div>
    </footer>
  );
}

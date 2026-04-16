import Link from "next/link";
import { nl } from "@/content/nl";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-surface-800 text-surface-300 pb-24 md:pb-0">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          {/* Brand */}
          <div>
            <div className="mb-2">
              <Logo size="sm" />
            </div>
            <p className="text-surface-400 text-sm">{nl.footer.tagline}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
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

        <div className="mt-8 pt-8 border-t border-surface-700 text-xs text-surface-500">
          {nl.footer.copyright}
        </div>
      </div>
    </footer>
  );
}

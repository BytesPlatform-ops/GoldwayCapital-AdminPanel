import Link from "next/link";
import { BRAND, NAV } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-widest text-navy-700">GOLDWAY CAPITAL</span>
          <span className="text-[11px] tracking-wide text-gold-600">{BRAND.tagline.toUpperCase()}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-navy-700">
          {NAV.slice(1).map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-gold-600">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy-100 bg-navy-700 text-navy-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-lg font-bold tracking-widest text-gold-500">GOLDWAY CAPITAL</div>
            <p className="mt-2 text-sm">{BRAND.tagline}. Educational guidance for adults 55+.</p>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">Explore</div>
            <ul className="space-y-1 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-gold-400">{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">Legal</div>
            <ul className="space-y-1 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-gold-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold-400">Terms</Link></li>
            </ul>
            <p className="mt-4 text-xs text-navy-100/70">
              We are not connected with or endorsed by the U.S. government or the federal Medicare program.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-navy-600 pt-4 text-xs text-navy-100/70">
          © {new Date().getFullYear()} Goldway Capital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

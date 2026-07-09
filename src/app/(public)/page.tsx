import Link from "next/link";
import { BRAND, LIFE_EVENTS, SERVICE_PAGES } from "@/lib/site";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold-500">{BRAND.tagline}</p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{BRAND.headline}</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-navy-100 md:text-xl">{BRAND.subheadline}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={BRAND.primaryCta.href} className="btn-gold text-lg">{BRAND.primaryCta.label}</Link>
            <Link href={BRAND.secondaryCta.href} className="btn border border-white/40 bg-transparent text-lg text-white hover:bg-white/10">
              {BRAND.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Life events */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-navy-800">Guidance for life's important moments</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">
          We lead with your situation, not a product. Wherever you are, we'll help you understand your options.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {LIFE_EVENTS.map((e) => (
            <Link key={e.q} href={e.href} className="card transition hover:border-gold-500 hover:shadow-md">
              <h3 className="text-lg font-bold text-navy-700">{e.q}</h3>
              <p className="mt-2 text-sm text-gray-600">{e.body}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-gold-600">Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-navy-800">How we help</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(SERVICE_PAGES).map((s) => (
              <div key={s.slug} className="card flex flex-col">
                <h3 className="text-xl font-bold text-navy-700">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600">{s.intro}</p>
                <Link href={`/${s.slug}`} className="btn-primary mt-4 text-sm">Learn more</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-navy-800">A company with real infrastructure and process</h2>
        <p className="mt-3 text-gray-600">
          Educational, trustworthy, and consultative — Goldway Capital is a Senior Solutions company serving adults 55+.
          We take the time to explain your options clearly, at your pace.
        </p>
        <Link href={BRAND.primaryCta.href} className="btn-gold mt-6 text-lg">{BRAND.primaryCta.label}</Link>
      </section>
    </div>
  );
}

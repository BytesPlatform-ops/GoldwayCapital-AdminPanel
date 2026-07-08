import { LeadForm } from "@/components/LeadForm";
import { API_BASE } from "@/lib/api";
import type { ServicePage } from "@/lib/site";

interface Disclosure {
  key: string;
  title: string;
  body: string;
  required: boolean;
}

async function getDisclosures(): Promise<Disclosure[]> {
  try {
    const res = await fetch(`${API_BASE}/compliance/disclosures`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()) as Disclosure[];
  } catch {
    return [];
  }
}

export async function ServicePageView({ page }: { page: ServicePage }) {
  const disclosures = await getDisclosures();
  const relevant = disclosures.filter((d) => d.key === page.disclosureKey || d.key.startsWith(page.disclosureKey));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-navy-800">{page.title}</h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>
          <ul className="mt-6 space-y-3">
            {page.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-1 text-gold-600">✓</span>
                <span className="text-gray-700">{b}</span>
              </li>
            ))}
          </ul>

          {/* Required disclosure block(s) — designed-in per the Service Line Map. */}
          {relevant.length > 0 && (
            <div className="mt-8 space-y-3">
              {relevant.map((d) => (
                <div key={d.key} className="rounded-lg border border-navy-100 bg-white p-4 text-xs text-gray-500">
                  <div className="mb-1 font-semibold text-navy-700">{d.title}</div>
                  {d.body}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-navy-800">{page.cta}</h2>
          <LeadForm source={page.formSource} submitLabel={page.cta} />
        </div>
      </div>
    </div>
  );
}

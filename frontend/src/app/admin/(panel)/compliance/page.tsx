import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

interface Disclosure { id: string; key: string; servicePage: string; title: string; body: string; required: boolean }
interface Rule { id: string; phrase: string; severity: string; category: string; message: string }

export default async function CompliancePage() {
  const [disclosures, rules] = await Promise.all([
    apiGet<Disclosure[]>("/compliance/disclosures"),
    apiGet<Rule[]>("/compliance/rules"),
  ]);
  return (
    <div>
      <SectionHeader title="Compliance" subtitle="Disclosure manager · prohibited-phrase rules." />
      <div className="warn-box mb-6">No medical, prescription, health, coverage, or enrollment data is ever stored in this system. Notes and call logs are scanned for risky language.</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-bold text-navy-800">Service Page Disclosure Blocks</h2>
          <ul className="space-y-3">
            {disclosures.map((d) => (
              <li key={d.id} className="rounded-lg border border-navy-50 bg-cream p-3">
                <div className="flex items-center justify-between"><span className="font-semibold text-navy-700">{d.title}</span><span className={`badge ${d.required ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>{d.required ? "Required" : "Optional"}</span></div>
                <div className="mt-1 text-xs text-gray-500">{d.servicePage}</div>
                <p className="mt-2 text-xs text-gray-600">{d.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-4 text-lg font-bold text-navy-800">Prohibited / Risky Phrases</h2>
          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 border-b border-navy-50 pb-2">
                <div><span className="font-semibold text-navy-700">“{r.phrase}”</span><div className="text-xs text-gray-500">{r.message}</div></div>
                <span className={`badge ${r.severity === "block" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{r.severity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

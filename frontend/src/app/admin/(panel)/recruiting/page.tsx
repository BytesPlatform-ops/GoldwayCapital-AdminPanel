import Link from "next/link";
import { formatDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { RecruitingStatus } from "./RecruitingStatus";

export const dynamic = "force-dynamic";

interface Lead { id: string; firstName: string; lastName: string; email?: string; phone?: string; city?: string; state?: string; createdAt: string; recruitingStatus?: string }

export default async function RecruitingPage() {
  const leads = await apiGet<Lead[]>("/recruiting");
  return (
    <div>
      <SectionHeader title="Recruiting Leads" subtitle="Join Our Team inquiries. Owner review only — no onboarding/AHIP/carrier workflows." />
      <div className="warn-box mb-6">Everything after initial inquiry — licensing verification, FMO appointment, agreements — happens outside this system, with the FMO.</div>
      {leads.length === 0 ? (
        <div className="card text-center text-gray-500">No recruiting inquiries yet.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-left text-xs uppercase text-navy-700">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">City / State</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3"><Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link></td>
                  <td className="px-4 py-3 text-gray-600"><div>{l.email}</div><div className="text-xs text-gray-400">{l.phone}</div></td>
                  <td className="px-4 py-3 text-gray-600">{[l.city, l.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3"><RecruitingStatus id={l.id} current={l.recruitingStatus ?? "NEW"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

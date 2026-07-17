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
        <>
          <div className="data-table hidden md:block">
            <table>
              <thead>
                <tr><th>Name</th><th>Contact</th><th>City / State</th><th>Received</th><th>Status</th></tr>
              </thead>
              <tbody>
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

          <div className="space-y-3 md:hidden">
            {leads.map((l) => (
              <div key={l.id} className="card p-4">
                <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {l.email && <div className="break-all">{l.email}</div>}
                  {l.phone && <div className="text-gray-500">{l.phone}</div>}
                  <div className="text-xs text-gray-500">{[l.city, l.state].filter(Boolean).join(", ") || "—"} · {formatDate(l.createdAt)}</div>
                </div>
                <div className="mt-3"><RecruitingStatus id={l.id} current={l.recruitingStatus ?? "NEW"} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

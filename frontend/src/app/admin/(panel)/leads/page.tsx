import Link from "next/link";
import { formatDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader, StageBadge, SyncBadge, SOURCE_LABELS, STAGE_LABELS } from "@/components/admin-ui";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

interface Lead {
  id: string; firstName: string; lastName: string; email?: string; phone?: string;
  leadSource: string; pipelineStage: string; ghlSyncStatus: string; nextFollowUpAt?: string; createdAt: string;
  assignedTo?: { name: string } | null;
}

export default async function LeadsPage({ searchParams }: { searchParams: { q?: string; source?: string; stage?: string; syncStatus?: string } }) {
  const qs = new URLSearchParams();
  for (const k of ["q", "source", "stage", "syncStatus"] as const) if (searchParams[k]) qs.set(k, searchParams[k]!);
  const leads = await apiGet<Lead[]>(`/leads?${qs.toString()}`);

  return (
    <div>
      <SectionHeader title="Lead Inbox" subtitle={`${leads.length} lead${leads.length === 1 ? "" : "s"} shown`} />

      <form method="get" className="card mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={searchParams.q} className="input" placeholder="Name, email or phone" />
        </div>
        <div>
          <label className="label">Source</label>
          <select name="source" defaultValue={searchParams.source ?? ""} className="input">
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Stage</label>
          <select name="stage" defaultValue={searchParams.stage ?? ""} className="input">
            <option value="">All stages</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">GHL sync</label>
          <select name="syncStatus" defaultValue={searchParams.syncStatus ?? ""} className="input">
            <option value="">Any</option>
            {["SYNCED", "SYNCED_MOCK", "PENDING", "FAILED", "NOT_SYNCED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit">Filter</button>
        <Link href="/admin/leads" className="btn-ghost">Reset</Link>
      </form>

      {leads.length === 0 ? (
        <div className="card text-center text-gray-500">No leads match your filters.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-left text-xs uppercase text-navy-700">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Next follow-up</th><th className="px-4 py-3">GHL</th><th className="px-4 py-3">Created</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {leads.map((l) => {
                const overdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && l.pipelineStage !== "CLOSED";
                return (
                  <tr key={l.id} className="hover:bg-navy-50/40">
                    <td className="px-4 py-3"><Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link></td>
                    <td className="px-4 py-3 text-gray-600"><div>{l.email}</div><div className="text-xs text-gray-400">{l.phone}</div></td>
                    <td className="px-4 py-3 text-gray-600">{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</td>
                    <td className="px-4 py-3"><StageBadge stage={l.pipelineStage} /></td>
                    <td className="px-4 py-3 text-gray-600">{l.assignedTo?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">{l.nextFollowUpAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{formatDate(l.nextFollowUpAt)}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3"><SyncBadge status={l.ghlSyncStatus} /></td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><ConfirmButton path={`/leads/${l.id}`} title="Delete this lead?" message={`${l.firstName} ${l.lastName} and all related notes, calls, emails and appointments will be permanently deleted.`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

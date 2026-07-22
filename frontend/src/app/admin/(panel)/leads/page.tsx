import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format";
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
        <>
          {/* Desktop / tablet: table */}
          <div className="data-table hidden md:block">
            <table>
              <thead>
                <tr><th>Name</th><th>Contact</th><th>Source</th><th>Stage</th><th>Assigned</th><th>Next follow-up</th><th>GHL</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const overdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && l.pipelineStage !== "CLOSED";
                  return (
                    <tr key={l.id}>
                      <td className="px-4 py-3"><Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link></td>
                      <td className="px-4 py-3 text-gray-600"><div>{l.email}</div><div className="text-xs text-gray-400">{l.phone}</div></td>
                      <td className="px-4 py-3 text-gray-600">{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</td>
                      <td className="px-4 py-3"><StageBadge stage={l.pipelineStage} /></td>
                      <td className="px-4 py-3 text-gray-600">{l.assignedTo?.name ?? <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3">{l.nextFollowUpAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{formatDate(l.nextFollowUpAt)}</span> : <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3"><SyncBadge status={l.ghlSyncStatus} /></td>
                      <td className="px-4 py-3 text-gray-400">{formatDateTime(l.createdAt)}</td>
                      <td className="px-4 py-3 text-right"><ConfirmButton path={`/leads/${l.id}`} title="Delete this lead?" message={`${l.firstName} ${l.lastName} and all related notes, calls, emails and appointments will be permanently deleted.`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards so nothing is clipped */}
          <div className="space-y-3 md:hidden">
            {leads.map((l) => {
              const overdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && l.pipelineStage !== "CLOSED";
              return (
                <div key={l.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link>
                    <StageBadge stage={l.pipelineStage} />
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {l.email && <div className="break-all">{l.email}</div>}
                    {l.phone && <div className="text-gray-500">{l.phone}</div>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-gray-500">
                      <span>{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</span>
                      <span>Assigned: {l.assignedTo?.name ?? "—"}</span>
                      <span>Created: {formatDateTime(l.createdAt)}</span>
                      {l.nextFollowUpAt && <span className={overdue ? "font-semibold text-red-600" : ""}>Follow-up: {formatDate(l.nextFollowUpAt)}</span>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <SyncBadge status={l.ghlSyncStatus} />
                    <ConfirmButton path={`/leads/${l.id}`} title="Delete this lead?" message={`${l.firstName} ${l.lastName} and all related notes, calls, emails and appointments will be permanently deleted.`} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

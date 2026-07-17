import Link from "next/link";
import { formatDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { StatCard, SectionHeader, StageBadge, SyncBadge, SOURCE_LABELS } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

interface Summary {
  total: number; newLeads: number; contacted: number; appointmentSet: number; closed: number;
  overdue: number; upcoming: number; recruiting: number; syncErrors: number; pendingContent: number;
}
interface BySource { source: string; label: string; count: number }
interface Recent { id: string; firstName: string; lastName: string; leadSource: string; pipelineStage: string; ghlSyncStatus: string; createdAt: string }

export default async function DashboardPage() {
  const [summary, bySource, recent] = await Promise.all([
    apiGet<Summary>("/dashboard/summary"),
    apiGet<BySource[]>("/dashboard/leads-by-source"),
    apiGet<Recent[]>("/dashboard/recent-activity"),
  ]);
  const maxSource = Math.max(1, ...bySource.map((s) => s.count));
  const totalSource = bySource.reduce((sum, s) => sum + s.count, 0);
  const stages = [
    { label: "New", count: summary.newLeads, color: "bg-blue-500" },
    { label: "Contacted", count: summary.contacted, color: "bg-amber-500" },
    { label: "Appointment Set", count: summary.appointmentSet, color: "bg-purple-500" },
    { label: "Closed", count: summary.closed, color: "bg-green-500" },
  ];
  const stageTotal = Math.max(1, stages.reduce((sum, s) => sum + s.count, 0));

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="At-a-glance across every lead source." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={summary.total} />
        <StatCard label="New Leads" value={summary.newLeads} tone="gold" />
        <StatCard label="Appointments Set" value={summary.appointmentSet} />
        <StatCard label="Closed" value={summary.closed} tone="green" />
        <StatCard label="Overdue Follow-ups" value={summary.overdue} tone={summary.overdue > 0 ? "red" : "navy"} />
        <StatCard label="Upcoming Appointments" value={summary.upcoming} />
        <StatCard label="Recruiting Inquiries" value={summary.recruiting} />
        <StatCard label="Sync Errors" value={summary.syncErrors} tone={summary.syncErrors > 0 ? "red" : "green"} />
      </div>

      <div className="card mt-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-navy-800">Pipeline Distribution</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{summary.total} leads</span>
        </div>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-navy-50 ring-1 ring-inset ring-navy-100">
          {stages.map((s) =>
            s.count > 0 ? (
              <div key={s.label} className={`${s.color} h-full transition-all duration-700 ease-out`} style={{ width: `${(s.count / stageTotal) * 100}%` }} title={`${s.label}: ${s.count}`} />
            ) : null
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {stages.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-gray-600">{s.label}</span>
              <span className="tabular-nums font-bold text-navy-800">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-navy-800">Leads by Source</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{totalSource} total</span>
          </div>
          <div className="space-y-4">
            {bySource.map((s) => {
              const pct = Math.round((s.count / maxSource) * 100);
              const share = totalSource ? Math.round((s.count / totalSource) * 100) : 0;
              return (
                <div key={s.source}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-navy-700">{s.label}</span>
                    <span className="tabular-nums text-gray-500"><span className="font-bold text-navy-800">{s.count}</span> · {share}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-navy-600 via-navy-600 to-gold-500 transition-all duration-700 ease-out" style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-t border-navy-50 pt-3 text-xs text-gray-400">Contacted: {summary.contacted} · Content pending review: {summary.pendingContent}</div>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">Recent Form Submissions</h2>
            <Link href="/admin/leads" className="text-sm font-semibold text-navy-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-400">
                <tr><th className="pb-2">Name</th><th className="pb-2">Source</th><th className="pb-2">Stage</th><th className="pb-2">Sync</th><th className="pb-2">Received</th></tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {recent.map((l) => (
                  <tr key={l.id} className="hover:bg-navy-50/40">
                    <td className="py-2"><Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link></td>
                    <td className="py-2 text-gray-600">{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</td>
                    <td className="py-2"><StageBadge stage={l.pipelineStage} /></td>
                    <td className="py-2"><SyncBadge status={l.ghlSyncStatus} /></td>
                    <td className="py-2 text-gray-400">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

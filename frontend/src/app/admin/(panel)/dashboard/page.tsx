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

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-4 text-lg font-bold text-navy-800">Leads by Source</h2>
          <ul className="space-y-3">
            {bySource.map((s) => (
              <li key={s.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <span className="badge bg-navy-50 text-navy-700">{s.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-gray-400">Contacted: {summary.contacted} · Content pending review: {summary.pendingContent}</div>
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

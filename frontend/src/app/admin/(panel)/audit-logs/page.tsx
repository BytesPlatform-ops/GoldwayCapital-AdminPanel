import { apiGet } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { SectionHeader } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

interface Log { id: string; action: string; entityType?: string; entityId?: string; metadata?: unknown; createdAt: string; actor?: { name: string } | null }

export default async function AuditLogsPage() {
  const logs = await apiGet<Log[]>("/audit-logs");
  return (
    <div>
      <SectionHeader title="Audit Logs" subtitle="Append-only trail of every significant action." />
      <div className="data-table">
        <table>
          <thead>
            <tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-gray-400">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-2 text-gray-600">{l.actor?.name ?? "system"}</td>
                <td className="px-4 py-2 font-medium text-navy-700">{l.action}</td>
                <td className="px-4 py-2 text-xs text-gray-400">{l.entityType}{l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : ""}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

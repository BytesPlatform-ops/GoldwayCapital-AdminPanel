import { apiGet } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { SectionHeader } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

interface Resp {
  calls: { id: string; provider: string; operation: string; status: string; relatedType?: string; relatedId?: string; durationMs?: number; createdAt: string }[];
  webhooks: { id: string; eventType: string; signatureValid: boolean; processed: boolean; createdAt: string }[];
}

const S: Record<string, string> = { success: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800", mock: "bg-slate-100 text-slate-700", skipped: "bg-gray-100 text-gray-600" };

export default async function IntegrationLogsPage() {
  const { calls, webhooks } = await apiGet<Resp>("/integration-logs");
  return (
    <div>
      <SectionHeader title="Integration Logs" subtitle="Every outbound GHL / social / email call, plus inbound webhooks." />
      <div className="data-table mb-6">
        <div className="border-b border-navy-100 px-4 py-3 font-bold text-navy-800">Recent Integration Calls</div>
        <table>
          <thead>
            <tr><th>Provider</th><th>Operation</th><th>Status</th><th>Related</th><th>Duration</th><th>When</th></tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 uppercase text-gray-500">{c.provider}</td>
                <td className="px-4 py-2 text-navy-700">{c.operation}</td>
                <td className="px-4 py-2"><span className={`badge ${S[c.status] ?? ""}`}>{c.status}</span></td>
                <td className="px-4 py-2 text-xs text-gray-400">{c.relatedType}:{c.relatedId?.slice(0, 8)}</td>
                <td className="px-4 py-2 text-gray-400">{c.durationMs ?? "—"}ms</td>
                <td className="px-4 py-2 text-gray-400">{formatDateTime(c.createdAt)}</td>
              </tr>
            ))}
            {calls.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-400">No integration calls yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="mb-3 font-bold text-navy-800">Recent GHL Webhook Events</h2>
        {webhooks.length === 0 ? <p className="text-sm text-gray-400">No webhook events received.</p> : (
          <ul className="space-y-1 text-sm">
            {webhooks.map((w) => (
              <li key={w.id} className="flex items-center justify-between border-b border-navy-50 py-1">
                <span className="text-navy-700">{w.eventType}</span>
                <span className="text-xs text-gray-400">{w.signatureValid ? "verified" : "unverified"} · {w.processed ? "processed" : "pending"} · {formatDateTime(w.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

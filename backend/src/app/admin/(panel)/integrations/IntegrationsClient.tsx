"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiMutate } from "@/lib/actions";

type Log = { status: string; operation: string; createdAt: string } | null;

export interface IntegrationStatus {
  wordpress: {
    enabled: boolean; mockMode: boolean; live: boolean; baseUrl: string | null;
    usernameConfigured: boolean; appPasswordConfigured: boolean; authorId: string | null;
    categoryId: string | null; statusDefault: string; lastLog: Log;
  };
  ghl: {
    enabled: boolean; mockMode: boolean; live: boolean; tokenConfigured: boolean;
    locationConfigured: boolean; pipelineConfigured: boolean; stagesConfigured: boolean;
    workflowsConfigured: Record<string, boolean>; assignedUsersConfigured: { owner: boolean; va: boolean }; lastLog: Log;
  };
  social: {
    enabled: boolean; mockMode: boolean; live: boolean; ghlPlanner: boolean;
    accountsConfigured: Record<string, boolean>; googleBusinessProfileConfigured: boolean; lastLog: Log;
  };
  email: { provider: string; sharedMailbox: string; lastLog: Log };
  webhooks: { url: string; secretConfigured: boolean; last: { eventType: string; processed: boolean; createdAt: string } | null };
  failedCount: number;
}

export interface RecentLog { id: string; provider: string; operation: string; status: string; createdAt: string; relatedType?: string; relatedId?: string }

const TABS = ["WordPress", "GoHighLevel", "Social Planner", "Webhooks", "Logs"] as const;
type Tab = (typeof TABS)[number];

function Dot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const color = ok ? "bg-green-500" : warn ? "bg-amber-400" : "bg-gray-300";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function ModeBadge({ live, mock }: { live: boolean; mock: boolean }) {
  const label = live ? "Live" : mock ? "Mock mode" : "Disabled";
  const cls = live ? "bg-green-100 text-green-800" : mock ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between border-b border-navy-50 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="flex items-center gap-2 font-medium text-navy-700">{children}</span>
    </li>
  );
}

function TestButton({ path, label, onResult }: { path: string; label: string; onResult: (r: { ok: boolean; text: string }) => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className="btn-ghost text-sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await apiMutate(path, "POST");
          const d = r.data ?? {};
          const text = d.detail ?? d.message ?? (r.ok ? "OK" : "Failed") ;
          onResult({ ok: r.ok && d.ok !== false, text: (d.url ? `${text} ${d.url}` : text) });
          router.refresh();
        })
      }
    >
      {pending ? "Testing…" : label}
    </button>
  );
}

function LastLog({ log }: { log: Log }) {
  if (!log) return <span className="text-gray-300">no calls yet</span>;
  const color = log.status === "failed" ? "text-red-600" : log.status === "success" ? "text-green-600" : "text-amber-600";
  return <span className={`text-xs ${color}`}>{log.operation} · {log.status} · {new Date(log.createdAt).toLocaleString()}</span>;
}

export function IntegrationsClient({ status, logs }: { status: IntegrationStatus; logs: RecentLog[] }) {
  const [tab, setTab] = useState<Tab>("WordPress");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const showResult = (r: { ok: boolean; text: string }) => setResult(r);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setResult(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? "bg-navy-700 text-white" : "bg-white text-navy-700 hover:bg-navy-50"}`}>
            {t}{t === "Logs" && status.failedCount > 0 ? ` (${status.failedCount})` : ""}
          </button>
        ))}
      </div>

      {result && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {result.ok ? "✓ " : "✗ "}{result.text}
        </div>
      )}

      {tab === "WordPress" && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">WordPress</h2>
            <ModeBadge live={status.wordpress.live} mock={status.wordpress.mockMode} />
          </div>
          <ul className="space-y-1 text-sm">
            <Row label="Base URL">{status.wordpress.baseUrl ?? <span className="text-gray-300">—</span>}</Row>
            <Row label="Username"><Dot ok={status.wordpress.usernameConfigured} warn /></Row>
            <Row label="Application password"><Dot ok={status.wordpress.appPasswordConfigured} warn /> <span className="text-xs text-gray-400">hidden</span></Row>
            <Row label="Default author ID">{status.wordpress.authorId ?? <span className="text-gray-300">—</span>}</Row>
            <Row label="Resource category ID">{status.wordpress.categoryId ?? <span className="text-gray-300">—</span>}</Row>
            <Row label="Default status">{status.wordpress.statusDefault}</Row>
            <Row label="Last activity"><LastLog log={status.wordpress.lastLog} /></Row>
          </ul>
          <div className="mt-4 flex gap-2">
            <TestButton path="/integrations/wordpress/test" label="Test Connection" onResult={showResult} />
            <TestButton path="/integrations/wordpress/publish-test-draft" label="Publish Test Draft" onResult={showResult} />
          </div>
        </div>
      )}

      {tab === "GoHighLevel" && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">GoHighLevel CRM</h2>
            <ModeBadge live={status.ghl.live} mock={status.ghl.mockMode} />
          </div>
          <ul className="space-y-1 text-sm">
            <Row label="Private token"><Dot ok={status.ghl.tokenConfigured} warn /></Row>
            <Row label="Location ID"><Dot ok={status.ghl.locationConfigured} warn /></Row>
            <Row label="Pipeline ID"><Dot ok={status.ghl.pipelineConfigured} warn /></Row>
            <Row label="Stage IDs (all 4)"><Dot ok={status.ghl.stagesConfigured} warn /></Row>
            <Row label="Confirmation workflows">
              <span className="flex gap-2">
                {Object.entries(status.ghl.workflowsConfigured).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1 text-xs"><Dot ok={v} warn /> {k.replace(/_/g, " ")}</span>
                ))}
              </span>
            </Row>
            <Row label="Assigned users (owner / VA)">
              <span className="flex gap-3">
                <span className="flex items-center gap-1 text-xs"><Dot ok={status.ghl.assignedUsersConfigured.owner} warn /> owner</span>
                <span className="flex items-center gap-1 text-xs"><Dot ok={status.ghl.assignedUsersConfigured.va} warn /> VA</span>
              </span>
            </Row>
            <Row label="Last activity"><LastLog log={status.ghl.lastLog} /></Row>
          </ul>
          <div className="mt-4 flex gap-2">
            <TestButton path="/integrations/ghl/test" label="Test GHL Connection" onResult={showResult} />
            <TestButton path="/integrations/ghl/sync-test-lead" label="Sync Test Lead" onResult={showResult} />
          </div>
        </div>
      )}

      {tab === "Social Planner" && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">GHL Social Planner</h2>
            <ModeBadge live={status.social.live} mock={status.social.mockMode} />
          </div>
          <ul className="space-y-1 text-sm">
            <Row label="Facebook account ID"><Dot ok={status.social.accountsConfigured.FACEBOOK} warn /></Row>
            <Row label="Instagram account ID"><Dot ok={status.social.accountsConfigured.INSTAGRAM} warn /></Row>
            <Row label="LinkedIn account ID"><Dot ok={status.social.accountsConfigured.LINKEDIN} warn /></Row>
            <Row label="Google Business Profile"><Dot ok={status.social.googleBusinessProfileConfigured} warn /></Row>
            <Row label="Last activity"><LastLog log={status.social.lastLog} /></Row>
          </ul>
          <p className="mt-3 text-xs text-gray-500">Live posting needs the social accounts connected inside GHL first — an API token alone is not enough.</p>
          <div className="mt-4 flex gap-2">
            <TestButton path="/integrations/social/test" label="Test Social Posting" onResult={showResult} />
          </div>
        </div>
      )}

      {tab === "Webhooks" && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-800">Webhooks</h2>
          <ul className="space-y-1 text-sm">
            <Row label="GHL webhook URL"><code className="rounded bg-navy-50 px-2 py-1 text-xs">{status.webhooks.url}</code></Row>
            <Row label="Webhook secret"><Dot ok={status.webhooks.secretConfigured} warn /> {status.webhooks.secretConfigured ? "configured" : "not set (dev accepts all)"}</Row>
            <Row label="Last webhook received">
              {status.webhooks.last
                ? <span className="text-xs">{status.webhooks.last.eventType} · {status.webhooks.last.processed ? "processed" : "pending"} · {new Date(status.webhooks.last.createdAt).toLocaleString()}</span>
                : <span className="text-gray-300">none yet</span>}
            </Row>
          </ul>
          <p className="mt-3 text-xs text-gray-500">Point GHL&apos;s outbound webhook at the URL above and set <code>GHL_WEBHOOK_SECRET</code> in both places to enable signature verification.</p>
        </div>
      )}

      {tab === "Logs" && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">Integration Logs</h2>
            <button className="btn-ghost text-sm" onClick={() => router.refresh()}>Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr><th className="py-2">Provider</th><th>Action</th><th>Status</th><th>Related</th><th>When</th><th></th></tr>
              </thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-400">No integration calls yet.</td></tr>}
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-navy-50">
                    <td className="py-2 font-medium text-navy-700">{l.provider}</td>
                    <td>{l.operation}</td>
                    <td className={l.status === "failed" ? "text-red-600" : l.status === "success" ? "text-green-600" : "text-amber-600"}>{l.status}</td>
                    <td className="text-xs text-gray-500">{l.relatedType ? `${l.relatedType}:${(l.relatedId ?? "").slice(0, 8)}` : "—"}</td>
                    <td className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
                    <td>{l.status === "failed" && <RetryLog id={l.id} onResult={showResult} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RetryLog({ id, onResult }: { id: string; onResult: (r: { ok: boolean; text: string }) => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="btn-ghost text-xs" disabled={pending}
      onClick={() => start(async () => {
        const r = await apiMutate(`/integrations/retry/${id}`, "POST");
        onResult({ ok: r.ok && r.data?.ok !== false, text: r.data?.detail ?? (r.data?.ok ? "Retry succeeded." : "Retry failed.") });
        router.refresh();
      })}>
      {pending ? "…" : "Retry"}
    </button>
  );
}

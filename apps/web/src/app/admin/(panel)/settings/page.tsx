import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

interface SettingsResp {
  settings: { key: string; value: string; description?: string }[];
  integrations: {
    ghl: { enabled: boolean; mockMode: boolean; live: boolean; tokenConfigured: boolean; locationConfigured: boolean; pipelineConfigured: boolean };
    social: { enabled: boolean; mockMode: boolean; live: boolean };
    email: { provider: string; sharedMailbox: string };
    compliance: { reviewRequired: boolean; blockHealthFields: boolean };
  };
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-green-500" : "bg-amber-400"}`} />;
}

export default async function SettingsPage() {
  const data = await apiGet<SettingsResp>("/settings");
  const { integrations: I } = data;
  return (
    <div>
      <SectionHeader title="Settings" subtitle="Integration configuration. Secrets live in environment variables — never shown here." />
      <div className="warn-box mb-6">Secret values (API tokens, passwords) are set via environment variables and are never displayed in the browser. This page shows whether each integration is configured.</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-800">GoHighLevel CRM</h2>
          <ul className="space-y-2 text-sm">
            <Li label="Live mode"><Dot ok={I.ghl.live} /> {I.ghl.live ? "Live" : I.ghl.mockMode ? "Mock mode" : "Disabled"}</Li>
            <Li label="Token"><Dot ok={I.ghl.tokenConfigured} /></Li>
            <Li label="Location ID"><Dot ok={I.ghl.locationConfigured} /></Li>
            <Li label="Pipeline ID"><Dot ok={I.ghl.pipelineConfigured} /></Li>
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-800">Social &amp; Email</h2>
          <ul className="space-y-2 text-sm">
            <Li label="Social publishing"><Dot ok={I.social.live} /> {I.social.live ? "Live" : "Mock / off"}</Li>
            <Li label="Email provider">{I.email.provider}</Li>
            <Li label="Shared mailbox">{I.email.sharedMailbox}</Li>
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-800">Compliance</h2>
          <ul className="space-y-2 text-sm">
            <Li label="Review required before publish"><Dot ok={I.compliance.reviewRequired} /></Li>
            <Li label="Block health info fields"><Dot ok={I.compliance.blockHealthFields} /></Li>
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-800">Organization</h2>
          <ul className="space-y-2 text-sm">
            {data.settings.map((s) => (
              <Li key={s.key} label={s.key}>{s.value || <span className="text-gray-300">—</span>}</Li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between border-b border-navy-50 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="flex items-center gap-2 font-medium text-navy-700">{children}</span>
    </li>
  );
}

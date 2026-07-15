import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { IntegrationsClient, type IntegrationStatus, type RecentLog } from "./IntegrationsClient";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [status, logsResp] = await Promise.all([
    apiGet<IntegrationStatus>("/integrations/status"),
    apiGet<{ calls: RecentLog[] }>("/integration-logs"),
  ]);
  return (
    <div>
      <SectionHeader
        title="Integrations"
        subtitle="WordPress, GoHighLevel and Social Planner. Everything runs in mock mode until credentials are added — no secrets are shown here."
      />
      <div className="warn-box mb-6">
        Secrets (tokens, passwords) live in environment variables and are never displayed. A green dot means a value is configured; amber means it is still missing. Flip the matching <code>*_MOCK_MODE</code> flag to <code>false</code> and set <code>*_ENABLED=true</code> to go live.
      </div>
      <IntegrationsClient status={status} logs={logsResp.calls ?? []} />
    </div>
  );
}

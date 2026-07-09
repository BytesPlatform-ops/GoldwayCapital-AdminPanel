import { NextRequest } from "next/server";
import type { GhlSyncStatus, LeadSource, PipelineStage } from "@prisma/client";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handle(() => {
    requirePermission("leads.view");
    const p = req.nextUrl.searchParams;
    return services.leads.list({
      q: p.get("q") ?? undefined,
      source: (p.get("source") as LeadSource) ?? undefined,
      stage: (p.get("stage") as PipelineStage) ?? undefined,
      syncStatus: (p.get("syncStatus") as GhlSyncStatus) ?? undefined,
      assignedToId: p.get("assignedToId") ?? undefined,
    });
  });
}

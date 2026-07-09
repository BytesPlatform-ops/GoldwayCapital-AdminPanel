import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = requirePermission("leads.stage_change");
    const { stage } = (await req.json().catch(() => ({}))) as { stage: any };
    return services.leads.changeStage(params.id, stage, user);
  });
}

import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function POST(_req: NextRequest, { params }: { params: { logId: string } }) {
  return handle(() => { requirePermission("integrations.manage"); return services.integrations.retry(params.logId); });
}

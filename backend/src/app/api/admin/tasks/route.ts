import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return handle(() => { requirePermission("tasks.manage"); return services.misc.tasks(req.nextUrl.searchParams.get("status") ?? undefined); });
}

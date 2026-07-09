import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET() { return handle(() => { requirePermission("settings.manage"); return services.settings.all(); }); }
export async function PATCH(req: NextRequest) {
  return handle(async () => {
    requirePermission("settings.manage");
    const body = await req.json().catch(() => ({ settings: [] }));
    return services.settings.update(body);
  });
}

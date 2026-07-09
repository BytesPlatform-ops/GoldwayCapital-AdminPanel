import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(() => { requirePermission("content.create"); return services.content.list(); });
}
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = requirePermission("content.create");
    const body = await req.json().catch(() => ({}));
    return services.content.create(body, user);
  });
}

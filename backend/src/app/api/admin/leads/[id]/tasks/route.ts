import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = requirePermission("tasks.manage");
    const body = await req.json().catch(() => ({}));
    return services.leads.addTask(params.id, body, user);
  });
}

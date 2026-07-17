import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(() => {
    requirePermission("leads.view");
    return services.leads.get(params.id);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = requirePermission("leads.update");
    const body = await req.json().catch(() => ({}));
    return services.leads.update(params.id, body, user);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(() => {
    const user = requirePermission("records.delete");
    return services.leads.remove(params.id, user);
  });
}

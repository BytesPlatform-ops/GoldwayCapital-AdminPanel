import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(() => {
    const user = requirePermission("records.delete");
    return services.misc.deleteAppointment(params.id, user);
  });
}

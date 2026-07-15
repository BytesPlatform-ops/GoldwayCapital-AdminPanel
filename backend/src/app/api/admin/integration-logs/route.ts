import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
import { prisma } from "@/db/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => {
    requirePermission("integrations.manage");
    const [calls, webhooks] = await Promise.all([
      services.integrationLogs.list(80),
      prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return { calls, webhooks };
  });
}

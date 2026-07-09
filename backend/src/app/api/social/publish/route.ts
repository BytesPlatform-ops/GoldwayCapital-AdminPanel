import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  return handle(async () => {
    requirePermission("content.publish");
    const b = (await req.json().catch(() => ({}))) as any;
    return services.social.publish(b.contentPostId, b.platforms, b.caption);
  });
}

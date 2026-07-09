import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    return services.webhooks.handleGhl(body, req.headers.get("x-ghl-signature"));
  });
}

import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const secret = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret");
    return services.webhooks.handleGhl(body, { signature: req.headers.get("x-ghl-signature"), secret });
  });
}

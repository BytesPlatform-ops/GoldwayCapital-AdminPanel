import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    requireUser();
    const { text } = (await req.json().catch(() => ({}))) as { text?: string };
    return services.compliance.scanText(text ?? "");
  });
}

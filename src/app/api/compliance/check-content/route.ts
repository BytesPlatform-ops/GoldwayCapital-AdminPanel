import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { text } = (await req.json().catch(() => ({}))) as { text?: string };
    return services.compliance.scanText(text ?? "");
  });
}

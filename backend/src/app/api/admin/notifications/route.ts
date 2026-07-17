import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => {
    requireUser();
    return services.misc.notifications();
  });
}

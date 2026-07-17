import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";

export const dynamic = "force-dynamic";

// Static sibling of /appointments/[id] — Next.js resolves this before the dynamic
// segment, so it never collides with a real appointment id.
export async function GET() {
  return handle(() => {
    requirePermission("appointments.manage");
    return services.misc.appointmentServiceTypes();
  });
}

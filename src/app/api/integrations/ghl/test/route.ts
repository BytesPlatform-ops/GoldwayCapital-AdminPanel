import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function POST() { return handle(() => { requirePermission("integrations.manage"); return services.ghl.testConnection(); }); }

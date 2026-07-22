import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET() { return handle(() => { requirePermission("leads.view"); return services.misc.contactLeads(); }); }

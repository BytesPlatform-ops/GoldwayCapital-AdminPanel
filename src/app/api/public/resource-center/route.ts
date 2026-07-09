import { handle } from "@/lib/http";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET() { return handle(() => services.content.publishedList()); }

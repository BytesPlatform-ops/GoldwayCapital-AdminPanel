import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { services } from "@/server/services";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  return handle(() => services.content.publishedBySlug(params.slug));
}

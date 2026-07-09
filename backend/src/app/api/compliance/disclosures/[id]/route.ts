import { NextRequest } from "next/server";
import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/db/prisma";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    requirePermission("compliance.manage");
    const { title, body } = (await req.json().catch(() => ({}))) as { title?: string; body?: string };
    return prisma.disclosureBlock.update({ where: { id: params.id }, data: { title, body } });
  });
}

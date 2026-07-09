import type { PrismaService } from "@/db/prisma";

export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  // Board excludes recruiting leads (they have their own section).
  board() {
    return this.prisma.lead.findMany({
      where: { leadSource: { not: "RECRUITING" } },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, firstName: true, lastName: true, leadSource: true, pipelineStage: true, ghlSyncStatus: true },
    });
  }
}

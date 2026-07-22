import type { PrismaService } from "@/db/prisma";

export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  // Board excludes recruiting and contact leads — both have their own sections
  // (Recruiting page / Contact page) and carry no real pipeline.
  board() {
    return this.prisma.lead.findMany({
      where: { leadSource: { notIn: ["RECRUITING", "CONTACT"] } },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, firstName: true, lastName: true, leadSource: true, pipelineStage: true, ghlSyncStatus: true },
    });
  }
}

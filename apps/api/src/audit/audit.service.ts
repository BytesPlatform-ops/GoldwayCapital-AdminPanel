import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Append-only audit trail. Best-effort — never breaks the primary action. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`audit write failed: ${err}`);
    }
  }

  list(take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { actor: { select: { name: true, email: true } } },
    });
  }
}

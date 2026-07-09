import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Records every outbound integration call (GHL/social/email) + retry helper. */
@Injectable()
export class IntegrationLogsService {
  private readonly logger = new Logger("IntegrationLog");
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    provider: "ghl" | "social" | "email" | "wordpress";
    operation: string;
    status: "success" | "failed" | "mock" | "skipped";
    relatedType?: string;
    relatedId?: string;
    request?: Prisma.InputJsonValue;
    response?: Prisma.InputJsonValue;
    attempt?: number;
    durationMs?: number;
  }): Promise<void> {
    try {
      await this.prisma.integrationLog.create({
        data: {
          provider: params.provider,
          operation: params.operation,
          status: params.status,
          relatedType: params.relatedType,
          relatedId: params.relatedId,
          request: params.request,
          response: params.response,
          attempt: params.attempt ?? 1,
          durationMs: params.durationMs,
        },
      });
    } catch (err) {
      this.logger.error(`integration log write failed: ${err}`);
    }
  }

  list(take = 50) {
    return this.prisma.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take });
  }

  /** Exponential-backoff retry. Caller logs the outcome. */
  async withRetry<T>(fn: (attempt: number) => Promise<T>, attempts = 3, baseDelayMs = 300): Promise<T> {
    let lastErr: unknown;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn(i);
      } catch (err) {
        lastErr = err;
        if (i < attempts) await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (i - 1)));
      }
    }
    throw lastErr;
  }
}

import { PrismaClient } from "@prisma/client";

/** Single PrismaClient across dev HMR reloads and serverless warm invocations. */
const g = globalThis as unknown as { __goldwayPrisma?: PrismaClient };
export const prisma: PrismaClient = g.__goldwayPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__goldwayPrisma = prisma;

/** Alias so ported services can keep `prisma: PrismaService` param types. */
export type PrismaService = PrismaClient;

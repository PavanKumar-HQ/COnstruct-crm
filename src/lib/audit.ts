import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";

export interface LogAuditParams {
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Persists an immutable audit log entry in PostgreSQL.
 */
export async function logAuditEvent(
  params: LogAuditParams,
  tx?: Prisma.TransactionClient
): Promise<void> {
  if (!env.AUDIT_LOG_ENABLED) return;

  const db = tx ?? prisma;

  await db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}


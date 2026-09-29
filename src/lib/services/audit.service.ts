import { db } from '@/lib/db';

export interface CreateAuditLogParams {
  adminId: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metaJson: params.meta ? JSON.stringify(params.meta) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    return null;
  }
}

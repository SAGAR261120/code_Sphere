import { prisma } from "@/lib/prisma";

export interface CreateAuditLogInput {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  ipAddress?: string;
  metadata?: any;
}

export interface AuditLogFilter {
  adminId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Record a privileged administrative action for compliance and audit trailing
   */
  static async record(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        ipAddress: input.ipAddress,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  /**
   * Retrieve filtered audit logs with pagination
   */
  static async getLogs(filter: AuditLogFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.adminId) where.adminId = filter.adminId;
    if (filter.targetType) where.targetType = filter.targetType;
    if (filter.targetId) where.targetId = filter.targetId;
    if (filter.action) where.action = filter.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

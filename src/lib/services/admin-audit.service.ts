import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GetAuditLogsFilters {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  type?: string;
}

export class AdminAuditService {
  static async getAuditLogs(filters: GetAuditLogsFilters) {
    const { companyId, page, limit, search, type } = filters;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (type) {
      where.entityType = type;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export default AdminAuditService;
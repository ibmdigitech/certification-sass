import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminPermissionService {
  static async getPermissions(filters: {
    companyId: number;
    search?: string;
  }) {
    const { search } = filters;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.permission.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }
}

export default AdminPermissionService;
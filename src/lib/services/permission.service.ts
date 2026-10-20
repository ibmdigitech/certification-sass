import { prisma } from '@/lib/prisma';

export class PermissionService {
  static async checkUserPermission(userId: number, resource: string, action: string) {
    const expectedPermission = `${resource}:${action}`.toLowerCase();

    const userPermissionOverride = await prisma.userPermissionOverride.findFirst({
      where: {
        userId,
        permission: {
          name: {
            equals: expectedPermission,
            mode: 'insensitive'
          }
        }
      },
      include: {
        permission: true
      }
    });

    if (userPermissionOverride) {
      return { allowed: true };
    }

    const userWithRole = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!userWithRole) {
      return { allowed: false, reason: 'User not found' };
    }

    const roleName = userWithRole.roleRef?.name || userWithRole.role;
    if (roleName === 'SUPER_ADMIN') {
      return { allowed: true };
    }

    const rolePermissions = userWithRole.roleRef?.permissions || [];

    const hasPermission = rolePermissions.some((rp: any) => {
      const permName = (rp.permission?.name || '').toLowerCase();
      return (
        permName === expectedPermission ||
        permName === `${resource}:*` ||
        permName === '*:*'
      );
    });

    if (hasPermission) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions',
      availableActions: this.getAvailableActions(resource, roleName)
    };
  }

  static getAvailableActions(resource: string, roleName?: string): string[] {
    const roleActions: Record<string, string[]> = {
      'SUPER_ADMIN': ['create', 'read', 'update', 'delete', 'manage'],
      'ADMIN': ['create', 'read', 'update'],
      'TECHNICAL_MANAGER': ['read', 'update'],
      'INSPECTION_ENGINEER': ['read'],
      'OPERATIONS_COORDINATOR': ['read', 'update'],
      'TRAINER': ['read', 'update']
    };

    return roleActions[roleName || ''] || [];
  }
}

export default PermissionService;


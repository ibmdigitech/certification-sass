import { prisma } from '@/lib/prisma';
import { PermissionService } from './permission.service';
import { logAdminAction } from './audit.service';

export interface CreateRoleInput {
  companyId: number;
  userId: number;
  name: string;
  description: string;
  permissions: number[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: number[];
}

export class AdminRoleService {
  static async getRoles(filters: {
    companyId: number;
    page: number;
    limit: number;
    search?: string;
  }) {
    const { companyId, page, limit, search } = filters;

    const where: any = { companyId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.role.count({ where })
    ]);

    return roles;
  }

  static async createRole(input: CreateRoleInput) {
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: input.name,
        companyId: input.companyId 
      }
    });

    if (existingRole) {
      throw new Error(`Role with name ${input.name} already exists`);
    }

    const role = await prisma.role.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        permissions: input.permissions && input.permissions.length > 0
          ? {
              create: input.permissions.map((permissionId: number) => ({
                permission: { connect: { id: permissionId } }
              }))
            }
          : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    await this.logRoleAction({
      companyId: input.companyId,
      userId: input.userId,
      action: 'ROLE_CREATED',
      entityType: 'ROLE',
      entityId: role.id,
      previousValue: null,
      newValue: role,
      reason: `Role created: ${role.name}`
    });

    return role;
  }

  static async updateRole(input: {
    companyId: number;
    roleId: number;
    updates: UpdateRoleInput;
    requestingUserId: number;
  }) {
    const permissionCheck = await PermissionService.checkUserPermission(
      input.requestingUserId,
      'roles',
      'update'
    );

    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    const existingRole = await prisma.role.findFirst({
      where: { id: input.roleId, companyId: input.companyId }
    });

    if (!existingRole) {
      throw new Error('Role not found');
    }

    const updatedRole = await prisma.role.update({
      where: { id: input.roleId, companyId: input.companyId },
      data: {
        name: input.updates.name || existingRole.name,
        description: input.updates.description || existingRole.description,
        permissions: input.updates.permissions && input.updates.permissions.length > 0
          ? {
              deleteMany: {},
              create: input.updates.permissions.map((permissionId: number) => ({
                permission: { connect: { id: permissionId } }
              }))
            }
          : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    await this.logRoleAction({
      companyId: input.companyId,
      userId: input.requestingUserId,
      action: 'ROLE_UPDATED',
      entityType: 'ROLE',
      entityId: input.roleId,
      previousValue: null,
      newValue: updatedRole,
      reason: `Role updated: ${updatedRole.name}`
    });

    return updatedRole;
  }

  static async deleteRole(input: {
    companyId: number;
    roleId: number;
    requestingUserId: number;
  }) {
    const permissionCheck = await PermissionService.checkUserPermission(
      input.requestingUserId,
      'roles',
      'delete'
    );

    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    const deletedRole = await prisma.role.delete({
      where: { id: input.roleId, companyId: input.companyId }
    });

    await this.logRoleAction({
      companyId: input.companyId,
      userId: input.requestingUserId,
      action: 'ROLE_DELETED',
      entityType: 'ROLE',
      entityId: input.roleId,
      previousValue: deletedRole,
      newValue: null,
      reason: `Role deleted: ${deletedRole.name}`
    });

    return deletedRole;
  }

  static async logRoleAction(data: {
    companyId: number;
    userId: number;
    action: string;
    entityType: string;
    entityId: number;
    previousValue?: any;
    newValue?: any;
    reason?: string;
  }) {
    await logAdminAction({
      companyId: data.companyId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      previousValue: data.previousValue,
      newValue: data.newValue,
      ipAddress: null,
      userAgent: null
    });
  }
}

export default AdminRoleService;


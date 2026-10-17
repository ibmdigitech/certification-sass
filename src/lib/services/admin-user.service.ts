import { prisma } from '@/lib/prisma';
import { PermissionService } from './permission.service';
import { AuditService } from './audit.service';
import { logAdminAction } from './audit.service';

export interface CreateUserInput {
  companyId: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  managerId?: string;
  accreditation?: string;
  locationId?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  managerId?: string;
  accreditation?: string;
  locationId?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface GetUsersFilters {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

export class AdminUserService {
  static async getUsers(filters: GetUsersFilters) {
    const { companyId, page, limit, search, role, status } = filters;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roleRef: true,
          company: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async createUser(input: CreateUserInput) {
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: input.email,
        companyId: input.companyId 
      }
    });

    if (existingUser) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    const user = await prisma.user.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        email: input.email,
        passwordHash: "",
        role: input.role,
        status: input.status || 'active'
      },
      include: {
        roleRef: true,
        company: true
      }
    });

    await this.logAdminAction({
      companyId: input.companyId,
      userId: input.userId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      previousValue: null,
      newValue: user,
      reason: `User created: ${user.name}`
    });

    return user;
  }

  static async updateUser(input: {
    companyId: number;
    userId: number;
    updates: UpdateUserInput;
    requestingUserId: number;
  }) {
    const permissionCheck = await PermissionService.checkUserPermission(
      input.requestingUserId,
      'users',
      'update'
    );

    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: input.userId, companyId: input.companyId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: input.userId, companyId: input.companyId },
      data: {
        name: input.updates.name || existingUser.name,
        email: input.updates.email || existingUser.email,
        role: input.updates.role || existingUser.role,
        status: input.updates.status || existingUser.status,
        updatedAt: new Date()
      },
      include: {
        roleRef: true,
        company: true
      }
    });

    await this.logAdminAction({
      companyId: input.companyId,
      userId: input.requestingUserId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: input.userId,
      previousValue: null,
      newValue: updatedUser,
      reason: `User updated: ${updatedUser.name}`
    });

    return updatedUser;
  }

  static async deleteUser(input: {
    companyId: number;
    userId: number;
    requestingUserId: number;
  }) {
    const permissionCheck = await PermissionService.checkUserPermission(
      input.requestingUserId,
      'users',
      'delete'
    );

    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    const deletedUser = await prisma.user.delete({
      where: { id: input.userId, companyId: input.companyId }
    });

    await this.logAdminAction({
      companyId: input.companyId,
      userId: input.requestingUserId,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: input.userId,
      previousValue: deletedUser,
      newValue: null,
      reason: `User deleted: ${deletedUser.name}`
    });

    return deletedUser;
  }

  static async logAdminAction(data: {
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

export default AdminUserService;


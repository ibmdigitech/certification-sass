import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTraineeInput {
  companyId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  status?: string;
}

export interface UpdateTraineeInput extends Partial<CreateTraineeInput> {}

export class TraineeService {
  static async createTrainee(input: CreateTraineeInput) {
    // Check for duplicates
    if (input.email) {
      const existingEmail = await prisma.trainee.findFirst({
        where: { email: input.email, companyId: input.companyId },
      });
      if (existingEmail) {
        throw new Error(`Trainee with email ${input.email} already exists`);
      }
    }

    if (input.employeeId) {
      const existingEmployee = await prisma.trainee.findFirst({
        where: { employeeId: input.employeeId, companyId: input.companyId },
      });
      if (existingEmployee) {
        throw new Error(`Trainee with employee ID ${input.employeeId} already exists`);
      }
    }

    const trainee = await prisma.trainee.create({
      data: {
        companyId: input.companyId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        employeeId: input.employeeId,
        department: input.department,
        position: input.position,
        hireDate: input.hireDate,
        status: input.status ?? 'active',
      },
      include: {
        documents: true,
        trainingSessions: {
          include: { training: true },
        },
      },
    });

    return trainee;
  }

  static async getTraineeById(id: number, companyId: number) {
    return prisma.trainee.findFirst({
      where: { id, companyId },
      include: {
        documents: true,
        trainingSessions: {
          include: { training: true },
        },
      },
    });
  }

  static async getTraineeByEmail(email: string, companyId: number) {
    return prisma.trainee.findFirst({
      where: { email, companyId },
      include: {
        documents: true,
        trainingSessions: true,
      },
    });
  }

  static async getTraineeByEmployeeId(employeeId: string, companyId: number) {
    return prisma.trainee.findFirst({
      where: { employeeId, companyId },
      include: {
        documents: true,
        trainingSessions: true,
      },
    });
  }

  static async listTrainees(companyId: number, options?: {
    status?: string;
    search?: string;
    department?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { status, search, department, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [trainees, total] = await Promise.all([
      prisma.trainee.findMany({
        where,
        include: {
          documents: true,
          _count: {
            select: { documents: true, trainingSessions: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trainee.count({ where }),
    ]);

    return { trainees, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateTrainee(id: number, companyId: number, data: UpdateTraineeInput) {
    // Check for duplicates on email/employeeId update
    if (data.email) {
      const existingEmail = await prisma.trainee.findFirst({
        where: { email: data.email, companyId, NOT: { id } },
      });
      if (existingEmail) {
        throw new Error(`Trainee with email ${data.email} already exists`);
      }
    }

    if (data.employeeId) {
      const existingEmployee = await prisma.trainee.findFirst({
        where: { employeeId: data.employeeId, companyId, NOT: { id } },
      });
      if (existingEmployee) {
        throw new Error(`Trainee with employee ID ${data.employeeId} already exists`);
      }
    }

    return prisma.trainee.update({
      where: { id, companyId },
      data,
      include: {
        documents: true,
        trainingSessions: true,
      },
    });
  }

  static async deleteTrainee(id: number, companyId: number) {
    return prisma.trainee.delete({
      where: { id, companyId },
    });
  }

  static async searchTrainees(companyId: number, query: string, limit = 10) {
    return prisma.trainee.findMany({
      where: {
        companyId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { employeeId: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        documents: true,
        _count: {
          select: { documents: true, trainingSessions: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  static async getTraineeHistory(id: number, companyId: number) {
    const trainee = await prisma.trainee.findFirst({
      where: { id, companyId },
      include: {
        documents: true,
        trainingSessions: {
          include: { training: true },
          orderBy: { sessionDate: 'desc' },
        },
      },
    });

    if (!trainee) return null;

    // Get certificates through training sessions/jobs
    const certificates = await prisma.certificate.findMany({
      where: {
        companyId,
        job: {
          trainingSessions: {
            some: { traineeId: id },
          },
        },
      },
      include: { job: true },
    });

    return {
      trainee,
      documents: trainee.documents,
      trainingSessions: trainee.trainingSessions,
      certificates,
    };
  }

  static async getDepartments(companyId: number) {
    const result = await prisma.trainee.groupBy({
      by: ['department'],
      where: { companyId, department: { not: null } },
      _count: { department: true },
    });
    return result.map(r => ({ name: r.department!, count: r._count.department }));
  }

  static async getPositions(companyId: number) {
    const result = await prisma.trainee.groupBy({
      by: ['position'],
      where: { companyId, position: { not: null } },
      _count: { position: true },
    });
    return result.map(r => ({ name: r.position!, count: r._count.position }));
  }
}
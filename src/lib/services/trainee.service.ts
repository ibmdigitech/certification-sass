import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { Trainee, TraineeDocument, TrainingSession, Training, Enrollment, Certificate, Location, Job } from '@prisma/client';
export type TraineeWithRelations = Trainee & {
  documents: TraineeDocument[];
  trainingSessions: (TrainingSession & {
    training: { module: string | null } | null;
  })[];
  enrollments?: (Enrollment & {
    course: { title: string; code: string | null };
    location: { name: string; code: string | null } | null;
    job: { jobNumber: string } | null;
  })[];
  _count: {
    documents: number;
    trainingSessions: number;
    enrollments?: number;
  };
};

export interface CreateTraineeInput {
  companyId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  companyName?: string;
  jobTitle?: string;
  emiratesId?: string;
  nationality?: string;
  dateOfBirth?: Date;
  photoUrl?: string;
  locationId?: number;
  status?: string;
  hireDate?: Date;
}

export interface UpdateTraineeInput extends Partial<CreateTraineeInput> {
  id: number;
}

export interface TraineeFilters {
  companyId: number;
  search?: string;
  status?: string;
  locationId?: number;
  companyName?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTrainees {
  trainees: TraineeWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TraineeService {
  async create(data: CreateTraineeInput): Promise<Trainee> {
    return prisma.trainee.create({
      data: {
        ...data,
        status: data.status ?? 'active',
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      },
    });
  }

  async findById(id: number, companyId: number): Promise<TraineeWithRelations | null> {
    return prisma.trainee.findFirst({
      where: { id, companyId },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        trainingSessions: {
          include: { training: { select: { module: true } } },
          orderBy: { startDate: 'desc' },
        },
        enrollments: {
          where: { companyId },
          include: {
            course: { select: { title: true, code: true } },
            location: { select: { name: true, code: true } },
            job: { select: { jobNumber: true } },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        _count: {
          select: { documents: true, trainingSessions: true, enrollments: true },
        },
      },
    });
  }

  async findMany(filters: TraineeFilters): Promise<PaginatedTrainees> {
    const { companyId, search, status, locationId, companyName, page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { emiratesId: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (companyName) where.companyName = { contains: companyName, mode: 'insensitive' };

    const [trainees, total] = await Promise.all([
      prisma.trainee.findMany({
        where,
        include: {
          documents: { orderBy: { createdAt: 'desc' }, take: 1 },
          trainingSessions: {
            include: { training: { select: { module: true } } },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
          _count: { select: { documents: true, trainingSessions: true, enrollments: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trainee.count({ where }),
    ]);

    return {
      trainees,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(data: UpdateTraineeInput): Promise<Trainee> {
    const { id, hireDate, dateOfBirth, ...rest } = data;
    return prisma.trainee.update({
      where: { id },
      data: {
        ...rest,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });
  }

  async delete(id: number, companyId: number): Promise<void> {
    await prisma.trainee.delete({
      where: { id },
    });
  }

  async getJobTitles(companyId: number): Promise<string[]> {
    const trainees = await prisma.trainee.findMany({
      where: { companyId, jobTitle: { not: null } },
      select: { jobTitle: true },
      distinct: ['jobTitle'],
    });
    return trainees.map(t => t.jobTitle!).filter(Boolean);
  }

  async getStatuses(): Promise<string[]> {
    return ['active', 'inactive', 'on_leave', 'terminated'];
  }

  async checkDuplicate(companyId: number, params: {
    email?: string;
    employeeId?: string;
    emiratesId?: string;
    excludeId?: number;
  }): Promise<{ isDuplicate: boolean; field?: string; trainee?: Trainee }> {
    const { email, employeeId, emiratesId, excludeId } = params;

    const conditions: any[] = [];
    if (email) conditions.push({ email });
    if (employeeId) conditions.push({ employeeId });
    if (emiratesId) conditions.push({ emiratesId });

    if (conditions.length === 0) {
      return { isDuplicate: false };
    }

    const where: any = {
      companyId,
      OR: conditions,
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existing = await prisma.trainee.findFirst({ where });
    if (!existing) {
      return { isDuplicate: false };
    }

    let field = 'record';
    if (email && existing.email === email) field = 'email';
    else if (employeeId && existing.employeeId === employeeId) field = 'employeeId';
    else if (emiratesId && existing.emiratesId === emiratesId) field = 'emiratesId';

    return { isDuplicate: true, field, trainee: existing };
  }
}

export const traineeService = new TraineeService();


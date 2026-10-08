import { PrismaClient, Trainee, TraineeDocument, TrainingSession } from '@prisma/client';

const prisma = new PrismaClient();

export type TraineeWithRelations = Trainee & {
  documents: TraineeDocument[];
  trainingSessions: (TrainingSession & {
    training: { module: string | null } | null;
  })[];
  _count: {
    documents: number;
    trainingSessions: number;
  };
};

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
}

export interface UpdateTraineeInput extends Partial<CreateTraineeInput> {
  id: number;
  status?: string;
}

export interface TraineeFilters {
  companyId: number;
  search?: string;
  status?: string;
  department?: string;
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
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
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
          orderBy: { sessionDate: 'desc' },
        },
        _count: {
          select: { documents: true, trainingSessions: true },
        },
      },
    });
  }

  async findMany(filters: TraineeFilters): Promise<PaginatedTrainees> {
    const { companyId, search, status, department, page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (department) where.department = department;

    const [trainees, total] = await Promise.all([
      prisma.trainee.findMany({
        where,
        include: {
          documents: { orderBy: { createdAt: 'desc' }, take: 1 },
          trainingSessions: {
            include: { training: { select: { module: true } } },
            orderBy: { sessionDate: 'desc' },
            take: 1,
          },
          _count: { select: { documents: true, trainingSessions: true } },
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
    const { id, hireDate, ...rest } = data;
    return prisma.trainee.update({
      where: { id },
      data: {
        ...rest,
        hireDate: hireDate ? new Date(hireDate) : undefined,
      },
    });
  }

  async delete(id: number, companyId: number): Promise<void> {
    await prisma.trainee.delete({
      where: { id },
    });
  }

  async getDepartments(companyId: number): Promise<string[]> {
    const trainees = await prisma.trainee.findMany({
      where: { companyId, department: { not: null } },
      select: { department: true },
      distinct: ['department'],
    });
    return trainees.map(t => t.department!).filter(Boolean);
  }

  async getStatuses(): Promise<string[]> {
    return ['active', 'inactive', 'on_leave', 'terminated'];
  }
}

export const traineeService = new TraineeService();
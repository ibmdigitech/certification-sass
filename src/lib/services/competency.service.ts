import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface CreateCompetencyInput {
  companyId: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  validityMonths?: number;
  status?: string;
}

export interface CompetencyFilters {
  companyId: number;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedCompetencies {
  competencies: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class CompetencyService {
  static async createCompetency(input: CreateCompetencyInput) {
    return prisma.competency.create({
      data: {
        ...input,
        status: input.status ?? 'ACTIVE',
      },
    });
  }

  static async getCompetencyById(id: number, companyId: number) {
    return prisma.competency.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            courseComps: true,
            traineeComps: true,
          },
        },
      },
    });
  }

  static async listCompetencies(filters: CompetencyFilters): Promise<PaginatedCompetencies> {
    const { companyId, category, status, search, page = 1, pageSize = 20 } = filters;

    const where: Prisma.CompetencyWhereInput = { companyId };

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [competencies, total] = await Promise.all([
      prisma.competency.findMany({
        where,
        include: {
          _count: {
            select: {
              courseComps: true,
              traineeComps: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.competency.count({ where }),
    ]);

    return {
      competencies,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async updateCompetency(id: number, companyId: number, data: Partial<CreateCompetencyInput>) {
    return prisma.competency.update({
      where: { id, companyId },
      data,
      include: {
        _count: {
          select: {
            courseComps: true,
            traineeComps: true,
          },
        },
      },
    });
  }

  static async deleteCompetency(id: number, companyId: number) {
    return prisma.competency.delete({
      where: { id, companyId },
    });
  }

  static async getCompetencyByCode(code: string, companyId: number) {
    return prisma.competency.findFirst({
      where: { code, companyId },
    });
  }

  static async getCategories(companyId: number): Promise<string[]> {
    const result = await prisma.competency.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return result.map(r => r.category!).filter(Boolean);
  }
}

export class TraineeCompetencyService {
  static async assignCompetency(traineeId: number, competencyId: number, assessedBy: number, status?: string, expiresAt?: Date) {
    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
      select: { companyId: true },
    });

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    return prisma.traineeCompetency.upsert({
      where: {
        traineeId_competencyId: { traineeId, competencyId },
      },
      update: {
        status: status ?? 'COMPETENT',
        achievedAt: new Date(),
        assessedBy,
        expiresAt,
      },
      create: {
        companyId: trainee.companyId,
        traineeId,
        competencyId,
        assessedBy,
        status: status ?? 'COMPETENT',
        achievedAt: new Date(),
        expiresAt,
      },
      include: {
        competency: true,
        trainee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  static async revokeCompetency(traineeId: number, competencyId: number) {
    return prisma.traineeCompetency.update({
      where: {
        traineeId_competencyId: { traineeId, competencyId },
      },
      data: { status: 'REVOKED' },
    });
  }

  static async listTraineeCompetencies(traineeId: number, companyId: number) {
    return prisma.traineeCompetency.findMany({
      where: { traineeId, competency: { companyId } },
      include: {
        competency: true,
      },
      orderBy: { achievedAt: 'desc' },
    });
  }
}

export class CourseCompetencyService {
  static async linkCompetency(courseId: number, competencyId: number, isRequired: boolean = true) {
    const course = await prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: { companyId: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return prisma.courseCompetency.upsert({
      where: {
        courseId_competencyId: { courseId, competencyId },
      },
      update: { isRequired },
      create: {
        companyId: course.companyId,
        courseId,
        competencyId,
        isRequired,
      },
      include: {
        competency: true,
      },
    });
  }

  static async unlinkCompetency(courseId: number, competencyId: number) {
    return prisma.courseCompetency.delete({
      where: {
        courseId_competencyId: { courseId, competencyId },
      },
    });
  }

  static async listCourseCompetencies(courseId: number) {
    return prisma.courseCompetency.findMany({
      where: { courseId },
      include: {
        competency: true,
      },
      orderBy: { competency: { category: 'asc' } },
    });
  }
}

export const competencyService = CompetencyService;
export const traineeCompetencyService = TraineeCompetencyService;
export const courseCompetencyService = CourseCompetencyService;


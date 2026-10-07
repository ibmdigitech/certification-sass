import { PrismaClient } from '@prisma/client';
import { JobNumberService } from './job-number.service';

const prisma = new PrismaClient();

export interface CreateJobInput {
  companyId: number;
  customerId: number;
  type?: string;
  scheduledDate?: Date;
  engineerId?: number;
  jobNumber?: string; // Optional: manual/imported job number
}

export class JobService {
  static async createJob(input: CreateJobInput) {
    let jobNumber = input.jobNumber;

    if (!jobNumber) {
      jobNumber = await JobNumberService.generateJobNumber(input.companyId);
    } else {
      const isValid = await JobNumberService.validateJobNumber(jobNumber, input.companyId);
      if (!isValid) {
        throw new Error(`Job number ${jobNumber} already exists`);
      }
    }

    const job = await prisma.job.create({
      data: {
        companyId: input.companyId,
        customerId: input.customerId,
        jobNumber,
        type: input.type,
        scheduledDate: input.scheduledDate,
        engineerId: input.engineerId,
        status: 'pending',
      },
      include: {
        customer: true,
        engineer: true,
      },
    });

    return job;
  }

  static async getJobById(id: number, companyId: number) {
    return prisma.job.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        engineer: true,
        certificates: {
          orderBy: { sequence: 'asc' },
        },
        inspections: true,
        trainingSessions: true,
        timesheets: true,
      },
    });
  }

  static async getJobByNumber(jobNumber: string, companyId: number) {
    return prisma.job.findFirst({
      where: { jobNumber, companyId },
      include: {
        customer: true,
        engineer: true,
        certificates: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  static async listJobs(companyId: number, options?: {
    status?: string;
    customerId?: number;
    engineerId?: number;
    page?: number;
    limit?: number;
  }) {
    const { status, customerId, engineerId, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (engineerId) where.engineerId = engineerId;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: true,
          engineer: true,
          _count: {
            select: { certificates: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateJob(id: number, companyId: number, data: Partial<CreateJobInput & { status: string }>) {
    return prisma.job.update({
      where: { id, companyId },
      data,
    });
  }

  static async deleteJob(id: number, companyId: number) {
    return prisma.job.delete({
      where: { id, companyId },
    });
  }
}
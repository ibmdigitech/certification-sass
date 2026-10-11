import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class JobNumberService {
  private static readonly PREFIX = 'TSC-';
  private static readonly MIN_NUMBER = 1000000;

  static async generateJobNumber(companyId: number, txClient?: Prisma.TransactionClient): Promise<string> {
    const db = txClient || prisma;
    const lastJob = await db.job.findFirst({
        where: { companyId },
        orderBy: { id: 'desc' },
        select: { jobNumber: true },
      });

      let nextNumber = JobNumberService.MIN_NUMBER;

      if (lastJob?.jobNumber) {
        const match = lastJob.jobNumber.match(/^TSC-(\d+)$/);
        if (match) {
          nextNumber = Math.max(parseInt(match[1], 10) + 1, JobNumberService.MIN_NUMBER);
        }
      }

      const jobNumber = `${JobNumberService.PREFIX}${nextNumber}`;

      const existing = await db.job.findUnique({
        where: { jobNumber },
      });

      if (existing) {
        throw new Error(`Job number ${jobNumber} already exists`);
      }

      return jobNumber;
  }

  static async validateJobNumber(jobNumber: string, companyId: number, txClient?: Prisma.TransactionClient): Promise<boolean> {
    const db = txClient || prisma;
    const existing = await db.job.findFirst({
      where: { jobNumber, companyId },
    });
    return !existing;
  }

  static async reserveJobNumber(jobNumber: string, companyId: number, txClient?: Prisma.TransactionClient): Promise<void> {
    const isValid = await this.validateJobNumber(jobNumber, companyId, txClient);
    if (!isValid) {
      throw new Error(`Job number ${jobNumber} is already in use`);
    }
  }

  static parseJobNumber(jobNumber: string): { prefix: string; number: number } | null {
    const match = jobNumber.match(/^(TSC-)(\d+)$/);
    if (!match) return null;
    return { prefix: match[1], number: parseInt(match[2], 10) };
  }
}
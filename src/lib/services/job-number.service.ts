import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class JobNumberService {
  static readonly DEFAULT_PREFIX = 'TSC-';
  static readonly DEFAULT_START_NUMBER = 1;

  static async generateJobNumber(
    companyId: number,
    txClient?: Prisma.TransactionClient
  ): Promise<string> {
    return this.generateJobNumberWithPrefix(companyId, undefined, txClient);
  }

  static async generateJobNumberWithPrefix(
    companyId: number,
    prefix?: string,
    txClient?: Prisma.TransactionClient
  ): Promise<string> {
    const db = txClient || prisma;
    const effectivePrefix = prefix || this.DEFAULT_PREFIX;

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const lastJob = await db.job.findFirst({
        where: {
          companyId,
          jobNumber: { startsWith: effectivePrefix },
        },
        orderBy: { id: 'desc' },
        select: { jobNumber: true },
      });

      let nextNumber = this.DEFAULT_START_NUMBER + attempt;
      let padLength = 6;

      if (lastJob?.jobNumber) {
        const match = lastJob.jobNumber.match(/^([^-\s]+)-(\d+)$/);
        if (match) {
          const parsedNumber = parseInt(match[2], 10);
          nextNumber = parsedNumber + 1 + attempt;
          padLength = Math.max(match[2].length, 6);
        }
      }

      const jobNumber = `${effectivePrefix}${String(nextNumber).padStart(padLength, '0')}`;

      const existing = await db.job.findUnique({
        where: { jobNumber },
      });

      if (!existing) {
        return jobNumber;
      }
    }

    throw new Error(`Failed to generate unique job number with prefix ${effectivePrefix} after ${maxRetries} concurrent attempts`);
  }

  static async generateJobNumberFromSeed(
    companyId: number,
    prefix: string,
    seedNumber: number,
    txClient?: Prisma.TransactionClient
  ): Promise<string> {
    const db = txClient || prisma;
    const prefixWithDash = prefix.endsWith('-') ? prefix : `${prefix}-`;
    const seedStr = String(seedNumber);

    const lastJob = await db.job.findFirst({
      where: {
        companyId,
        jobNumber: { startsWith: prefixWithDash },
      },
      orderBy: { id: 'desc' },
      select: { jobNumber: true },
    });

    let nextNumber = seedNumber;
    let padLength = seedStr.length;

    if (lastJob?.jobNumber) {
      const match = lastJob.jobNumber.match(/^(.+)-(\d+)$/);
      if (match) {
        const parsedNumber = parseInt(match[2], 10);
        if (parsedNumber >= seedNumber) {
          nextNumber = parsedNumber + 1;
          padLength = Math.max(match[2].length, seedStr.length);
        } else {
          nextNumber = seedNumber;
          padLength = seedStr.length;
        }
      }
    }

    const jobNumber = `${prefixWithDash}${String(nextNumber).padStart(padLength, '0')}`;

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
    const match = jobNumber.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    return { prefix: match[1], number: parseInt(match[2], 10) };
  }
}




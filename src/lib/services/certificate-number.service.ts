import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class CertificateNumberService {
  static async generateCertificateNumber(jobId: number, companyId: number): Promise<{
    certificateNumber: string;
    sequence: number;
    jobNumber: string;
  }> {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { jobNumber: true, companyId: true },
      });

      if (!job) {
        throw new Error(`Job with id ${jobId} not found`);
      }

      if (job.companyId !== companyId) {
        throw new Error('Job does not belong to this company');
      }

      const lastCertificate = await tx.certificate.findFirst({
        where: { jobId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });

      const nextSequence = (lastCertificate?.sequence ?? 0) + 1;
      const certificateNumber = `${job.jobNumber}-${String(nextSequence).padStart(2, '0')}`;

      const existing = await tx.certificate.findUnique({
        where: { number: certificateNumber },
      });

      if (existing) {
        throw new Error(`Certificate number ${certificateNumber} already exists`);
      }

      const existingSequence = await tx.certificate.findUnique({
        where: { jobId_sequence: { jobId, sequence: nextSequence } },
      });

      if (existingSequence) {
        throw new Error(`Sequence ${nextSequence} already used for job ${job.jobNumber}`);
      }

      return {
        certificateNumber,
        sequence: nextSequence,
        jobNumber: job.jobNumber,
      };
    });
  }

  static async getNextSequence(jobId: number): Promise<number> {
    const lastCertificate = await prisma.certificate.findFirst({
      where: { jobId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return (lastCertificate?.sequence ?? 0) + 1;
  }

  static async previewCertificateNumber(jobId: number): Promise<{
    certificateNumber: string;
    sequence: number;
    jobNumber: string;
  } | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { jobNumber: true },
    });

    if (!job) return null;

    const nextSequence = await this.getNextSequence(jobId);
    return {
      certificateNumber: `${job.jobNumber}-${String(nextSequence).padStart(2, '0')}`,
      sequence: nextSequence,
      jobNumber: job.jobNumber,
    };
  }

  static formatCertificateNumber(jobNumber: string, sequence: number): string {
    return `${jobNumber}-${String(sequence).padStart(2, '0')}`;
  }

  static parseCertificateNumber(certificateNumber: string): { jobNumber: string; sequence: number } | null {
    const match = certificateNumber.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    return { jobNumber: match[1], sequence: parseInt(match[2], 10) };
  }

  static async validateCertificateNumber(certificateNumber: string, companyId: number): Promise<boolean> {
    const existing = await prisma.certificate.findFirst({
      where: { number: certificateNumber, companyId },
    });
    return !existing;
  }
}


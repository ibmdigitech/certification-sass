import { PrismaClient } from '@prisma/client';
import { CertificateNumberService } from './certificate-number.service';

const prisma = new PrismaClient();

export interface CreateCertificateInput {
  companyId: number;
  jobId: number;
  traineeId?: number;
  complianceAuthority?: string;
  status?: string;
}

export class CertificateService {
  static async createCertificate(input: CreateCertificateInput) {
    const { certificateNumber, sequence, jobNumber } = await CertificateNumberService.generateCertificateNumber(
      input.jobId,
      input.companyId
    );

    const certificate = await prisma.certificate.create({
      data: {
        companyId: input.companyId,
        jobId: input.jobId,
        jobNumber,
        sequence,
        number: certificateNumber,
        status: input.status ?? 'draft',
        complianceAuthority: input.complianceAuthority,
      },
      include: {
        job: {
          include: { customer: true },
        },
      },
    });

    return certificate;
  }

  static async bulkCreateCertificates(
    companyId: number,
    jobId: number,
    count: number,
    baseData: Omit<CreateCertificateInput, 'jobId' | 'companyId'> = {}
  ) {
    const results = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const cert = await this.createCertificate({
          companyId,
          jobId,
          ...baseData,
        });
        results.push(cert);
      } catch (error) {
        errors.push({ index: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return { certificates: results, errors };
  }

  static async getCertificateById(id: number, companyId: number) {
    return prisma.certificate.findFirst({
      where: { id, companyId },
      include: {
        job: {
          include: { customer: true },
        },
        verifications: true,
      },
    });
  }

  static async getCertificateByNumber(certificateNumber: string, companyId: number) {
    return prisma.certificate.findFirst({
      where: { number: certificateNumber, companyId },
      include: {
        job: {
          include: { customer: true },
        },
        verifications: true,
      },
    });
  }

  static async listCertificates(companyId: number, options?: {
    jobId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { jobId, status, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          job: {
            include: { customer: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return { certificates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateCertificateStatus(id: number, companyId: number, status: string) {
    return prisma.certificate.update({
      where: { id, companyId },
      data: { status },
    });
  }

  static async previewNextCertificateNumber(jobId: number, companyId: number) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: { jobNumber: true },
    });

    if (!job) return null;

    return CertificateNumberService.previewCertificateNumber(jobId);
  }

  static async getCertificatesByJob(jobId: number, companyId: number) {
    return prisma.certificate.findMany({
      where: { jobId, companyId },
      orderBy: { sequence: 'asc' },
    });
  }
}
import { prisma } from '@/lib/prisma';
import { CertificateNumberService } from './certificate-number.service';

export interface CreateCertificateInput {
  companyId: number;
  jobId: number;
  traineeId?: number;
  complianceAuthority?: string;
  status?: string;
  jobServiceId?: number;
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
        jobServiceId: input.jobServiceId,
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
    const results: any[] = [];
    const errors: Array<{ index: number; error: string }> = [];

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
    certificateType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { jobId, status, certificateType, search, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;
    if (certificateType) where.certificateType = certificateType;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { holderName: { contains: search, mode: 'insensitive' } },
        { holderCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          job: {
            include: { customer: true },
          },
          deliveryLogs: {
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 3,
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

  static async createRevision(params: {
    certificateId: number;
    companyId: number;
    userId: number;
    revisionCode?: string;
    reasonCategory: string;
    rootCause?: string;
    oldValue?: string;
    newValue?: string;
    changeFields?: Record<string, unknown>;
  }) {
    // 1. Verify certificate exists
    const cert = await prisma.certificate.findFirst({
      where: { id: params.certificateId, companyId: params.companyId },
      include: { revisions: { orderBy: { createdAt: 'desc' } } },
    });

    if (!cert) {
      throw new Error(`Certificate ${params.certificateId} not found`);
    }

    // 2. Compute revision code (e.g. R01, R02)
    const revisionCount = cert.revisions.length;
    const computedRevisionCode = params.revisionCode ?? `R${String(revisionCount + 1).padStart(2, '0')}`;

    // 3. Create revision record
    const revision = await prisma.revision.create({
      data: {
        companyId: params.companyId,
        certificateId: params.certificateId,
        revisionCode: computedRevisionCode,
        reasonCategory: params.reasonCategory,
        rootCause: params.rootCause,
        oldValue: params.oldValue,
        newValue: params.newValue,
        changeFields: params.changeFields as any,
        approvedBy: params.userId,
      },
    });

    // 4. Update parent certificate status to revised
    await prisma.certificate.update({
      where: { id: params.certificateId },
      data: { status: 'revised' },
    });

    return revision;
  }
}



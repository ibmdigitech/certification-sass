import { PrismaClient } from '@prisma/client';
import { CertificateService } from '../certificate.service';
import { QRCodeService } from './qr-code.service';
import { PDFGenerationService } from './pdf-generation.service';
import { DigitalSignatureService } from './digital-signature.service';
import { VerificationService } from './verification.service';
import { BulkCertificateService } from './bulk-certificate.service';

const prisma = new PrismaClient();

export interface CompleteCertificateData {
  companyId: number;
  jobId: number;
  traineeId: number;
  complianceAuthority?: string;
  templateId?: string;
  baseUrl?: string;
  generatePDF?: boolean;
  generateQRCode?: boolean;
  generateSignature?: boolean;
  status?: 'draft' | 'issued';
}

export interface CertificateWithDetails {
  certificate: Awaited<ReturnType<typeof CertificateService.createCertificate>>;
  pdfUrl?: string;
  qrUrl?: string;
  signature?: string;
  verificationUrl: string;
}

export class CertificateManager {
  static async createCompleteCertificate(data: CompleteCertificateData): Promise<CertificateWithDetails> {
    const {
      companyId,
      jobId,
      traineeId,
      complianceAuthority,
      templateId = 'default',
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
      generatePDF = true,
      generateQRCode = true,
      generateSignature = true,
      status = 'issued',
    } = data;

    const certificate = await CertificateService.createCertificate({
      companyId,
      jobId,
      traineeId,
      complianceAuthority,
      status: 'draft',
    });

    let pdfUrl: string | undefined;
    let qrUrl: string | undefined;
    let signature: string | undefined;

    if (generateQRCode) {
      const qrResult = await QRCodeService.generateAndSaveQRCode(certificate.id, baseUrl);
      qrUrl = qrResult.dataUrl;
    }

    if (generateSignature) {
      const sigResult = await DigitalSignatureService.signCertificateHash(certificate.id);
      signature = sigResult.signature;
    }

    if (generatePDF) {
      const pdfBuffer = await PDFGenerationService.generateCertificateFromDB(
        certificate.id,
        templateId,
        baseUrl,
        { includeQRCode: generateQRCode, includeDigitalSignature: generateSignature, outputFormat: 'buffer' }
      ) as Buffer;

      const pdfBase64 = pdfBuffer.toString('base64');
      pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl, status },
      });
    } else {
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status },
      });
    }

    const verificationUrl = `${baseUrl}/verify/${certificate.number}`;

    return {
      certificate,
      pdfUrl,
      qrUrl,
      signature,
      verificationUrl,
    };
  }

  static async getCertificateWithDetails(certificateId: number, companyId: number, baseUrl?: string) {
    const certificate = await CertificateService.getCertificateById(certificateId, companyId);
    if (!certificate) return null;

    const base = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    return {
      certificate,
      verificationUrl: `${base}/verify/${certificate.number}`,
      qrCodeUrl: certificate.qrUrl,
      pdfUrl: certificate.pdfUrl,
      verifications: certificate.verifications,
    };
  }

  static async issueCertificate(certificateId: number, companyId: number, performedBy: string): Promise<void> {
    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'issue',
      performedBy,
      reason: 'Certificate issued',
    });
  }

  static async revokeCertificate(certificateId: number, companyId: number, performedBy: string, reason: string): Promise<void> {
    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'revoke',
      performedBy,
      reason,
    });
  }

  static async renewCertificate(certificateId: number, companyId: number, performedBy: string, newExpiryDate: Date): Promise<void> {
    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'renew',
      performedBy,
      reason: 'Certificate renewed',
      newExpiryDate,
    });
  }

  static async reissueCertificate(certificateId: number, companyId: number, performedBy: string, reason: string): Promise<void> {
    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'reissue',
      performedBy,
      reason,
    });
  }

  static async archiveCertificate(certificateId: number, companyId: number, performedBy: string): Promise<void> {
    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'archive',
      performedBy,
      reason: 'Certificate archived',
    });
  }

  static async verifyCertificate(certificateNumber: string, verifiedBy: string, method: 'qr' | 'manual' | 'api' | 'bulk' = 'manual') {
    return VerificationService.verifyCertificate({ certificateNumber, verifiedBy, method });
  }

  static async bulkCreateFromTrainees(
    companyId: number,
    jobId: number,
    traineeIds: number[],
    options: Omit<CompleteCertificateData, 'companyId' | 'jobId' | 'traineeId'> = {}
  ) {
    return BulkCertificateService.bulkCreateCertificates({
      companyId,
      jobId,
      traineeIds,
      ...options,
    });
  }

  static async getCertificateStats(companyId: number) {
    const [total, issued, draft, revoked, expired, archived, recent] = await Promise.all([
      prisma.certificate.count({ where: { companyId } }),
      prisma.certificate.count({ where: { companyId, status: 'issued' } }),
      prisma.certificate.count({ where: { companyId, status: 'draft' } }),
      prisma.certificate.count({ where: { companyId, status: 'revoked' } }),
      prisma.certificate.count({ where: { companyId, status: 'expired' } }),
      prisma.certificate.count({ where: { companyId, status: 'archived' } }),
      prisma.certificate.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { job: { include: { customer: true } } },
      }),
    ]);

    return { total, issued, draft, revoked, expired, archived, recent };
  }

  static async searchCertificates(companyId: number, query: string, options?: {
    status?: string;
    jobId?: number;
    page?: number;
    limit?: number;
  }) {
    const { status, jobId, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    
    if (query) {
      where.OR = [
        { number: { contains: query, mode: 'insensitive' } },
        { jobNumber: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: { job: { include: { customer: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return { certificates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async exportCertificates(companyId: number, format: 'json' | 'csv' = 'json', filters?: {
    status?: string;
    jobId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.jobId) where.jobId = filters.jobId;
    if (filters?.startDate || filters?.endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (filters.startDate) createdAtFilter.gte = filters.startDate;
      if (filters.endDate) createdAtFilter.lte = filters.endDate;
      where.createdAt = createdAtFilter;
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: { job: { include: { customer: true } }, verifications: true },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = [
        'Certificate Number', 'Job Number', 'Customer Contact', 'Status', 
        'Compliance Authority', 'Created At', 'Updated At',
        'QR Code URL', 'PDF URL', 'Verification Count'
      ];
      const rows = certificates.map(c => [
        c.number,
        c.jobNumber,
        c.job?.customer?.contact ?? '',
        c.status ?? '',
        c.complianceAuthority ?? '',
        c.createdAt.toISOString(),
        c.updatedAt.toISOString(),
        c.qrUrl ?? '',
        c.pdfUrl ?? '',
        c.verifications?.length ?? 0,
      ]);
      return [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    }

    return certificates;
  }
}

export default CertificateManager;
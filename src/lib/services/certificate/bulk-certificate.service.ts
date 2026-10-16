import { PrismaClient } from '@prisma/client';
import { CertificateService } from '../certificate.service';
import { PDFGenerationService } from './pdf-generation.service';
import { QRCodeService } from './qr-code.service';
import { DigitalSignatureService } from './digital-signature.service';

const prisma = new PrismaClient();

export interface BulkCertificateRequest {
  companyId: number;
  jobId: number;
  traineeIds: number[];
  complianceAuthority?: string;
  status?: string;
  generatePDF?: boolean;
  generateQRCode?: boolean;
  generateSignature?: boolean;
  templateId?: string;
  baseUrl?: string;
}

export interface BulkCertificateResult {
  certificates: Array<{
    id: number;
    number: string;
    traineeId: number;
    pdfUrl?: string;
    qrUrl?: string;
    signature?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface CertificateLifecycleAction {
  certificateId: number;
  action: 'issue' | 'revoke' | 'expire' | 'renew' | 'reissue' | 'archive';
  reason?: string;
  performedBy: string;
  newExpiryDate?: Date;
}

export interface CertificateLifecycleResult {
  certificateId: number;
  previousStatus: string;
  newStatus: string;
  action: string;
  performedAt: Date;
  performedBy: string;
  reason?: string;
}

export class BulkCertificateService {
  static async bulkCreateCertificates(request: BulkCertificateRequest): Promise<BulkCertificateResult> {
    const { companyId, jobId, traineeIds, complianceAuthority, status, generatePDF = true, generateQRCode = true, generateSignature = true, templateId = 'default', baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000' } = request;

    const results: any[] = [];
    let successful = 0;
    let failed = 0;

    for (const traineeId of traineeIds) {
      try {
        const certificate = await CertificateService.createCertificate({
          companyId,
          jobId,
          traineeId,
          complianceAuthority,
          status: status ?? 'draft',
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
            data: { pdfUrl, status: 'issued' },
          });
        }

        results.push({
          id: certificate.id,
          number: certificate.number,
          traineeId,
          pdfUrl,
          qrUrl,
          signature,
        });
        successful++;
      } catch (error) {
        results.push({
          id: 0,
          number: '',
          traineeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      certificates: results,
      summary: { total: traineeIds.length, successful, failed },
    };
  }

  static async bulkGeneratePDFs(certificateIds: number[], templateId: string = 'default', baseUrl: string): Promise<{
    results: Array<{ certificateId: number; pdfUrl: string; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: Array<{ certificateId: number; pdfUrl: string; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const certificateId of certificateIds) {
      try {
        const pdfBuffer = await PDFGenerationService.generateCertificateFromDB(
          certificateId,
          templateId,
          baseUrl,
          { includeQRCode: true, includeDigitalSignature: true, outputFormat: 'buffer' }
        ) as Buffer;

        const pdfBase64 = pdfBuffer.toString('base64');
        const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

        await prisma.certificate.update({
          where: { id: certificateId },
          data: { pdfUrl },
        });

        results.push({ certificateId, pdfUrl });
        successful++;
      } catch (error) {
        results.push({ certificateId, pdfUrl: '', error: error instanceof Error ? error.message : 'Unknown error' });
        failed++;
      }
    }

    return { results, summary: { total: certificateIds.length, successful, failed } };
  }

  static async bulkGenerateQRCodes(certificateIds: number[], baseUrl: string): Promise<{
    results: Array<{ certificateId: number; qrUrl: string; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: Array<{ certificateId: number; qrUrl: string; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const certificateId of certificateIds) {
      try {
        const qrResult = await QRCodeService.generateAndSaveQRCode(certificateId, baseUrl);
        results.push({ certificateId, qrUrl: qrResult.dataUrl });
        successful++;
      } catch (error) {
        results.push({ certificateId, qrUrl: '', error: error instanceof Error ? error.message : 'Unknown error' });
        failed++;
      }
    }

    return { results, summary: { total: certificateIds.length, successful, failed } };
  }

  static async bulkSignCertificates(certificateIds: number[]): Promise<{
    results: Array<{ certificateId: number; signature: string; error?: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: Array<{ certificateId: number; signature: string; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const certificateId of certificateIds) {
      try {
        const sigResult = await DigitalSignatureService.signCertificateHash(certificateId);
        results.push({ certificateId, signature: sigResult.signature });
        successful++;
      } catch (error) {
        results.push({ certificateId, signature: '', error: error instanceof Error ? error.message : 'Unknown error' });
        failed++;
      }
    }

    return { results, summary: { total: certificateIds.length, successful, failed } };
  }

  static async performLifecycleAction(action: CertificateLifecycleAction): Promise<CertificateLifecycleResult> {
    const { certificateId, action: actionType, reason, performedBy, newExpiryDate } = action;

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, number: true, status: true, companyId: true },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    const previousStatus = certificate.status ?? 'unknown';
    let newStatus: string;

    switch (actionType) {
      case 'issue':
        newStatus = 'issued';
        break;
      case 'revoke':
        newStatus = 'revoked';
        break;
      case 'expire':
        newStatus = 'expired';
        break;
      case 'renew':
        newStatus = 'issued';
        break;
      case 'reissue':
        newStatus = 'reissued';
        break;
      case 'archive':
        newStatus = 'archived';
        break;
      default:
        throw new Error(`Unknown lifecycle action: ${actionType}`);
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        companyId: certificate.companyId,
        userId: 0,
        action: `certificate_${actionType}`,
        entityType: 'certificate',
        entityId: certificateId,
        tenantId: certificate.companyId,
      },
    });

    if (actionType === 'revoke' || actionType === 'expire') {
      await prisma.certificateVerification.create({
        data: {
          companyId: certificate.companyId,
          certificateId,
          verifiedBy: performedBy,
          method: 'manual',
          result: 'invalid',
          notes: `Certificate ${actionType}d: ${reason ?? 'No reason provided'}`,
        },
      });
    }

    return {
      certificateId,
      previousStatus,
      newStatus,
      action: actionType,
      performedAt: new Date(),
      performedBy,
      reason,
    };
  }

  static async bulkLifecycleAction(actions: CertificateLifecycleAction[]): Promise<{
    results: CertificateLifecycleResult[];
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: CertificateLifecycleResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        const result = await this.performLifecycleAction(action);
        results.push(result);
        successful++;
      } catch (error) {
        results.push({
          certificateId: action.certificateId,
          previousStatus: 'unknown',
          newStatus: 'error',
          action: action.action,
          performedAt: new Date(),
          performedBy: action.performedBy,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return { results, summary: { total: actions.length, successful, failed } };
  }

  static async getCertificateHistory(certificateId: number, companyId: number) {
    return prisma.auditLog.findMany({
      where: { entityType: 'certificate', entityId: certificateId, companyId },
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getExpiringCertificates(companyId: number, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.certificate.findMany({
      where: {
        companyId,
        status: 'issued',
        createdAt: { lte: futureDate },
      },
      include: {
        job: { include: { customer: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getCertificatesByStatus(companyId: number, status: string) {
    return prisma.certificate.findMany({
      where: { companyId, status },
      include: {
        job: { include: { customer: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default BulkCertificateService;
import { PrismaClient } from '@prisma/client';
import { QRCodeService } from './qr-code.service';
import { DigitalSignatureService } from './digital-signature.service';

const prisma = new PrismaClient();

export interface VerificationRequest {
  certificateNumber: string;
  verifiedBy: string;
  method: 'qr' | 'manual' | 'api' | 'bulk';
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface VerificationResult {
  certificateId: number;
  certificateNumber: string;
  valid: boolean;
  status: string;
  verifiedAt: Date;
  verifiedBy: string;
  method: string;
  details: {
    certificateExists: boolean;
    certificateStatus: string;
    qrCodeValid: boolean;
    digitalSignatureValid: boolean;
    dataIntegrity: boolean;
    complianceAuthority?: string;
    issuedAt: Date;
    expiryDate?: Date;
  };
  error?: string;
}

export interface BulkVerificationRequest {
  certificateNumbers: string[];
  verifiedBy: string;
  method: 'qr' | 'manual' | 'api' | 'bulk';
  ipAddress?: string;
  userAgent?: string;
}

export interface BulkVerificationResult {
  results: VerificationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errors: number;
  };
}

export class VerificationService {
  static async verifyCertificate(request: VerificationRequest): Promise<VerificationResult> {
    const { certificateNumber, verifiedBy, method, ipAddress, userAgent, notes } = request;

    const certificate = await prisma.certificate.findFirst({
      where: { number: certificateNumber },
      include: {
        job: { include: { customer: true } },
        verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 },
      },
    });

    let qrCodeValid = false;
    let digitalSignatureValid = false;
    let dataIntegrity = false;

    if (certificate) {
      const qrValidation = await QRCodeService.validateQRCodeData(
        JSON.stringify({
          certId: certificate.id,
          certNumber: certificate.number,
          verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${certificate.number}`,
        })
      );
      qrCodeValid = qrValidation.valid;

      const integrityCheck = await DigitalSignatureService.verifyCertificateIntegrity(certificate.id);
      digitalSignatureValid = integrityCheck.signatureValid;
      dataIntegrity = integrityCheck.hashMatch;
    }

    const result: VerificationResult = {
      certificateId: certificate?.id ?? 0,
      certificateNumber,
      valid: certificate !== null && 
             certificate.status === 'issued' && 
             qrCodeValid && 
             digitalSignatureValid && 
             dataIntegrity,
      status: certificate?.status ?? 'not_found',
      verifiedAt: new Date(),
      verifiedBy,
      method,
      details: {
        certificateExists: certificate !== null,
        certificateStatus: certificate?.status ?? 'not_found',
        qrCodeValid,
        digitalSignatureValid,
        dataIntegrity,
        complianceAuthority: certificate?.complianceAuthority ?? undefined,
        issuedAt: certificate?.createdAt ?? new Date(),
        expiryDate: undefined,
      },
      error: certificate ? undefined : 'Certificate not found',
    };

    if (certificate) {
      await prisma.certificateVerification.create({
        data: {
          companyId: certificate.companyId,
          certificateId: certificate.id,
          verifiedBy,
          method,
          result: result.valid ? 'valid' : 'invalid',
          notes: notes ?? (result.error ?? ''),
        },
      });
    }

    return result;
  }

  static async bulkVerifyCertificates(request: BulkVerificationRequest): Promise<BulkVerificationResult> {
    const { certificateNumbers, verifiedBy, method, ipAddress, userAgent } = request;

    const results: VerificationResult[] = [];
    let valid = 0;
    let invalid = 0;
    let errors = 0;

    for (const certNumber of certificateNumbers) {
      try {
        const result = await this.verifyCertificate({
          certificateNumber: certNumber,
          verifiedBy,
          method,
          ipAddress,
          userAgent,
        });
        results.push(result);
        
        if (result.valid) {
          valid++;
        } else {
          invalid++;
        }
      } catch (error) {
        errors++;
        results.push({
          certificateId: 0,
          certificateNumber: certNumber,
          valid: false,
          status: 'error',
          verifiedAt: new Date(),
          verifiedBy,
          method,
          details: {
            certificateExists: false,
            certificateStatus: 'error',
            qrCodeValid: false,
            digitalSignatureValid: false,
            dataIntegrity: false,
            issuedAt: new Date(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      results,
      summary: { total: certificateNumbers.length, valid, invalid, errors },
    };
  }

  static async getVerificationHistory(certificateId: number, companyId: number) {
    return prisma.certificateVerification.findMany({
      where: { certificateId, companyId },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  static async getVerificationStats(companyId: number, options?: {
    startDate?: Date;
    endDate?: Date;
    method?: string;
  }) {
    const { startDate, endDate, method } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (startDate || endDate) {
      const verifiedAtFilter: Record<string, Date> = {};
      if (startDate) verifiedAtFilter.gte = startDate;
      if (endDate) verifiedAtFilter.lte = endDate;
      where.verifiedAt = verifiedAtFilter;
    }
    if (method) where.method = method;

    const [total, valid, invalid, byMethod] = await Promise.all([
      prisma.certificateVerification.count({ where }),
      prisma.certificateVerification.count({ where: { ...where, result: 'valid' } }),
      prisma.certificateVerification.count({ where: { ...where, result: 'invalid' } }),
      prisma.certificateVerification.groupBy({
        by: ['method'],
        where,
        _count: { method: true },
      }),
    ]);

    return {
      total,
      valid,
      invalid,
      byMethod: byMethod.map(m => ({ method: m.method, count: m._count.method })),
    };
  }

  static async verifyQRCodeData(qrData: string): Promise<{
    valid: boolean;
    certificate?: {
      id: number;
      number: string;
      status: string;
      traineeName?: string;
      completionDate?: Date;
    };
    error?: string;
  }> {
    const validation = await QRCodeService.validateQRCodeData(qrData);

    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: validation.certificateId! },
      select: { id: true, number: true, status: true, createdAt: true },
    });

    if (!certificate) {
      return { valid: false, error: 'Certificate not found' };
    }

    return {
      valid: true,
      certificate: {
        id: certificate.id,
        number: certificate.number,
        status: certificate.status ?? 'unknown',
        completionDate: certificate.createdAt,
      },
    };
  }

  static async generateVerificationReport(companyId: number, options?: {
    startDate?: Date;
    endDate?: Date;
    format?: 'json' | 'csv';
  }): Promise<string | Awaited<ReturnType<typeof prisma.certificateVerification.findMany>>> {
    const { startDate, endDate, format = 'json' } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (startDate || endDate) {
      const verifiedAtFilter: Record<string, Date> = {};
      if (startDate) verifiedAtFilter.gte = startDate;
      if (endDate) verifiedAtFilter.lte = endDate;
      where.verifiedAt = verifiedAtFilter;
    }

    const verifications = await prisma.certificateVerification.findMany({
      where,
      include: {
        certificate: {
          select: { number: true, jobNumber: true, status: true },
        },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = ['Certificate Number', 'Job Number', 'Status', 'Verified By', 'Method', 'Result', 'Verified At', 'Notes'];
      const rows = verifications.map(v => [
        v.certificate?.number ?? 'N/A',
        v.certificate?.jobNumber ?? 'N/A',
        v.certificate?.status ?? 'N/A',
        v.verifiedBy,
        v.method,
        v.result,
        v.verifiedAt.toISOString(),
        v.notes ?? '',
      ]);
      return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    return verifications;
  }
}

export default VerificationService;
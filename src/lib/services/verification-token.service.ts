import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface VerificationTokenData {
  certificateId: number;
  certificateNumber: string;
  companyId: number;
  issuedAt: Date;
  expiresAt?: Date;
}

export interface VerificationResult {
  valid: boolean;
  certificate?: {
    id: number;
    number: string;
    status: string;
    complianceAuthority: string | null;
    createdAt: Date;
    updatedAt: Date;
    job: {
      id: number;
      jobNumber: string;
      customer: {
        name: string;
      } | null;
    };
    company: {
      id: number;
      name: string;
      logo: string | null;
    };
  };
  error?: string;
  verificationStatus: 'VALID' | 'EXPIRED' | 'REVOKED' | 'CANCELLED' | 'INVALID';
}

export class VerificationTokenService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_PREFIX = 'cert_';

  static generateToken(): string {
    const randomBytes = crypto.randomBytes(this.TOKEN_LENGTH);
    return this.TOKEN_PREFIX + randomBytes.toString('hex');
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async createVerificationToken(
    certificateId: number,
    companyId: number,
    expiresAt?: Date
  ): Promise<{ token: string; tokenHash: string }> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    await prisma.certificate.update({
      where: { id: certificateId, companyId },
      data: {
        verificationToken: tokenHash,
        verificationTokenExpiresAt: expiresAt,
      },
    });

    return { token, tokenHash };
  }

  static async verifyToken(token: string): Promise<VerificationResult> {
    const tokenHash = this.hashToken(token);

    const certificate = await prisma.certificate.findFirst({
      where: {
        verificationToken: tokenHash,
      },
      include: {
        job: {
          include: {
            customer: true,
          },
        },
        company: true,
        verifications: {
          orderBy: { verifiedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!certificate) {
      return {
        valid: false,
        error: 'Certificate not found',
        verificationStatus: 'INVALID',
      };
    }

    if (certificate.verificationTokenExpiresAt && new Date() > certificate.verificationTokenExpiresAt) {
      return {
        valid: false,
        certificate: this.formatCertificate(certificate),
        error: 'Verification token has expired',
        verificationStatus: 'EXPIRED',
      };
    }

    let verificationStatus: VerificationResult['verificationStatus'] = 'VALID';

    switch (certificate.status) {
      case 'revoked':
        verificationStatus = 'REVOKED';
        break;
      case 'cancelled':
        verificationStatus = 'CANCELLED';
        break;
      case 'expired':
        verificationStatus = 'EXPIRED';
        break;
      case 'issued':
        verificationStatus = 'VALID';
        break;
      default:
        verificationStatus = 'INVALID';
    }

    await this.logVerification(certificate.id, certificate.companyId, token, verificationStatus);

    return {
      valid: verificationStatus === 'VALID',
      certificate: this.formatCertificate(certificate),
      verificationStatus,
    };
  }

  static async verifyByCertificateNumber(certificateNumber: string, companyId?: number): Promise<VerificationResult> {
    const where: Record<string, unknown> = { number: certificateNumber };
    if (companyId) where.companyId = companyId;

    const certificate = await prisma.certificate.findFirst({
      where,
      include: {
        job: {
          include: {
            customer: true,
          },
        },
        company: true,
        verifications: {
          orderBy: { verifiedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!certificate) {
      return {
        valid: false,
        error: 'Certificate not found',
        verificationStatus: 'INVALID',
      };
    }

    let verificationStatus: VerificationResult['verificationStatus'] = 'VALID';

    switch (certificate.status) {
      case 'revoked':
        verificationStatus = 'REVOKED';
        break;
      case 'cancelled':
        verificationStatus = 'CANCELLED';
        break;
      case 'expired':
        verificationStatus = 'EXPIRED';
        break;
      case 'issued':
        verificationStatus = 'VALID';
        break;
      default:
        verificationStatus = 'INVALID';
    }

    await this.logVerification(certificate.id, certificate.companyId, `manual:${certificateNumber}`, verificationStatus);

    return {
      valid: verificationStatus === 'VALID',
      certificate: this.formatCertificate(certificate),
      verificationStatus,
    };
  }

  private static async logVerification(
    certificateId: number,
    companyId: number,
    method: string,
    result: string
  ): Promise<void> {
    try {
      await prisma.certificateVerification.create({
        data: {
          certificateId,
          companyId,
          verifiedBy: 'public_verification',
          method,
          result,
        },
      });
    } catch {
      // Non-blocking: verification logging failure shouldn't break verification
    }
  }

  private static formatCertificate(certificate: {
    id: number;
    number: string;
    status: string | null;
    complianceAuthority: string | null;
    createdAt: Date;
    updatedAt: Date;
    job: {
      id: number;
      jobNumber: string;
      customer: { contact: string | null; email: string | null } | null;
    };
    company: {
      id: number;
      name: string;
      logo: string | null;
    };
  }): VerificationResult['certificate'] {
    return {
      id: certificate.id,
      number: certificate.number,
      status: certificate.status ?? 'unknown',
      complianceAuthority: certificate.complianceAuthority,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
      job: {
        id: certificate.job.id,
        jobNumber: certificate.job.jobNumber,
        customer: certificate.job.customer ? { name: certificate.job.customer.contact ?? certificate.job.customer.email ?? 'Unknown Customer' } : null,
      },
      company: {
        id: certificate.company.id,
        name: certificate.company.name,
        logo: certificate.company.logo,
      },
    };
  }

  static async revokeToken(certificateId: number, companyId: number): Promise<void> {
    await prisma.certificate.update({
      where: { id: certificateId, companyId },
      data: {
        verificationToken: null,
        verificationTokenExpiresAt: null,
        status: 'revoked',
      },
    });
  }

  static async rotateToken(certificateId: number, companyId: number, expiresAt?: Date): Promise<{ token: string; tokenHash: string }> {
    const { token, tokenHash } = await this.createVerificationToken(certificateId, companyId, expiresAt);
    return { token, tokenHash };
  }
}



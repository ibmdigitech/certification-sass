import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export interface QRCodeOptions {
  certificateId: number;
  certificateNumber: string;
  verificationUrl: string;
  size?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

export interface QRCodeResult {
  dataUrl: string;
  buffer: Buffer;
  svg: string;
}

export class QRCodeService {
  static async generateQRCode(options: QRCodeOptions): Promise<QRCodeResult> {
    const { certificateId, certificateNumber, verificationUrl, size = 300, margin = 2, color = { dark: '#000000', light: '#ffffff' } } = options;

    const qrData = JSON.stringify({
      certId: certificateId,
      certNumber: certificateNumber,
      verifyUrl: verificationUrl,
      timestamp: Date.now(),
    });

    const qrOptions = {
      width: size,
      margin,
      color,
      errorCorrectionLevel: 'M' as const,
    };

    const [dataUrl, buffer, svg] = await Promise.all([
      QRCode.toDataURL(qrData, qrOptions),
      QRCode.toBuffer(qrData, qrOptions),
      QRCode.toString(qrData, { ...qrOptions, type: 'svg' }),
    ]);

    return { dataUrl, buffer, svg };
  }

  static async generateQRCodeForCertificate(
    certificateId: number,
    baseUrl: string
  ): Promise<QRCodeResult> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, number: true, companyId: true },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    const verificationUrl = `${baseUrl}/verify/${certificate.number}`;

    return this.generateQRCode({
      certificateId: certificate.id,
      certificateNumber: certificate.number,
      verificationUrl,
    });
  }

  static async saveQRCodeToCertificate(
    certificateId: number,
    qrUrl: string
  ): Promise<void> {
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { qrUrl },
    });
  }

  static async generateAndSaveQRCode(
    certificateId: number,
    baseUrl: string
  ): Promise<QRCodeResult> {
    const result = await this.generateQRCodeForCertificate(certificateId, baseUrl);
    await this.saveQRCodeToCertificate(certificateId, result.dataUrl);
    return result;
  }

  static async validateQRCodeData(qrData: string): Promise<{
    valid: boolean;
    certificateId?: number;
    certificateNumber?: string;
    verificationUrl?: string;
    error?: string;
  }> {
    try {
      const parsed = JSON.parse(qrData);
      
      if (!parsed.certId || !parsed.certNumber || !parsed.verifyUrl) {
        return { valid: false, error: 'Invalid QR code data structure' };
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parsed.certId },
        select: { id: true, number: true, status: true },
      });

      if (!certificate) {
        return { valid: false, error: 'Certificate not found' };
      }

      if (certificate.number !== parsed.certNumber) {
        return { valid: false, error: 'Certificate number mismatch' };
      }

      if (certificate.status === 'revoked' || certificate.status === 'expired') {
        return { valid: false, error: `Certificate is ${certificate.status}` };
      }

      return {
        valid: true,
        certificateId: certificate.id,
        certificateNumber: certificate.number,
        verificationUrl: parsed.verifyUrl,
      };
    } catch {
      return { valid: false, error: 'Invalid QR code data format' };
    }
  }
}

export default QRCodeService;



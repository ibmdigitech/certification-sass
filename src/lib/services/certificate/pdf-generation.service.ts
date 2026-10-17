import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { QRCodeService } from './qr-code.service';
import { Readable } from 'stream';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  logoPosition?: { x: number; y: number; width: number; height: number };
  titlePosition?: { x: number; y: number };
  contentPosition?: { x: number; y: number };
  footerPosition?: { x: number; y: number };
  fonts: {
    title: { family: string; size: number; color: string; bold: boolean };
    subtitle: { family: string; size: number; color: string; bold: boolean };
    body: { family: string; size: number; color: string; bold: boolean };
    footer: { family: string; size: number; color: string; bold: boolean };
  };
  fields: CertificateField[];
}

export interface CertificateField {
  id: string;
  label: string;
  valueKey: string;
  position: { x: number; y: number };
  font?: { family: string; size: number; color: string; bold: boolean };
  format?: (value: unknown) => string;
}

export interface CertificateData {
  certificateNumber: string;
  traineeName: string;
  traineeEmail?: string;
  traineeEmployeeId?: string;
  jobNumber: string;
  jobTitle?: string;
  trainingModule?: string;
  completionDate: Date;
  expiryDate?: Date;
  complianceAuthority?: string;
  issuedBy: string;
  issuedAt: Date;
  companyName: string;
  companyLogo?: string;
  qrCodeDataUrl?: string;
  digitalSignature?: string;
  customFields?: Record<string, string>;
}

export interface PDFGenerationOptions {
  template: CertificateTemplate;
  data: CertificateData;
  includeQRCode: boolean;
  includeDigitalSignature: boolean;
  outputFormat: 'buffer' | 'stream' | 'base64';
}

export class PDFGenerationService {
  static readonly DEFAULT_TEMPLATE: CertificateTemplate = {
    id: 'default',
    name: 'Default Certificate Template',
    description: 'Standard certificate layout with QR code and signature',
    width: 841.89,
    height: 595.28,
    backgroundColor: '#ffffff',
    logoPosition: { x: 50, y: 50, width: 120, height: 80 },
    titlePosition: { x: 0, y: 150 },
    contentPosition: { x: 100, y: 250 },
    footerPosition: { x: 50, y: 500 },
    fonts: {
      title: { family: 'Helvetica-Bold', size: 36, color: '#1a1a2e', bold: true },
      subtitle: { family: 'Helvetica', size: 18, color: '#4a4a6a', bold: false },
      body: { family: 'Helvetica', size: 14, color: '#333333', bold: false },
      footer: { family: 'Helvetica', size: 10, color: '#888888', bold: false },
    },
    fields: [
      { id: 'traineeName', label: 'Awarded to', valueKey: 'traineeName', position: { x: 100, y: 250 }, font: { family: 'Helvetica-Bold', size: 24, color: '#1a1a2e', bold: true } },
      { id: 'trainingModule', label: 'For successful completion of', valueKey: 'trainingModule', position: { x: 100, y: 300 }, font: { family: 'Helvetica', size: 16, color: '#4a4a6a', bold: false } },
      { id: 'jobNumber', label: 'Job Reference', valueKey: 'jobNumber', position: { x: 100, y: 340 }, font: { family: 'Helvetica', size: 12, color: '#666666', bold: false } },
      { id: 'completionDate', label: 'Completed on', valueKey: 'completionDate', position: { x: 100, y: 370 }, font: { family: 'Helvetica', size: 12, color: '#666666', bold: false }, format: (v: unknown) => v instanceof Date ? v.toLocaleDateString() : String(v) },
      { id: 'expiryDate', label: 'Valid until', valueKey: 'expiryDate', position: { x: 100, y: 400 }, font: { family: 'Helvetica', size: 12, color: '#666666', bold: false }, format: (v: unknown) => v instanceof Date ? v.toLocaleDateString() : String(v) },
      { id: 'complianceAuthority', label: 'Compliance Authority', valueKey: 'complianceAuthority', position: { x: 100, y: 430 }, font: { family: 'Helvetica', size: 12, color: '#666666', bold: false } },
      { id: 'issuedBy', label: 'Issued by', valueKey: 'issuedBy', position: { x: 100, y: 460 }, font: { family: 'Helvetica', size: 12, color: '#666666', bold: false } },
    ],
  };

  static readonly MODERN_TEMPLATE: CertificateTemplate = {
    id: 'modern',
    name: 'Modern Certificate Template',
    description: 'Clean modern design with accent colors',
    width: 841.89,
    height: 595.28,
    backgroundColor: '#f8fafc',
    logoPosition: { x: 60, y: 60, width: 100, height: 60 },
    titlePosition: { x: 60, y: 160 },
    contentPosition: { x: 60, y: 220 },
    footerPosition: { x: 60, y: 480 },
    fonts: {
      title: { family: 'Helvetica-Bold', size: 40, color: '#0f172a', bold: true },
      subtitle: { family: 'Helvetica', size: 20, color: '#334155', bold: false },
      body: { family: 'Helvetica', size: 14, color: '#475569', bold: false },
      footer: { family: 'Helvetica', size: 10, color: '#94a3b8', bold: false },
    },
    fields: [
      { id: 'traineeName', label: '', valueKey: 'traineeName', position: { x: 60, y: 220 }, font: { family: 'Helvetica-Bold', size: 28, color: '#0f172a', bold: true } },
      { id: 'trainingModule', label: 'has successfully completed', valueKey: 'trainingModule', position: { x: 60, y: 270 }, font: { family: 'Helvetica', size: 16, color: '#334155', bold: false } },
      { id: 'jobNumber', label: 'Job', valueKey: 'jobNumber', position: { x: 60, y: 310 }, font: { family: 'Helvetica', size: 12, color: '#64748b', bold: false } },
      { id: 'completionDate', label: 'Date', valueKey: 'completionDate', position: { x: 60, y: 335 }, font: { family: 'Helvetica', size: 12, color: '#64748b', bold: false }, format: (v: unknown) => v instanceof Date ? v.toLocaleDateString() : String(v) },
      { id: 'expiryDate', label: 'Expires', valueKey: 'expiryDate', position: { x: 60, y: 360 }, font: { family: 'Helvetica', size: 12, color: '#64748b', bold: false }, format: (v: unknown) => v instanceof Date ? v.toLocaleDateString() : String(v) },
      { id: 'issuedBy', label: 'Authorized by', valueKey: 'issuedBy', position: { x: 60, y: 385 }, font: { family: 'Helvetica', size: 12, color: '#64748b', bold: false } },
    ],
  };

  static async generateCertificatePDF(options: PDFGenerationOptions): Promise<Buffer | string | Readable> {
    const { template, data, includeQRCode, includeDigitalSignature, outputFormat } = options;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [template.width, template.height],
        margin: 0,
        info: {
          Title: `Certificate ${data.certificateNumber}`,
          Author: data.companyName,
          Subject: `Training Certificate for ${data.traineeName}`,
          Keywords: `certificate, training, ${data.certificateNumber}`,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (outputFormat === 'buffer') {
          resolve(buffer);
        } else if (outputFormat === 'base64') {
          resolve(buffer.toString('base64'));
        } else {
          const stream = new Readable();
          stream.push(buffer);
          stream.push(null);
          resolve(stream);
        }
      });
      doc.on('error', reject);

      this.drawBackground(doc, template);
      this.drawLogo(doc, template, data);
      this.drawTitle(doc, template, data);
      this.drawFields(doc, template, data);
      
      if (includeQRCode && data.qrCodeDataUrl) {
        this.drawQRCode(doc, template, data);
      }

      if (includeDigitalSignature && data.digitalSignature) {
        this.drawDigitalSignature(doc, template, data);
      }

      this.drawFooter(doc, template, data);

      doc.end();
    });
  }

  private static drawBackground(doc: PDFKit.PDFDocument, template: CertificateTemplate): void {
    doc.rect(0, 0, template.width, template.height).fill(template.backgroundColor);
    
    if (template.backgroundImage) {
      doc.image(template.backgroundImage, 0, 0, { width: template.width, height: template.height });
    }
  }

  private static drawLogo(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (template.logoPosition && data.companyLogo) {
      const { x, y, width, height } = template.logoPosition;
      try {
        doc.image(data.companyLogo, x, y, { width, height });
      } catch {
        doc.rect(x, y, width, height).stroke('#cccccc');
        doc.font('Helvetica').fontSize(8).fillColor('#999999').text('LOGO', x + width / 2 - 10, y + height / 2 - 4);
      }
    }
  }

  private static drawTitle(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (!template.titlePosition) return;

    const { x, y } = template.titlePosition;
    const { family, size, color, bold } = template.fonts.title;

    doc.font(bold ? 'Helvetica-Bold' : family)
      .fontSize(size)
      .fillColor(color);

    const title = 'CERTIFICATE OF COMPLETION';
    const titleWidth = doc.widthOfString(title);
    const centerX = x === 0 ? (template.width - titleWidth) / 2 : x;

    doc.text(title, centerX, y, { align: 'center', width: template.width - centerX * 2 });
  }

  private static drawFields(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (!template.fields || !template.contentPosition) return;

    const { x: baseX, y: baseY } = template.contentPosition;

    for (const field of template.fields) {
      const { label, valueKey, position, font, format } = field;
      const dataRecord = data as unknown as Record<string, unknown>;
      const value = dataRecord[valueKey] ?? data.customFields?.[valueKey];

      if (value === undefined || value === null || value === '') continue;

      const x = baseX + position.x;
      const y = baseY + position.y;

      const fieldFont = font ?? template.fonts.body;
      doc.font(fieldFont.bold ? 'Helvetica-Bold' : fieldFont.family)
        .fontSize(fieldFont.size)
        .fillColor(fieldFont.color);

      const formattedValue = format ? format(value) : String(value);
      
      if (label) {
        doc.text(label, x, y, { continued: true });
        doc.font(fieldFont.bold ? 'Helvetica-Bold' : fieldFont.family)
          .fontSize(fieldFont.size)
          .fillColor(fieldFont.color)
          .text(` ${formattedValue}`);
      } else {
        doc.text(formattedValue, x, y);
      }
    }
  }

  private static drawQRCode(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (!data.qrCodeDataUrl) return;

    const qrSize = 100;
    const qrX = template.width - qrSize - 50;
    const qrY = 50;

    try {
      doc.image(data.qrCodeDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
      
      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text('Scan to verify', qrX, qrY + qrSize + 5, { width: qrSize, align: 'center' });
    } catch {
      doc.rect(qrX, qrY, qrSize, qrSize).stroke('#cccccc');
      doc.font('Helvetica').fontSize(8).fillColor('#999999').text('QR CODE', qrX + 15, qrY + qrSize / 2 - 4);
    }
  }

  private static drawDigitalSignature(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (!data.digitalSignature) return;

    const sigX = 50;
    const sigY = template.height - 80;

    doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#333333')
      .text('Digital Signature:', sigX, sigY);

    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#666666')
      .text(data.digitalSignature, sigX, sigY + 15, { width: 200 });
  }

  private static drawFooter(doc: PDFKit.PDFDocument, template: CertificateTemplate, data: CertificateData): void {
    if (!template.footerPosition) return;

    const { x, y } = template.footerPosition;
    const { family, size, color, bold } = template.fonts.footer;

    doc.font(bold ? 'Helvetica-Bold' : family)
      .fontSize(size)
      .fillColor(color)
      .text(
        `Certificate No: ${data.certificateNumber} | Issued: ${data.issuedAt.toLocaleDateString()} | ${data.companyName}`,
        x,
        y,
        { width: template.width - x * 2, align: 'center' }
      );
  }

  static async generateCertificateFromDB(
    certificateId: number,
    templateId: string = 'default',
    baseUrl: string,
    options: {
      includeQRCode?: boolean;
      includeDigitalSignature?: boolean;
      outputFormat?: 'buffer' | 'stream' | 'base64';
    } = {}
  ): Promise<Buffer | string | Readable> {
    const { includeQRCode = true, includeDigitalSignature = true, outputFormat = 'buffer' } = options;

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        job: {
          include: { customer: true },
        },
      },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    const template = templateId === 'modern' ? this.MODERN_TEMPLATE : this.DEFAULT_TEMPLATE;

    let qrCodeDataUrl: string | undefined;
    if (includeQRCode) {
      const qrResult = await QRCodeService.generateQRCodeForCertificate(certificateId, baseUrl);
      qrCodeDataUrl = qrResult.dataUrl;
    }

    const certificateData: CertificateData = {
      certificateNumber: certificate.number,
      traineeName: 'Trainee Name',
      jobNumber: certificate.jobNumber,
      completionDate: certificate.createdAt,
      issuedBy: 'Training Administrator',
      issuedAt: certificate.createdAt,
      companyName: certificate.job.customer?.contact ?? 'Company',
      qrCodeDataUrl,
      digitalSignature: includeDigitalSignature ? await this.generateDigitalSignature(certificate) : undefined,
    };

    return this.generateCertificatePDF({
      template,
      data: certificateData,
      includeQRCode,
      includeDigitalSignature,
      outputFormat,
    });
  }

  static async generateDigitalSignature(certificate: { id: number; number: string; companyId: number }): Promise<string> {
    const crypto = await import('crypto');
    const data = `${certificate.id}:${certificate.number}:${certificate.companyId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  static getAvailableTemplates(): CertificateTemplate[] {
    return [this.DEFAULT_TEMPLATE, this.MODERN_TEMPLATE];
  }

  static getTemplateById(templateId: string): CertificateTemplate | undefined {
    return this.getAvailableTemplates().find(t => t.id === templateId);
  }
}

export default PDFGenerationService;



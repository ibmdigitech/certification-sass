import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { QRCodeService } from './qr-code.service';
import { Readable } from 'stream';

export interface CertificateTemplateContent {
  pageSize: string;
  orientation: string;
  header?: {
    companyLogo?: string;
    accreditationLogo?: string;
    companyName?: string;
    address?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
  };
  certificateType?: string;
  // Training certificate fields
  traineeInformation?: {
    traineeName?: string;
    traineePhoto?: string;
    identityDocuments?: Array<{
      documentType?: string;
      documentNumber?: string;
      documentImage?: string;
    }>;
    employeeOf?: string;
  };
  trainingInformation?: {
    trainingCourse?: string;
    trainingCategory?: string;
    trainingLevel?: string;
    topicsCovered?: string | string[];
    heldOn?: string;
    validUntil?: string;
  };
  trainerDetails?: {
    approvedBy?: string;
    trainerName?: string;
    trainerId?: string;
    trainerSignature?: string;
  };
  verificationSection?: {
    qrCode?: string;
    certificateHash?: string;
    verificationUrl?: string;
  };
  certificateFooter?: {
    terms?: string[];
    footerCode?: string;
  };
  // Inspection certificate fields
  generalInformation?: {
    companyName?: string;
    timeSheetNo?: string;
    typeOfInspection?: string;
    procedureNo?: string;
    dateOfInspection?: string;
    referenceStandard?: string;
    location?: string;
    testingEquipmentDetails?: string;
    previousInspectionDetails?: string;
    result?: string;
  };
  equipmentDetails?: {
    serialNo?: string;
    description?: string;
    manufacturerYear?: string;
  };
  inspectionDetails?: {
    model?: string;
    quantity?: string;
    powerSupply?: string;
    size?: string;
    swl?: string;
    testLoad?: string;
    nextInspectionDate?: string;
    lastThoroughExamination?: string;
    lastProofLoadTest?: string;
    nextProofLoadTestDate?: string;
  };
  inspectionChecklist?: Array<{
    category?: string;
    items?: Array<{
      description?: string;
      status?: string;
      remark?: string;
    }>;
  }>;
  inspectionFindings?: {
    findings?: string;
    criticalFindings?: string;
  };
  inspectorDetails?: {
    inspectedBy?: string;
    approvedBy?: string;
    inspectorSignature?: string;
    approverSignature?: string;
  };
}

export interface PDFGenerationOptions {
  templateContent: CertificateTemplateContent;
  data: Record<string, any>;
  includeQRCode: boolean;
  includeDigitalSignature: boolean;
  outputFormat: 'buffer' | 'stream' | 'base64';
}

export class PDFGenerationService {
  static readonly A4_WIDTH = 595.28;
  static readonly A4_HEIGHT = 841.89;
  static readonly MARGIN = 40;

  static async generateCertificatePDF(options: PDFGenerationOptions): Promise<Buffer | string | Readable> {
    const { templateContent, data, includeQRCode, includeDigitalSignature, outputFormat } = options;

    return new Promise((resolve, reject) => {
      const isLandscape = templateContent.orientation === 'landscape';
      const width = isLandscape ? this.A4_HEIGHT : this.A4_WIDTH;
      const height = isLandscape ? this.A4_WIDTH : this.A4_HEIGHT;

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
        info: {
          Title: `Certificate ${data.certificateNumber}`,
          Author: data.companyName,
          Subject: `${templateContent.certificateType} Certificate for ${data.holderName}`,
          Keywords: `certificate, ${templateContent.certificateType?.toLowerCase()}, ${data.certificateNumber}`,
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

      // Draw the certificate
      this.drawCertificate(doc, templateContent, data, width, height, includeQRCode, includeDigitalSignature);

      doc.end();
    });
  }

  private static drawCertificate(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    height: number,
    includeQRCode: boolean,
    includeDigitalSignature: boolean
  ): void {
    const margin = this.MARGIN;
    let y = margin;

    // Background
    doc.rect(0, 0, width, height).fill('#ffffff');

    // Header Section
    y = this.drawHeader(doc, template, data, width, height, margin, y);
    
    // Certificate Title
    y = this.drawTitle(doc, template, data, width, margin, y);
    
    // Main Content based on certificate type
    if (template.certificateType === 'Training') {
      y = this.drawTrainingContent(doc, template, data, width, margin, y);
    } else if (template.certificateType === 'Inspection') {
      y = this.drawInspectionContent(doc, template, data, width, margin, y);
    }

    // Verification Section
    y = this.drawVerification(doc, template, data, width, margin, y, includeQRCode);

    // Footer
    this.drawFooter(doc, template, data, width, height, margin);

    // Digital Signature
    if (includeDigitalSignature && data.digitalSignature) {
      this.drawDigitalSignature(doc, data, width, height, margin);
    }
  }

  private static drawHeader(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    height: number,
    margin: number,
    y: number
  ): number {
    const header = template.header || {};
    const logoSize = 60;
    const logoX = margin;
    const logoY = y;

    // Company Logo placeholder
    if (header.companyLogo) {
      try {
        doc.image(header.companyLogo, logoX, logoY, { width: logoSize, height: logoSize });
      } catch {
        doc.rect(logoX, logoY, logoSize, logoSize).stroke('#cccccc');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#999999').text('LOGO', logoX + 15, logoY + 25);
      }
    }

    // Accreditation Logo
    if (header.accreditationLogo) {
      try {
        doc.image(header.accreditationLogo, width - margin - logoSize, logoY, { width: logoSize, height: logoSize });
      } catch {
        doc.rect(width - margin - logoSize, logoY, logoSize, logoSize).stroke('#cccccc');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#999999').text('ACCRED', width - margin - logoSize + 5, logoY + 25);
      }
    }

    // Company Info
    const companyX = logoX + logoSize + 10;
    let companyY = logoY;

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a1a2e').text(header.companyName || data.companyName || 'Company', companyX, companyY);
    companyY += 20;
    doc.font('Helvetica').fontSize(9).fillColor('#666666').text(header.address || 'Address not available', companyX, companyY);
    companyY += 12;
    
    const contact = header.contact || {};
    if (contact.phone || contact.email) {
      doc.font('Helvetica').fontSize(8).fillColor('#888888');
      const contactText = [contact.phone, contact.email].filter(Boolean).join(' | ');
      doc.text(contactText, companyX, companyY);
    }

    // Horizontal line under header
    const lineY = logoY + logoSize + 10;
    doc.moveTo(margin, lineY).lineTo(width - margin, lineY).stroke('#e0e0e0');

    return lineY + 10;
  }

  private static drawTitle(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    margin: number,
    y: number
  ): number {
    const title = template.certificateType === 'Training' 
      ? 'CERTIFICATE OF TRAINING COMPLETION' 
      : 'INSPECTION CERTIFICATE';

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a2e');
    const titleWidth = doc.widthOfString(title);
    const centerX = (width - titleWidth) / 2;
    doc.text(title, centerX, y, { width: width - centerX * 2, align: 'center' });

    // Certificate Number
    y += 35;
    doc.font('Helvetica').fontSize(11).fillColor('#666666');
    doc.text(`Certificate No: ${data.certificateNumber || ''}`, margin, y, { width: width - margin * 2, align: 'center' });
    y += 16;
    doc.text(`Job No: ${data.jobNumber || ''}`, margin, y, { width: width - margin * 2, align: 'center' });

    return y + 20;
  }

  private static drawTrainingContent(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    margin: number,
    y: number
  ): number {
    const ti = template.traineeInformation || {};
    const trInfo = template.trainingInformation || {};
    const td = template.trainerDetails || {};

    // Trainee Information Section
    y = this.drawSectionHeader(doc, 'TRAINEE INFORMATION', width, margin, y);
    
    y = this.drawKeyValuePair(doc, 'Trainee Name:', data.holderName || ti.traineeName || '', margin, y, width);
    
    // Photo placeholder
    if (ti.traineePhoto || data.photoUrl) {
      const photoX = width - margin - 100;
      const photoY = y - 15;
      try {
        doc.image(ti.traineePhoto || data.photoUrl, photoX, photoY, { width: 80, height: 100 });
      } catch {
        doc.rect(photoX, photoY, 80, 100).stroke('#cccccc');
        doc.font('Helvetica').fontSize(8).fillColor('#999999').text('PHOTO', photoX + 20, photoY + 45);
      }
    }

    // Identity Documents
    y = this.drawKeyValuePair(doc, 'Employee Of:', data.holderCompany || ti.employeeOf || '', margin, y, width);
    
    const idDocs = ti.identityDocuments || [];
    if (idDocs.length > 0 || data.idTypeUsed || data.idNumber) {
      y = this.drawSectionHeader(doc, 'IDENTITY DOCUMENTS', width, margin, y);
      for (const idDoc of idDocs) {
        y = this.drawKeyValuePair(doc, `  ${idDoc.documentType || 'ID'}:`, idDoc.documentNumber || data.idNumber || '', margin + 20, y, width - 40);
        if (idDoc.documentImage) {
          try {
            doc.image(idDoc.documentImage, margin + 40, y + 5, { width: 120, height: 60 });
            y += 65;
          } catch {}
        }
      }
      if (data.idTypeUsed) {
        y = this.drawKeyValuePair(doc, `  ID Type:`, data.idTypeUsed, margin + 20, y, width - 40);
        y = this.drawKeyValuePair(doc, `  ID Number:`, data.idNumber || '', margin + 20, y, width - 40);
      }
    }

    // Training Information Section
    y = this.drawSectionHeader(doc, 'TRAINING INFORMATION', width, margin, y);
    
    y = this.drawKeyValuePair(doc, 'Training Course:', data.courseTitle || trInfo.trainingCourse || '', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Training Category:', trInfo.trainingCategory || '', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Training Level:', trInfo.trainingLevel || '', margin, y, width);
    
    if (trInfo.topicsCovered) {
      const topics = Array.isArray(trInfo.topicsCovered) ? trInfo.topicsCovered.join(', ') : trInfo.topicsCovered;
      y = this.drawKeyValuePair(doc, 'Topics Covered:', topics, margin, y, width);
    }

    y = this.drawKeyValuePair(doc, 'Held On:', data.trainingDate || trInfo.heldOn || '', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Valid Until:', data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : trInfo.validUntil || '', margin, y, width);

    // Trainer Details
    y = this.drawSectionHeader(doc, 'TRAINER DETAILS', width, margin, y);
    y = this.drawKeyValuePair(doc, 'Approved By:', td.approvedBy || 'Training Manager', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Trainer Name:', data.trainerName || td.trainerName || '', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Trainer ID:', td.trainerId || '', margin, y, width);
    
    if (td.trainerSignature || data.trainerSignatureUrl) {
      const sigY = y;
      try {
        doc.image(td.trainerSignature || data.trainerSignatureUrl, margin, sigY, { width: 150, height: 60 });
        y += 65;
      } catch {
        y = this.drawKeyValuePair(doc, 'Trainer Signature:', '[Signature on file]', margin, y, width);
      }
    }

    return y + 10;
  }

  private static drawInspectionContent(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    margin: number,
    y: number
  ): number {
    const gi = template.generalInformation || {};
    const ed = template.equipmentDetails || {};
    const id = template.inspectionDetails || {};
    const ic = template.inspectionChecklist || [];
    const iff = template.inspectionFindings || {};
    const ins = template.inspectorDetails || {};

    // General Information
    y = this.drawSectionHeader(doc, 'GENERAL INFORMATION', width, margin, y);
    
    const genFields = [
      { label: 'Company Name:', value: data.holderCompany || gi.companyName || '' },
      { label: 'Time Sheet No:', value: data.timesheetNumber || gi.timeSheetNo || '' },
      { label: 'Type of Inspection:', value: data.inspectionType || gi.typeOfInspection || '' },
      { label: 'Procedure No:', value: gi.procedureNo || '' },
      { label: 'Date of Inspection:', value: data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : gi.dateOfInspection || '' },
      { label: 'Reference Standard:', value: gi.referenceStandard || '' },
      { label: 'Location:', value: data.locationName || gi.location || '' },
      { label: 'Testing Equipment Details:', value: gi.testingEquipmentDetails || '' },
      { label: 'Previous Inspection Details:', value: gi.previousInspectionDetails || '' },
      { label: 'Result:', value: data.result || gi.result || '' },
    ];

    for (const field of genFields) {
      y = this.drawKeyValuePair(doc, field.label, field.value, margin, y, width);
    }

    // Equipment Details
    y = this.drawSectionHeader(doc, 'EQUIPMENT DETAILS', width, margin, y);
    
    const equipFields = [
      { label: 'Serial No:', value: ed.serialNo || '' },
      { label: 'Description:', value: ed.description || '' },
      { label: 'Manufacturer Year:', value: ed.manufacturerYear || '' },
    ];

    for (const field of equipFields) {
      y = this.drawKeyValuePair(doc, field.label, field.value, margin, y, width);
    }

    // Inspection Details
    y = this.drawSectionHeader(doc, 'INSPECTION DETAILS', width, margin, y);
    
    const inspFields = [
      { label: 'Model:', value: id.model || '' },
      { label: 'Quantity:', value: id.quantity || '' },
      { label: 'Power Supply:', value: id.powerSupply || '' },
      { label: 'Size:', value: id.size || '' },
      { label: 'SWL:', value: id.swl || '' },
      { label: 'Test Load:', value: id.testLoad || '' },
      { label: 'Next Inspection Date:', value: id.nextInspectionDate ? new Date(id.nextInspectionDate).toLocaleDateString() : '' },
      { label: 'Last Thorough Examination:', value: id.lastThoroughExamination ? new Date(id.lastThoroughExamination).toLocaleDateString() : '' },
      { label: 'Last Proof Load Test:', value: id.lastProofLoadTest ? new Date(id.lastProofLoadTest).toLocaleDateString() : '' },
      { label: 'Next Proof Load Test Date:', value: id.nextProofLoadTestDate ? new Date(id.nextProofLoadTestDate).toLocaleDateString() : '' },
    ];

    for (const field of inspFields) {
      y = this.drawKeyValuePair(doc, field.label, field.value, margin, y, width);
    }

    // Inspection Checklist
    y = this.drawSectionHeader(doc, 'INSPECTION CHECKLIST', width, margin, y);
    
    for (const category of ic) {
      y = this.drawCategoryHeader(doc, category.category || '', margin, y, width);
      
      for (const item of category.items || []) {
        y = this.drawChecklistItem(doc, item.description || '', item.status || '', item.remark || '', margin + 10, y, width - margin - 10);
      }
    }

    // Inspection Findings
    y = this.drawSectionHeader(doc, 'INSPECTION FINDINGS', width, margin, y);
    
    if (iff.findings) {
      y = this.drawKeyValuePair(doc, 'Findings:', iff.findings, margin, y, width);
    }
    if (iff.criticalFindings) {
      y = this.drawKeyValuePair(doc, 'Critical Findings:', iff.criticalFindings, margin, y, width);
    }

    // Inspector Details
    y = this.drawSectionHeader(doc, 'INSPECTOR DETAILS', width, margin, y);
    
    y = this.drawKeyValuePair(doc, 'Inspected By:', data.inspectorName || ins.inspectedBy || '', margin, y, width);
    y = this.drawKeyValuePair(doc, 'Approved By:', ins.approvedBy || '', margin, y, width);
    
    // Signatures
    if (ins.inspectorSignature || data.inspectorSignatureUrl) {
      const sigY = y;
      try {
        doc.image(ins.inspectorSignature || data.inspectorSignatureUrl, margin, sigY, { width: 120, height: 50 });
        y += 55;
      } catch {
        y = this.drawKeyValuePair(doc, 'Inspector Signature:', '[Signature on file]', margin, y, width);
      }
    }
    
    if (ins.approverSignature || data.approverSignatureUrl) {
      const sigY = y;
      try {
        doc.image(ins.approverSignature || data.approverSignatureUrl, margin + 200, sigY - 55, { width: 120, height: 50 });
      } catch {}
    }

    return y + 10;
  }

  private static drawVerification(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    margin: number,
    y: number,
    includeQRCode: boolean
  ): number {
    const vs = template.verificationSection || {};
    
    y = this.drawSectionHeader(doc, 'VERIFICATION', width, margin, y);
    
    if (includeQRCode && data.qrCodeDataUrl) {
      const qrSize = 80;
      const qrX = width - margin - qrSize;
      try {
        doc.image(data.qrCodeDataUrl, qrX, y, { width: qrSize, height: qrSize });
      } catch {
        doc.rect(qrX, y, qrSize, qrSize).stroke('#cccccc');
        doc.font('Helvetica').fontSize(8).fillColor('#999999').text('QR CODE', qrX + 20, y + qrSize / 2 - 4);
      }
    }

    const verificationUrl = vs.verificationUrl || data.verificationUrl;
    if (verificationUrl) {
      y = this.drawKeyValuePair(doc, 'Verify at:', verificationUrl, margin, y, width);
    }
    y = this.drawKeyValuePair(doc, 'Certificate Hash:', data.verificationToken || vs.certificateHash || '', margin, y, width);

    return y + 10;
  }

  private static drawFooter(
    doc: PDFKit.PDFDocument,
    template: CertificateTemplateContent,
    data: Record<string, any>,
    width: number,
    height: number,
    margin: number
  ): void {
    const cf = template.certificateFooter || {};
    const y = height - 100;

    doc.moveTo(margin, y - 10).lineTo(width - margin, y - 10).stroke('#e0e0e0');

    if (cf.terms) {
      let ty = y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Terms & Conditions:', margin, ty);
      ty += 14;
      for (const term of cf.terms) {
        doc.font('Helvetica').fontSize(8).fillColor('#666666').text(`• ${term}`, margin + 10, ty, { width: width - margin - 20 });
        ty += 12;
      }
    }

    const footerCode = cf.footerCode || `CERT-${data.certificateNumber || '001'}`;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a2e').text(footerCode, margin, height - 30, { width: width - margin * 2, align: 'center' });
  }

  private static drawSectionHeader(
    doc: PDFKit.PDFDocument,
    text: string,
    width: number,
    margin: number,
    y: number
  ): number {
    doc.moveTo(margin, y).lineTo(width - margin, y).stroke('#e0e0e0');
    y += 8;
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a1a2e').text(text, margin, y);
    y += 20;
    doc.moveTo(margin, y).lineTo(width - margin, y).stroke('#e0e0e0');
    return y + 10;
  }

  private static drawCategoryHeader(
    doc: PDFKit.PDFDocument,
    text: string,
    margin: number,
    y: number,
    width: number
  ): number {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#334155').text(text, margin, y);
    return y + 16;
  }

  private static drawKeyValuePair(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    margin: number,
    y: number,
    width: number
  ): number {
    if (!value && value !== '0') return y;
    
    const labelWidth = 160;
    doc.font('Helvetica').fontSize(10).fillColor('#666666').text(label, margin, y, { width: labelWidth, continued: true });
    doc.font('Helvetica').fontSize(10).fillColor('#1a1a2e').text(` ${value}`, { width: width - margin - labelWidth });
    
    return y + 16;
  }

  private static drawChecklistItem(
    doc: PDFKit.PDFDocument,
    description: string,
    status: string,
    remark: string,
    x: number,
    y: number,
    width: number
  ): number {
    if (!description) return y;

    const statusColors: Record<string, string> = {
      PASS: '#059669',
      FAIL: '#dc2626',
      NA: '#6b7280',
      CF: '#dc2626',
      '': '#6b7280',
    };

    const statusColor = statusColors[status.toUpperCase()] || '#6b7280';
    
    doc.font('Helvetica').fontSize(9).fillColor('#1a1a2e').text(description, x, y, { width: width - 100 });
    
    // Status badge
    doc.font('Helvetica-Bold').fontSize(8).fillColor(statusColor).text(` [${status || 'NA'}]`, x + width - 90, y);
    
    if (remark) {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#6b7280').text(` - ${remark}`, x, y + 12, { width: width - 20 });
      return y + 24;
    }
    
    return y + 16;
  }

  private static drawDigitalSignature(
    doc: PDFKit.PDFDocument,
    data: Record<string, any>,
    width: number,
    height: number,
    margin: number
  ): void {
    const y = height - 60;
    doc.moveTo(margin, y - 5).lineTo(width - margin, y - 5).stroke('#e0e0e0');
    doc.font('Helvetica').fontSize(8).fillColor('#666666').text('Digital Signature:', margin, y);
    doc.font('Helvetica').fontSize(8).fillColor('#666666').text(data.digitalSignature, margin, y + 12, { width: 200 });
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
          include: { customer: true, company: true, location: true },
        },
        course: true,
        inspection: {
          include: { inspector: true },
        },
        approver: true,
        creator: true,
      },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    // Get template from database
    const certType = certificate.certificateType || 'TRAINING';
    const dbTemplate = await prisma.certificateTemplate.findFirst({
      where: { companyId: certificate.companyId, isDefault: true, type: certType },
    });

    let templateContent: CertificateTemplateContent;
    if (dbTemplate?.content) {
      templateContent = JSON.parse(dbTemplate.content as string);
    } else {
      // Fallback to basic template
      templateContent = {
        pageSize: 'A4',
        orientation: 'portrait',
        header: {
          companyName: certificate.job?.company?.name || certificate.holderCompany || undefined,
          address: undefined,
          contact: {},
        },
        certificateType: certificate.certificateType || 'TRAINING',
      };
    }

    let qrCodeDataUrl: string | undefined;
    if (includeQRCode) {
      const qrResult = await QRCodeService.generateQRCodeForCertificate(certificateId, baseUrl);
      qrCodeDataUrl = qrResult.dataUrl;
    }

    const companyName = certificate.job?.company?.name ?? certificate.job?.customer?.name ?? 'Company';
    const issuedBy = certificate.approver?.name 
      ?? certificate.creator?.name 
      ?? certificate.job?.company?.name 
      ?? 'Training Administrator';

    // Prepare data for template
    const templateData: Record<string, any> = {
      certificateNumber: certificate.number,
      jobNumber: certificate.jobNumber,
      holderName: certificate.holderName,
      holderCompany: certificate.holderCompany,
      courseTitle: certificate.course?.title,
      courseCategory: certificate.course?.category,
      courseLevel: certificate.course?.courseType,
      topicsCovered: certificate.course?.tags?.join(', '),
      trainingDate: certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : '',
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : '',
      idTypeUsed: certificate.idTypeUsed,
      idNumber: certificate.idTypeUsed === 'PASSPORT' ? certificate.passportNumber :
               certificate.idTypeUsed === 'VISA' ? certificate.visaNumber :
               certificate.idTypeUsed === 'LICENSE' ? certificate.licenseNumber :
               certificate.emiratesId,
      photoUrl: certificate.photoUrl,
      qrCodeDataUrl,
      digitalSignature: includeDigitalSignature ? await this.generateDigitalSignature(certificate) : undefined,
      issuedBy,
      companyName,
      verificationToken: certificate.verificationToken,
      // Inspection fields
      inspectionType: certificate.inspection?.inspectionType,
      inspectionDate: certificate.inspection?.date ? new Date(certificate.inspection.date).toLocaleDateString() : '',
      inspectionDateObj: certificate.inspection?.date,
      result: certificate.inspection?.result,
      locationName: certificate.job?.location?.name,
      locationCode: certificate.job?.location?.code,
      timesheetNumber: certificate.job?.jobNumber,
       inspectorName: certificate.inspection?.inspector?.name,
       verificationUrl: `${baseUrl}/verify/${certificate.number}`,
    };

    return this.generateCertificatePDF({
      templateContent,
      data: templateData,
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
}

export default PDFGenerationService;
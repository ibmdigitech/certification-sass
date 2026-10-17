import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';

export interface InspectionReportPDFData {
  reportNumber: string;
  title: string;
  jobNumber: string;
  customerName: string;
  customerContact?: string;
  customerEmail?: string;
  customerPhone?: string;
  inspectionDate: Date;
  inspectorName: string;
  inspectorRole: string;
  location?: string;
  equipment?: string;
  findings: Array<{
    id: string;
    category: string;
    description: string;
    severity: 'critical' | 'major' | 'minor' | 'observation';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    recommendation?: string;
    evidence?: string[];
  }>;
  recommendations: Array<{
    id: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    assignedTo?: string;
    dueDate?: Date;
  }>;
  signatures: Array<{
    role: string;
    name: string;
    date: Date;
    signatureData?: string;
  }>;
  companyName: string;
  companyLogo?: string;
  generatedAt: Date;
}

export class InspectionReportPDFGenerator {
  static async generateReportPDF(reportId: number, companyId: number): Promise<Buffer> {
    const report = await prisma.inspectionReport.findFirst({
      where: { id: reportId, companyId },
      include: {
        job: { include: { customer: true } },
        inspection: true,
        generator: true,
        reviewer: true,
        approver: true,
        signer: true,
        signatures: { include: { user: true }, orderBy: { signedAt: 'asc' } },
        template: true,
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const pdfData = this.buildPDFData(report);
    return this.createPDF(pdfData);
  }

  private static buildPDFData(report: any): InspectionReportPDFData {
    const findings = (report.findings as any[]) || [];
    const recommendations = (report.recommendations as any[]) || [];

    const signatures = report.signatures?.map((sig: any) => ({
      role: sig.role,
      name: sig.user?.name || 'Unknown',
      date: sig.signedAt,
      signatureData: sig.signatureData,
    })) || [];

    if (report.generator) {
      signatures.unshift({
        role: 'inspector',
        name: report.generator.name,
        date: report.createdAt,
      });
    }
    if (report.reviewer) {
      signatures.push({
        role: 'reviewer',
        name: report.reviewer.name,
        date: report.updatedAt,
      });
    }
    if (report.approver) {
      signatures.push({
        role: 'approver',
        name: report.approver.name,
        date: report.updatedAt,
      });
    }
    if (report.signer) {
      signatures.push({
        role: 'signer',
        name: report.signer.name,
        date: report.signedAt || report.updatedAt,
      });
    }

    return {
      reportNumber: report.reportNumber,
      title: report.title,
      jobNumber: report.job?.jobNumber || 'N/A',
      customerName: report.job?.customer?.name || 'N/A',
      customerContact: report.job?.customer?.contact,
      customerEmail: report.job?.customer?.email,
      customerPhone: report.job?.customer?.phone,
      inspectionDate: report.inspection?.createdAt || report.createdAt,
      inspectorName: report.generator?.name || 'N/A',
      inspectorRole: 'Inspector',
      location: (report.content as any)?.location,
      equipment: (report.content as any)?.equipment,
      findings,
      recommendations,
      signatures,
      companyName: report.company?.name || 'Company',
      companyLogo: report.company?.logo,
      generatedAt: new Date(),
    };
  }

  private static createPDF(data: InspectionReportPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, data);
      this.drawReportInfo(doc, data);
      this.drawFindings(doc, data);
      this.drawRecommendations(doc, data);
      this.drawSignatures(doc, data);
      this.drawFooter(doc, data);

      doc.end();
    });
  }

  private static drawHeader(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    const pageWidth = doc.page.width - 100;

    if (data.companyLogo) {
      try {
        doc.image(data.companyLogo, 50, 50, { width: 120 });
      } catch (e) {
        // Logo failed to load, continue without it
      }
    }

    doc.fontSize(24).font('Helvetica-Bold').text('INSPECTION REPORT', 50, 50, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(data.companyName, 50, doc.y, { align: 'right' });

    doc.moveDown(1.5);
    doc.strokeColor('#333333').lineWidth(2).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1);
  }

  private static drawReportInfo(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    const leftCol = 50;
    const rightCol = doc.page.width / 2 + 20;
    const colWidth = doc.page.width / 2 - 70;

    doc.fontSize(14).font('Helvetica-Bold').text('Report Information', leftCol, doc.y);
    doc.moveDown(0.5);

    this.drawInfoRow(doc, leftCol, 'Report Number:', data.reportNumber, colWidth);
    this.drawInfoRow(doc, leftCol, 'Title:', data.title, colWidth);
    this.drawInfoRow(doc, leftCol, 'Job Number:', data.jobNumber, colWidth);
    this.drawInfoRow(doc, leftCol, 'Customer:', data.customerName, colWidth);
    if (data.customerContact) this.drawInfoRow(doc, leftCol, 'Contact:', data.customerContact, colWidth);
    if (data.customerEmail) this.drawInfoRow(doc, leftCol, 'Email:', data.customerEmail, colWidth);
    if (data.customerPhone) this.drawInfoRow(doc, leftCol, 'Phone:', data.customerPhone, colWidth);

    this.drawInfoRow(doc, rightCol, 'Inspection Date:', new Date(data.inspectionDate).toLocaleDateString(), colWidth);
    this.drawInfoRow(doc, rightCol, 'Inspector:', data.inspectorName, colWidth);
    this.drawInfoRow(doc, rightCol, 'Role:', data.inspectorRole, colWidth);
    if (data.location) this.drawInfoRow(doc, rightCol, 'Location:', data.location, colWidth);
    if (data.equipment) this.drawInfoRow(doc, rightCol, 'Equipment:', data.equipment, colWidth);
    this.drawInfoRow(doc, rightCol, 'Generated:', new Date(data.generatedAt).toLocaleDateString(), colWidth);

    doc.moveDown(1);
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1);
  }

  private static drawInfoRow(doc: PDFKit.PDFDocument, x: number, label: string, value: string, width: number) {
    doc.fontSize(10).font('Helvetica-Bold').text(label, x, doc.y, { width: 120, continued: true });
    doc.font('Helvetica').text(value, { width: width - 120 });
  }

  private static drawFindings(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    doc.fontSize(14).font('Helvetica-Bold').text('Findings', 50, doc.y);
    doc.moveDown(0.5);

    if (data.findings.length === 0) {
      doc.fontSize(10).font('Helvetica-Oblique').text('No findings recorded.', 50, doc.y);
      doc.moveDown(1);
      return;
    }

    const severityColors: Record<string, string> = {
      critical: '#dc2626',
      major: '#ea580c',
      minor: '#ca8a04',
      observation: '#2563eb',
    };

    const statusColors: Record<string, string> = {
      open: '#dc2626',
      in_progress: '#ea580c',
      resolved: '#16a34a',
      closed: '#6b7280',
    };

    data.findings.forEach((finding, index) => {
      this.checkPageBreak(doc, 120);

      doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${finding.category}`, 50, doc.y);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica').text(finding.description, 70, doc.y, { width: doc.page.width - 140 });
      doc.moveDown(0.5);

      const severityColor = severityColors[finding.severity] || '#000000';
      const statusColor = statusColors[finding.status] || '#000000';

      doc.fontSize(9).font('Helvetica-Bold')
        .fillColor(severityColor).text(`Severity: ${finding.severity.toUpperCase()}`, 70, doc.y, { continued: true })
        .fillColor(statusColor).text(`  Status: ${finding.status.replace('_', ' ').toUpperCase()}`, { continued: false })
        .fillColor('#000000');
      doc.moveDown(0.3);

      if (finding.recommendation) {
        doc.fontSize(9).font('Helvetica-Bold').text('Recommendation:', 70, doc.y, { continued: true });
        doc.font('Helvetica').text(finding.recommendation, { width: doc.page.width - 180 });
        doc.moveDown(0.3);
      }

      if (finding.evidence && finding.evidence.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Evidence:', 70, doc.y);
        doc.moveDown(0.2);
        finding.evidence.forEach((evidence: string) => {
          doc.fontSize(8).font('Helvetica').text(`â€¢ ${evidence}`, 90, doc.y, { width: doc.page.width - 160 });
        });
        doc.moveDown(0.3);
      }

      doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.8);
    });
  }

  private static drawRecommendations(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    this.checkPageBreak(doc, 80);

    doc.fontSize(14).font('Helvetica-Bold').text('Recommendations', 50, doc.y);
    doc.moveDown(0.5);

    if (data.recommendations.length === 0) {
      doc.fontSize(10).font('Helvetica-Oblique').text('No recommendations recorded.', 50, doc.y);
      doc.moveDown(1);
      return;
    }

    const priorityColors: Record<string, string> = {
      high: '#dc2626',
      medium: '#ea580c',
      low: '#2563eb',
    };

    data.recommendations.forEach((rec, index) => {
      this.checkPageBreak(doc, 60);

      const priorityColor = priorityColors[rec.priority] || '#000000';

      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor(priorityColor).text(`${index + 1}. [${rec.priority.toUpperCase()}] `, 50, doc.y, { continued: true })
        .fillColor('#000000').font('Helvetica').text(rec.description, { width: doc.page.width - 120 });
      doc.moveDown(0.3);

      if (rec.assignedTo) {
        doc.fontSize(9).font('Helvetica-Bold').text('Assigned To:', 70, doc.y, { continued: true });
        doc.font('Helvetica').text(rec.assignedTo, { width: doc.page.width - 190 });
      }
      if (rec.dueDate) {
        doc.fontSize(9).font('Helvetica-Bold').text('Due Date:', 70, doc.y, { continued: true });
        doc.font('Helvetica').text(new Date(rec.dueDate).toLocaleDateString(), { width: doc.page.width - 190 });
      }
      doc.moveDown(0.5);
    });
  }

  private static drawSignatures(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    this.checkPageBreak(doc, 150);

    doc.fontSize(14).font('Helvetica-Bold').text('Signatures & Approvals', 50, doc.y);
    doc.moveDown(1);

    const sigRoles = ['inspector', 'reviewer', 'approver', 'signer'];
    const sigLabels: Record<string, string> = {
      inspector: 'Inspector',
      reviewer: 'Reviewer',
      approver: 'Approver',
      signer: 'Authorized Signatory',
    };

    sigRoles.forEach((role) => {
      const sig = data.signatures.find(s => s.role === role);
      if (!sig) return;

      this.checkPageBreak(doc, 60);

      doc.fontSize(10).font('Helvetica-Bold').text(`${sigLabels[role]}:`, 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica').text(sig.name, 70, doc.y);
      doc.fontSize(9).font('Helvetica').text(`Date: ${new Date(sig.date).toLocaleDateString()}`, 70, doc.y);
      doc.moveDown(0.5);

      if (sig.signatureData) {
        try {
          const signatureBuffer = Buffer.from(sig.signatureData, 'base64');
          doc.image(signatureBuffer, 70, doc.y, { width: 150, height: 50 });
          doc.moveDown(3);
        } catch (e) {
          doc.moveDown(2);
        }
      } else {
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(70, doc.y + 20).lineTo(250, doc.y + 20).stroke();
        doc.moveDown(2);
      }
    });
  }

  private static drawFooter(doc: PDFKit.PDFDocument, data: InspectionReportPDFData) {
    const footerY = doc.page.height - 80;
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke();
    doc.moveDown(0.5);

    doc.fontSize(8).font('Helvetica')
      .fillColor('#666666')
      .text(`${data.companyName} | Report: ${data.reportNumber} | Generated: ${new Date(data.generatedAt).toISOString()} | Page ${doc.bufferedPageRange().start + 1} of ${doc.bufferedPageRange().count}`, 50, footerY + 10, { align: 'center' })
      .fillColor('#000000');
  }

  private static checkPageBreak(doc: PDFKit.PDFDocument, neededSpace: number) {
    if (doc.y + neededSpace > doc.page.height - 100) {
      doc.addPage();
    }
  }

  static async savePDFToStorage(reportId: number, companyId: number, pdfBuffer: Buffer): Promise<string> {
    const fileName = `inspection-report-${reportId}-${Date.now()}.pdf`;
    const storagePath = `reports/${companyId}/${fileName}`;

    await prisma.inspectionReport.update({
      where: { id: reportId },
      data: {
        pdfUrl: storagePath,
        pdfGeneratedAt: new Date(),
      },
    });

    return storagePath;
  }
}



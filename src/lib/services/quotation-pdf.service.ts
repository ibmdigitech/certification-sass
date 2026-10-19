import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';

export interface QuotationItemPDF {
  serviceType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationPDFData {
  quotationNumber: string;
  revisionNumber: number;
  title: string;
  status: string;
  validUntil: Date | null;
  terms: string | null;
  items: QuotationItemPDF[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  customer: {
    name: string | null;
    contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  salesPerson: {
    name: string;
  } | null;
  companyName: string;
  companyLogo: string | null;
  createdAt: Date;
}

export class QuotationPDFService {
  static async generateQuotationPDF(
    quotationId: number,
    companyId: number,
    outputFormat: 'buffer' | 'stream' = 'buffer'
  ): Promise<Buffer | Readable> {
    const quotation = await prisma.salesQuotation.findFirst({
      where: { id: quotationId, companyId },
      include: {
        customer: {
          select: {
            name: true,
            contact: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        salesPerson: { select: { name: true } },
        company: { select: { name: true, logo: true } },
        items: true,
      },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const pdfData: QuotationPDFData = {
      quotationNumber: quotation.quotationNumber,
      revisionNumber: quotation.revisionNumber,
      title: quotation.title,
      status: quotation.status || 'DRAFT',
      validUntil: quotation.validUntil,
      terms: quotation.terms,
      items: quotation.items.map(item => ({
        serviceType: item.serviceType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate),
      taxAmount: Number(quotation.taxAmount),
      totalAmount: Number(quotation.totalAmount),
      customer: quotation.customer,
      salesPerson: quotation.salesPerson,
      companyName: quotation.company?.name || 'Company',
      companyLogo: quotation.company?.logo || null,
      createdAt: quotation.createdAt,
    };

    return this.renderPDF(pdfData, outputFormat);
  }

  private static renderPDF(
    data: QuotationPDFData,
    outputFormat: 'buffer' | 'stream'
  ): Promise<Buffer | Readable> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Quotation ${data.quotationNumber}`,
          Author: data.companyName,
          Subject: data.title,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (outputFormat === 'buffer') {
          resolve(buffer);
        } else {
          const stream = new Readable();
          stream.push(buffer);
          stream.push(null);
          resolve(stream);
        }
      });
      doc.on('error', reject);

      const margin = 50;
      const pageWidth = 595.28;

      // Header
      let y = margin;

      // Company Logo
      if (data.companyLogo) {
        try {
          doc.image(data.companyLogo, margin, y, { width: 80, height: 40 });
          y += 45;
        } catch {
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#999999').text('LOGO', margin, y + 15);
          y += 50;
        }
      } else {
        y += 20;
      }

      // Company Name
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a1a2e').text(
        data.companyName,
        margin,
        y
      );
      y += 22;

      // Quotation Title
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333').text(
        'COMMERCIAL QUOTATION',
        margin,
        y
      );
      y += 20;

      // Quotation Info
      doc.font('Helvetica').fontSize(10).fillColor('#666666');
      doc.text(`Quotation #: ${data.quotationNumber}`, margin, y);
      y += 14;
      doc.text(`Revision: ${data.revisionNumber}`, margin, y);
      y += 14;
      doc.text(`Date Issued: ${data.createdAt.toLocaleDateString()}`, margin, y);
      if (data.validUntil) {
        y += 14;
        doc.text(`Valid Until: ${data.validUntil.toLocaleDateString()}`, margin, y);
      }
      y += 20;

      // Customer Info
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text('BILL TO:', margin, y);
      y += 16;
      doc.font('Helvetica').fontSize(10).fillColor('#666666');
      doc.text(data.customer?.name || 'Customer', margin, y);
      y += 14;
      if (data.customer?.contact) {
        doc.text(data.customer.contact, margin, y);
        y += 14;
      }
      if (data.customer?.address) {
        doc.text(data.customer.address, margin, y);
        y += 14;
      }
      if (data.customer?.email) {
        doc.text(data.customer.email, margin, y);
        y += 14;
      }
      if (data.customer?.phone) {
        doc.text(data.customer.phone, margin, y);
        y += 14;
      }
      y += 10;

      // Sales Person
      if (data.salesPerson?.name) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666666').text(
          `Prepared by: ${data.salesPerson.name}`,
          margin,
          y
        );
        y += 20;
      } else {
        y += 10;
      }

      // Title
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333').text(
        data.title,
        margin,
        y
      );
      y += 20;

      // Items Table
      const tableTop = y;
      const tableLeft = margin;
      const tableWidth = pageWidth - margin * 2;

      // Table Headers
      const colWidths = {
        serviceType: 80,
        description: tableWidth - 80 - 60 - 60 - 60,
        quantity: 60,
        unitPrice: 60,
        totalPrice: 60,
      };

      let x = tableLeft;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');

      // Header background
      doc.rect(tableLeft, tableTop, tableWidth, 18).fill('#f5f5f5');

      doc.text('Service', x, tableTop + 5);
      x += colWidths.serviceType;
      doc.text('Description', x, tableTop + 5);
      x += colWidths.description;
      doc.text('Qty', x, tableTop + 5);
      x += colWidths.quantity;
      doc.text('Unit', x, tableTop + 5);
      x += colWidths.unitPrice;
      doc.text('Total', x, tableTop + 5);

      // Table Rows
      y = tableTop + 22;
      doc.font('Helvetica').fontSize(9).fillColor('#333333');

      for (const item of data.items) {
        x = tableLeft;
        doc.text(item.serviceType, x, y);
        x += colWidths.serviceType;
        doc.text(item.description, x, y, { width: colWidths.description - 5 });
        x += colWidths.description;
        doc.text(String(item.quantity), x, y);
        x += colWidths.quantity;
        doc.text(Number(item.unitPrice).toLocaleString(), x, y);
        x += colWidths.unitPrice;
        doc.text(Number(item.totalPrice).toLocaleString(), x, y);
        y += 18;
      }

      // Summary Section
      const summaryTop = y + 10;

      const summaryX = tableLeft + tableWidth - 180;
      const summaryY = summaryTop;

      doc.font('Helvetica').fontSize(9).fillColor('#333333');

      doc.text('Subtotal:', summaryX, summaryY);
      doc.text('VAT (' + data.taxRate + '%):', summaryX, summaryY + 14);
      doc.font('Helvetica-Bold').text('TOTAL:', summaryX, summaryY + 30);

      doc.font('Helvetica').text(Number(data.subtotal).toLocaleString(), summaryX + 50, summaryY);
      doc.text(Number(data.taxAmount).toLocaleString(), summaryX + 50, summaryY + 14);
      doc.font('Helvetica-Bold').text(Number(data.totalAmount).toLocaleString(), summaryX + 50, summaryY + 30);

      y = summaryY + 44;

      // Status Badge
      const statusColor = data.status === 'APPROVED' ? '#059669' :
                          data.status === 'CONVERTED' ? '#2563eb' :
                          data.status === 'DRAFT' ? '#d97706' : '#6b7280';
      doc.rect(summaryX - 5, y + 2, 80, 16).fill(statusColor).opacity(0.9);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text(
        data.status,
        summaryX + 2,
        y + 5
      );
      doc.opacity(1);

      y += 30;

      // Terms & Conditions
      if (data.terms || data.terms === '') {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Terms & Conditions:', margin, y);
        y += 14;
        doc.font('Helvetica').fontSize(9).fillColor('#666666').text(data.terms, margin, y, {
          width: pageWidth - margin * 2,
        });
        y += 40;
      }

      // Footer
      const footerY = 792 - 60;
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke('#e0e0e0');
      doc.font('Helvetica').fontSize(8).fillColor('#999999').text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        footerY + 8
      );
      doc.text(
        data.status === 'APPROVED' ? 'This is an approved commercial quotation.' :
        'This quotation is subject to our terms and conditions.',
        pageWidth / 2,
        footerY + 8,
        { align: 'center' }
      );

      doc.end();
    });
  }

  static getPDFDownloadHeaders(quotationNumber: string) {
    return {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotationNumber}.pdf"`,
    };
  }
}

export default QuotationPDFService;

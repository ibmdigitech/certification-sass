import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

export interface InvoiceItemPDF {
  line: number;
  description: string;
  qty: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export interface InvoicePDFData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  currency: string;
  jobNumber: string | null;
  lpoNumber?: string | null;
  companyId: string | number | null;
  certificateNumbers: string[];
  timesheetNumber: string | null;
  equipmentSerial: string | null;
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
    billingAddress: string | null;
  } | null;
  items: InvoiceItemPDF[];
  totals: {
    subtotal: number;
    tax: number;
    grandTotal: number;
    paid: number;
    due: number;
  };
  payment: {
    method: string | null;
    status: string | null;
  } | null;
  workflow: {
    salesPerson: string | null;
    technicalManagerApproval: boolean | null;
    certificateTeamRelease: string | null;
  } | null;
  companyName: string;
  companyLogo?: string | null;
  certificationReference: {
    certId: string | null;
    certificateNumber: string | null;
    type: string | null;
  } | null;
}

export class InvoicePDFService {
  static async generateInvoicePDF(
    invoiceId: number,
    companyId: number,
    outputFormat: 'buffer' | 'stream' = 'buffer'
  ): Promise<Buffer | Readable> {
    const invoice = (await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        company: { select: { name: true, logo: true } },
        LPO: { select: { lpoNumber: true } },
        payment: {
          include: {
            job: {
              include: {
                customer: {
                  select: {
                    name: true,
                    contact: true,
                    email: true,
                    phone: true,
                    address: true,
                    companyId: true,
                  },
                },
                jobServices: true,
              },
            },
          },
        },
      } as any,
    })) as any;

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const company = await prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true, logo: true },
    });

    const paymentAmount = Number(invoice.payment?.amount || 0);
    const taxRate = 5.0;
    const taxAmount = (paymentAmount * taxRate) / 100;
    const grandTotal = paymentAmount + taxAmount;

    const certificateNumbers = await prisma.certificate.findMany({
      where: {
        companyId,
        jobId: invoice.payment?.jobId,
      },
      select: { number: true },
    });

    const timesheet = await (prisma as any).timesheet.findFirst({
      where: {
        companyId,
        jobId: invoice.payment?.jobId,
      },
      select: { id: true, description: true },
    });

    const inspection = await prisma.inspection.findFirst({
      where: {
        companyId,
        jobId: invoice.payment?.jobId,
      },
      select: { equipmentId: true, equipmentAsset: true },
    });

    let equipmentSerial: string | null = inspection?.equipmentAsset || null;

    if (!equipmentSerial && inspection?.equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: inspection.equipmentId, companyId },
        select: { serialNumber: true },
      });
      equipmentSerial = equipment?.serialNumber || null;
    }

    const pdfData: InvoicePDFData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt,
      dueDate: new Date(invoice.createdAt.getTime() + 30 * 86400000),
      currency: 'AED',
      jobNumber: invoice.payment?.job?.jobNumber || null,
      lpoNumber: (invoice as any).lpo?.lpoNumber || null,
      companyId: companyId,
      certificateNumbers: certificateNumbers.map(c => c.number),
      timesheetNumber: timesheet ? `TS-${timesheet.id}` : null,
      equipmentSerial,
      customer: invoice.payment?.job?.customer
        ? {
            name: invoice.payment.job.customer.name,
            email: invoice.payment.job.customer.email,
            phone: invoice.payment.job.customer.phone,
            billingAddress: invoice.payment.job.customer.address,
          }
        : null,
      items: [
        {
          line: 1,
          description: 'Professional Certification Service',
          qty: 1,
          unitPrice: paymentAmount,
          tax: taxRate,
          total: grandTotal,
        },
      ],
      totals: {
        subtotal: paymentAmount,
        tax: taxAmount,
        grandTotal,
        paid: 0,
        due: grandTotal,
      },
      payment: invoice.payment
        ? {
            method: invoice.payment.method,
            status: invoice.payment.status,
          }
        : null,
      workflow: {
        salesPerson: 'assigned',
        technicalManagerApproval: true,
        certificateTeamRelease: 'after_payment',
      },
      companyName: company?.name || 'Company',
      companyLogo: company?.logo,
      certificationReference: {
        certId: invoice.payment?.job?.jobNumber || null,
        certificateNumber: certificateNumbers[0]?.number || null,
        type: invoice.payment?.job?.type || null,
      },
    };

    return this.renderPDF(pdfData, outputFormat);
  }

  private static renderPDF(
    data: InvoicePDFData,
    outputFormat: 'buffer' | 'stream'
  ): Promise<Buffer | Readable> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${data.invoiceNumber}`,
          Author: data.companyName,
          Subject: `Commercial Invoice - ${data.invoiceNumber}`,
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
      let y = margin;

      // Header
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a2e').text(
        'TAX INVOICE',
        margin,
        y,
        { align: 'center' }
      );
      y += 35;

      // Company Info
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(
        data.companyName,
        margin,
        y
      );
      y += 14;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(`Invoice #: ${data.invoiceNumber}`, margin, y);
      y += 10;
      doc.text(`Date: ${data.date.toLocaleDateString()}`, margin, y);
      y += 10;
      doc.text(`Due Date: ${data.dueDate.toLocaleDateString()}`, margin, y);
      y += 10;
      doc.text(`Currency: ${data.currency}`, margin, y);
      y += 10;
      if (data.companyId) {
        doc.text(`Company ID: ${data.companyId}`, margin, y);
        y += 10;
      }
      if (data.jobNumber) {
        doc.text(`Job Number: ${data.jobNumber}`, margin, y);
        y += 10;
      }
      if (data.lpoNumber) {
        doc.font('Helvetica-Bold').fillColor('#059669').text(`Client LPO #: ${data.lpoNumber}`, margin, y);
        doc.font('Helvetica').fillColor('#666666');
        y += 10;
      }
      if (data.timesheetNumber) {
        doc.text(`Timesheet #: ${data.timesheetNumber}`, margin, y);
        y += 10;
      }
      if (data.equipmentSerial) {
        doc.text(`Equipment Serial: ${data.equipmentSerial}`, margin, y);
        y += 10;
      }
      y += 10;

      // Certificate Numbers
      if (data.certificateNumbers.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Certificate Numbers:');
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        data.certificateNumbers.forEach((num, idx) => {
          doc.text(`${idx + 1}. ${num}`, margin, y);
          y += 10;
        });
        y += 5;
      }

      // Bill To Section
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text(
        'BILL TO:',
        pageWidth / 2,
        y
      );
      y += 12;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(data.customer?.name || 'Customer', pageWidth / 2, y);
      y += 10;
      if (data.customer?.billingAddress) {
        doc.text(data.customer.billingAddress, pageWidth / 2, y);
        y += 10;
      }
      if (data.customer?.phone) {
        doc.text(data.customer.phone, pageWidth / 2, y);
        y += 10;
      }
      if (data.customer?.email) {
        doc.text(data.customer.email, pageWidth / 2, y);
        y += 10;
      }
      y += 20;

      // Items Table Header
      const tableTop = y;
      const tableWidth = pageWidth - margin * 2;

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1a1a2e');
      doc.rect(margin, tableTop, tableWidth, 18).fill('#e8eaf6');
      doc.fillColor('#1a1a2e');
      doc.text('Line', margin + 3, tableTop + 5);
      doc.text('Description', margin + 20, tableTop + 5);
      doc.text('Qty', margin + tableWidth / 2 - 40, tableTop + 5);
      doc.text('Unit Price', margin + tableWidth / 2 + 5, tableTop + 5);
      doc.text('Tax %', margin + tableWidth - 110, tableTop + 5);
      doc.text('Total', margin + tableWidth - 55, tableTop + 5);

      y = tableTop + 22;
      doc.font('Helvetica').fontSize(8).fillColor('#333333');

      for (const item of data.items) {
        doc.text(String(item.line), margin + 3, y);
        doc.text(item.description, margin + 20, y);
        doc.text(String(item.qty), margin + tableWidth / 2 - 40, y);
        doc.text(`${Number(item.unitPrice).toLocaleString()} ${data.currency}`, margin + tableWidth / 2 + 5, y);
        doc.text(String(item.tax), margin + tableWidth - 110, y);
        doc.text(`${Number(item.total).toLocaleString()} ${data.currency}`, margin + tableWidth - 55, y);
        y += 16;
      }

      y += 10;

      // Totals Section
      const totalsX = margin + tableWidth - 120;
      doc.font('Helvetica').fontSize(9).fillColor('#333333');
      doc.text('Subtotal:', totalsX, y);
      doc.text(`${Number(data.totals.subtotal).toLocaleString()} ${data.currency}`, totalsX + 55, y, { align: 'right' });
      y += 12;
      doc.text('Tax (5%):', totalsX, y);
      doc.text(`${Number(data.totals.tax).toLocaleString()} ${data.currency}`, totalsX + 55, y, { align: 'right' });
      y += 12;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e').text('GRAND TOTAL:', totalsX, y);
      doc.text(`${Number(data.totals.grandTotal).toLocaleString()} ${data.currency}`, totalsX + 55, y, { align: 'right' });
      y += 14;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(`Paid: ${Number(data.totals.paid).toLocaleString()} ${data.currency}`, margin, y);
      y += 10;
      doc.text(`Amount Due: ${Number(data.totals.due).toLocaleString()} ${data.currency}`, margin, y);
      y += 16;

      // Payment Info
      if (data.payment) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Payment Information:');
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        y += 12;
        doc.text(`Method: ${data.payment.method || 'N/A'}`, margin, y);
        y += 10;
        doc.text(`Status: ${data.payment.status || 'N/A'}`, margin, y);
        y += 16;
      }

      // Workflow
      if (data.workflow) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#333333').text('Workflow:');
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        y += 12;
        doc.text(`Sales Person: ${data.workflow.salesPerson || 'assigned'}`, margin, y);
        y += 8;
        doc.text(`Technical Manager Approval: ${data.workflow.technicalManagerApproval ? 'required' : 'not required'}`, margin, y);
        y += 8;
        doc.text(`Certificate Team Release: ${data.workflow.certificateTeamRelease || 'after_payment'}`, margin, y);
        y += 16;
      }

      // Amount Due Banner
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#059669').text(
        `AMOUNT DUE: ${Number(data.totals.due).toLocaleString()} ${data.currency}`,
        margin,
        y,
        { align: 'center' }
      );
      y += 30;

      // Footer
      const footerY = 792 - 80;
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke('#e0e0e0');
      doc.font('Helvetica').fontSize(8).fillColor('#999999').text(
        `Invoice generated on ${new Date().toLocaleString()} | Company: ${data.companyName} (ID: ${data.companyId})`,
        margin,
        footerY + 8
      );

      doc.end();
    });
  }

  static getPDFDownloadHeaders(invoiceId: string) {
    return {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoiceId}.pdf"`,
    };
  }
}

export default InvoicePDFService;

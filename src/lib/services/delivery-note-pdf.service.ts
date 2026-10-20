import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

export interface DeliveryNoteItemPDF {
  line: number;
  item: string;
  status: string;
}

export interface DeliveryNotePDFData {
  dnId: string;
  date: Date;
  customer: {
    name: string | null;
  } | null;
  certificationReference: {
    certId: string | null;
    certificateNumber: string | null;
  } | null;
  deliveryItems: DeliveryNoteItemPDF[];
  deliveryMethod: string | null;
  jobNumber: string | null;
  workflow: {
    accountsTeamInvoiceGenerated: boolean | null;
    deliveryTeamAssigned: boolean | null;
    customerConfirmation: string | null;
  } | null;
  notes: string | null;
  companyName: string;
  companyLogo?: string | null;
}

export class DeliveryNotePDFService {
  static async generateDeliveryNotePDF(
    noteId: number,
    companyId: number,
    outputFormat: 'buffer' | 'stream' = 'buffer'
  ): Promise<Buffer | Readable> {
    const note = await (prisma as any).deliveryNote.findFirst({
      where: { id: noteId, companyId },
      include: {
        company: { select: { name: true, logo: true } },
        deliveryLog: {
          include: {
            certificate: {
              select: {
                number: true,
                jobNumber: true,
                certificateType: true,
                issueDate: true,
                customer: {
                  select: { name: true },
                },
              },
            },
            dispatchItems: {
              include: {
                certificate: {
                  select: {
                    number: true,
                    holderName: true,
                    certificateType: true,
                  },
                },
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      throw new Error('Delivery note not found');
    }

    const items: DeliveryNoteItemPDF[] = [];
    if (note.deliveryLog?.dispatchItems && note.deliveryLog.dispatchItems.length > 0) {
      note.deliveryLog.dispatchItems.forEach((dItem: any, idx: number) => {
        items.push({
          line: idx + 1,
          item: `Certificate: ${dItem.certificate?.number || dItem.referenceNumber || 'N/A'} - ${dItem.certificate?.holderName || 'Verified Equipment'}`,
          status: 'DISPATCHED',
        });
      });
    } else {
      items.push(...this.getDefaultItems(note, note.deliveryLog));
    }

    const pdfData: DeliveryNotePDFData = {
      dnId: note.noteNumber,
      date: note.createdAt,
      customer: note.deliveryLog?.certificate?.customer || { name: note.deliveryLog?.recipientName || 'Customer Client' },
      certificationReference: {
        certId: note.deliveryLog?.id?.toString() || null,
        certificateNumber: note.deliveryLog?.certificate?.number || `${items.length} Bundled Items`,
      },
      deliveryItems: items,
      deliveryMethod: note.deliveryLog?.method || 'Hand Delivery',
      jobNumber: note.deliveryLog?.certificate?.jobNumber || null,
      workflow: {
        accountsTeamInvoiceGenerated: true,
        deliveryTeamAssigned: true,
        customerConfirmation: note.deliveryLog?.recipientName ? `Received by ${note.deliveryLog.recipientName}` : 'pending',
      },
      notes: note.notes || note.description || note.deliveryLog?.notes || null,
      companyName: note.company?.name || 'Inspection & Certification Body',
      companyLogo: note.company?.logo,
    };

    return this.renderPDF(pdfData, outputFormat);
  }

  private static getDefaultItems(
    note: { title: string | null; description: string | null },
    deliveryLog: { certificate: { certificateType: string | null } | null } | null
  ): DeliveryNoteItemPDF[] {
    const items: DeliveryNoteItemPDF[] = [];

    if (deliveryLog?.certificate?.certificateType === 'TRAINING') {
      items.push({
        line: 1,
        item: 'Digital Certificate (PDF)',
        status: 'sent_email',
      });
      items.push({
        line: 2,
        item: 'Printed Certificate',
        status: 'ready_for_dispatch',
      });
    } else if (deliveryLog?.certificate?.certificateType === 'INSPECTION') {
      items.push({
        line: 1,
        item: 'Digital Certificate (PDF)',
        status: 'sent_email',
      });
      items.push({
        line: 2,
        item: 'Printed Certificate',
        status: 'ready_for_dispatch',
      });
    } else {
      items.push({
        line: 1,
        item: note.title || 'Certificate Delivery',
        status: 'pending',
      });
    }

    return items;
  }

  private static renderPDF(
    data: DeliveryNotePDFData,
    outputFormat: 'buffer' | 'stream'
  ): Promise<Buffer | Readable> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Delivery Note ${data.dnId}`,
          Author: data.companyName,
          Subject: `Delivery Note - ${data.dnId}`,
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
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#059669').text(
        'DELIVERY NOTE',
        margin,
        y,
        { align: 'center' }
      );
      y += 35;

      // Company Info
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a2e').text(
        data.companyName,
        margin,
        y
      );
      y += 14;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(`DN #: ${data.dnId}`, margin, y);
      y += 10;
      doc.text(`Date: ${data.date.toLocaleDateString()}`, margin, y);
      y += 10;
      if (data.deliveryMethod) {
        doc.text(`Delivery Method: ${data.deliveryMethod}`, margin, y);
        y += 10;
      }
      if (data.jobNumber) {
        doc.text(`Job Number: ${data.jobNumber}`, margin, y);
        y += 10;
      }
      y += 16;

      // Certification Reference
      if (data.certificationReference) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Certification Reference:');
        doc.font('Helvetica').fontSize(9).fillColor('#666666');
        if (data.certificationReference.certId) {
          doc.text(`Cert ID: ${data.certificationReference.certId}`, margin, y);
          y += 12;
        }
        if (data.certificationReference.certificateNumber) {
          doc.text(`Certificate Number: ${data.certificationReference.certificateNumber}`, margin, y);
          y += 12;
        }
        y += 10;
      }

      // Customer Info
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text(
        'DELIVER TO:',
        pageWidth / 2,
        y
      );
      y += 12;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(data.customer?.name || 'Customer', pageWidth / 2, y);
      y += 20;

      // Delivery Items Table
      const tableTop = y;
      const tableWidth = pageWidth - margin * 2;

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#059669');
      doc.rect(margin, tableTop, tableWidth, 18).fill('#e8f5e9');
      doc.fillColor('#059669');
      doc.text('Line', margin + 5, tableTop + 5);
      doc.text('Item', margin + 25, tableTop + 5);
      doc.text('Status', margin + tableWidth - 60, tableTop + 5);

      y = tableTop + 22;
      doc.font('Helvetica').fontSize(8).fillColor('#333333');

      for (const item of data.deliveryItems) {
        doc.text(String(item.line), margin + 5, y);
        doc.text(item.item, margin + 25, y);
        doc.text(item.status, margin + tableWidth - 60, y);
        y += 16;
      }

      y += 10;

      // Workflow Status
      if (data.workflow) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Workflow Status:');
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        y += 12;
        doc.text(`Accounts Team Invoice Generated: ${data.workflow.accountsTeamInvoiceGenerated ? 'Yes' : 'No'}`, margin, y);
        y += 10;
        doc.text(`Delivery Team Assigned: ${data.workflow.deliveryTeamAssigned ? 'Yes' : 'No'}`, margin, y);
        y += 10;
        doc.text(`Customer Confirmation: ${data.workflow.customerConfirmation || 'pending'}`, margin, y);
        y += 16;
      }

      // Notes
      if (data.notes) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('Notes:');
        doc.font('Helvetica').fontSize(9).fillColor('#333333').text(data.notes, margin, y, {
          align: 'left',
        });
        y += 30;
      } else {
        y += 5;
      }

      // Footer
      const footerY = 792 - 80;
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke('#e0e0e0');
      doc.font('Helvetica').fontSize(8).fillColor('#999999').text(
        `Delivery Note generated on ${new Date().toLocaleString()} | Company: ${data.companyName}`,
        margin,
        footerY + 8
      );

      doc.end();
    });
  }

  static getPDFDownloadHeaders(dnId: string) {
    return {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${dnId}.pdf"`,
    };
  }
}

export default DeliveryNotePDFService;

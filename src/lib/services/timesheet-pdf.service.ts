import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { TimesheetService } from './timesheet.service';
import { Readable } from 'stream';

export interface TimesheetPDFData {
  jobNumber: string;
  customerName: string;
  site?: string;
  entries: Array<{
    date: Date;
    employeeName: string;
    startTime: Date;
    endTime: Date;
    breakMinutes: number;
    totalHours: number;
    overtime: number;
    description?: string;
    status: string;
    approverName?: string;
  }>;
  totalHours: number;
  totalOvertime: number;
  generatedAt: Date;
  companyName: string;
}

export class TimesheetPDFService {
  /**
   * Generates a timesheet PDF for a specific job.
   * Output filename: {jobNumber}_TIMESHEET.pdf
   */
  static async generateTimesheetPDF(
    jobId: number,
    companyId: number,
    outputFormat: 'buffer' | 'stream' = 'buffer'
  ): Promise<Buffer | Readable> {
    // Fetch the job and its timesheets
    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: {
        customer: { select: { contact: true, email: true } },
      },
    });

    if (!job) throw new Error('Job not found');

    const timesheets = await TimesheetService.getTimesheetsForJob(jobId, companyId);

    const entries = timesheets.map(ts => {
      const calc = TimesheetService.calculateHours(ts.startTime, ts.endTime, ts.breakMinutes);
      return {
        date: ts.date,
        employeeName: ts.user?.name || 'Unknown',
        startTime: ts.startTime,
        endTime: ts.endTime,
        breakMinutes: ts.breakMinutes,
        totalHours: calc.hours,
        overtime: calc.overtime,
        description: ts.description || undefined,
        status: ts.status,
        approverName: ts.approver?.name || undefined,
      };
    });

    const totalHours = entries.reduce((sum, e) => sum + e.totalHours, 0);
    const totalOvertime = entries.reduce((sum, e) => sum + e.overtime, 0);

    const company = await prisma.company.findFirst({ where: { id: companyId }, select: { name: true } });

    const pdfData: TimesheetPDFData = {
      jobNumber: job.jobNumber,
      customerName: job.customer?.contact || 'Customer',
      site: job.site || undefined,
      entries,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
      generatedAt: new Date(),
      companyName: company?.name || 'Company',
    };

    return this.renderPDF(pdfData, outputFormat);
  }

  private static renderPDF(
    data: TimesheetPDFData,
    outputFormat: 'buffer' | 'stream'
  ): Promise<Buffer | Readable> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Timesheet - ${data.jobNumber}`,
          Author: data.companyName,
          Subject: `Timesheet for Job ${data.jobNumber}`,
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

      // Header
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a1a2e')
        .text('TIMESHEET', { align: 'center' });
      doc.moveDown(0.5);

      // Job info
      doc.font('Helvetica').fontSize(11).fillColor('#333333');
      doc.text(`Job Number: ${data.jobNumber}`);
      doc.text(`Customer: ${data.customerName}`);
      if (data.site) doc.text(`Site: ${data.site}`);
      doc.text(`Company: ${data.companyName}`);
      doc.text(`Generated: ${data.generatedAt.toLocaleDateString()}`);
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const colX = {
        date: 50,
        employee: 130,
        start: 250,
        end: 310,
        break: 370,
        hours: 420,
        ot: 470,
        status: 510,
      };

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      doc.rect(45, tableTop - 5, 505, 20).fill('#1a1a2e');
      doc.fillColor('#ffffff');
      doc.text('Date', colX.date, tableTop, { width: 75 });
      doc.text('Employee', colX.employee, tableTop, { width: 115 });
      doc.text('Start', colX.start, tableTop, { width: 55 });
      doc.text('End', colX.end, tableTop, { width: 55 });
      doc.text('Break', colX.break, tableTop, { width: 45 });
      doc.text('Hours', colX.hours, tableTop, { width: 45 });
      doc.text('OT', colX.ot, tableTop, { width: 35 });
      doc.text('Status', colX.status, tableTop, { width: 50 });

      // Table rows
      let y = tableTop + 20;
      doc.font('Helvetica').fontSize(8).fillColor('#333333');

      for (let i = 0; i < data.entries.length; i++) {
        const entry = data.entries[i];

        // Alternate row background
        if (i % 2 === 0) {
          doc.rect(45, y - 3, 505, 16).fill('#f8f9fa');
          doc.fillColor('#333333');
        }

        doc.text(entry.date.toLocaleDateString(), colX.date, y, { width: 75 });
        doc.text(entry.employeeName, colX.employee, y, { width: 115 });
        doc.text(entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), colX.start, y, { width: 55 });
        doc.text(entry.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), colX.end, y, { width: 55 });
        doc.text(`${entry.breakMinutes}m`, colX.break, y, { width: 45 });
        doc.text(entry.totalHours.toFixed(1), colX.hours, y, { width: 45 });
        doc.text(entry.overtime.toFixed(1), colX.ot, y, { width: 35 });
        doc.text(entry.status.toUpperCase(), colX.status, y, { width: 50 });

        y += 16;

        // Page break
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
      }

      // Totals
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
      doc.text(`Total Hours: ${data.totalHours}`, colX.hours - 80, y);
      doc.text(`Total Overtime: ${data.totalOvertime}`, colX.hours + 50, y);

      // Signature area
      y += 40;
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text('Employee Signature: ______________________', 50, y);
      doc.text('Approver Signature: ______________________', 300, y);
      y += 25;
      doc.text('Date: ______________________', 50, y);
      doc.text('Date: ______________________', 300, y);

      doc.end();
    });
  }

  /**
   * Returns the standard filename for a timesheet PDF.
   */
  static getTimesheetFilename(jobNumber: string): string {
    return `${jobNumber}_TIMESHEET.pdf`;
  }
}



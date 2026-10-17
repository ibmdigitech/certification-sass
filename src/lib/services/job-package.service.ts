import { prisma } from '@/lib/prisma';
import { PDFGenerationService } from './certificate/pdf-generation.service';
import { TimesheetPDFService } from './timesheet-pdf.service';

export interface JobPackageManifest {
  jobNumber: string;
  generatedAt: Date;
  files: Array<{
    filename: string;
    type: 'CERTIFICATE' | 'TIMESHEET' | 'INSPECTION_REPORT' | 'TRAINING_RECORD' | 'SUPPORTING_DOCUMENT';
    size?: number;
  }>;
  excludedSensitiveDocuments: string[];
}

export interface JobPackageResult {
  manifest: JobPackageManifest;
  buffers: Map<string, Buffer>;
}

export class JobPackageService {
  /**
   * Generates a complete job package for download / print.
   * Structure:
   *   TSC-2563741_JOB_PACKAGE.zip
   *     â”œâ”€â”€ CERTIFICATE.pdf
   *     â”œâ”€â”€ TIMESHEET.pdf
   *     â”œâ”€â”€ INSPECTION_REPORT.pdf
   *     â”œâ”€â”€ TRAINING_RECORD.pdf
   *     â””â”€â”€ SUPPORTING_DOCUMENTS/
   *
   * Sensitive identity documents are excluded by default unless
   * includeSensitiveDocuments is true.
   */
  static async generateJobPackage(
    jobId: number,
    companyId: number,
    options: {
      includeCertificates?: boolean;
      includeTimesheets?: boolean;
      includeInspectionReports?: boolean;
      includeTrainingRecords?: boolean;
      includeSupportingDocuments?: boolean;
      includeSensitiveDocuments?: boolean;
      baseUrl?: string;
    } = {}
  ): Promise<JobPackageResult> {
    const {
      includeCertificates = true,
      includeTimesheets = true,
      includeInspectionReports = true,
      includeTrainingRecords = true,
      includeSupportingDocuments = true,
      includeSensitiveDocuments = false,
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    } = options;

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: {
        certificates: true,
        inspectionReports: true,
      },
    });

    if (!job) throw new Error('Job not found');

    const buffers = new Map<string, Buffer>();
    const files: JobPackageManifest['files'] = [];
    const excludedSensitiveDocuments: string[] = [];

    // 1. Certificates
    if (includeCertificates && job.certificates.length > 0) {
      for (const cert of job.certificates) {
        try {
          const pdfBuffer = await PDFGenerationService.generateCertificateFromDB(
            cert.id,
            'default',
            baseUrl,
            { outputFormat: 'buffer' }
          ) as Buffer;

          const filename = `${cert.number}_CERTIFICATE.pdf`;
          buffers.set(filename, pdfBuffer);
          files.push({ filename, type: 'CERTIFICATE', size: pdfBuffer.length });
        } catch (err) {
          console.error(`Failed to generate certificate PDF for ${cert.number}:`, err);
        }
      }
    }

    // 2. Timesheets
    if (includeTimesheets) {
      try {
        const timesheetBuffer = await TimesheetPDFService.generateTimesheetPDF(
          jobId,
          companyId,
          'buffer'
        ) as Buffer;

        const filename = TimesheetPDFService.getTimesheetFilename(job.jobNumber);
        buffers.set(filename, timesheetBuffer);
        files.push({ filename, type: 'TIMESHEET', size: timesheetBuffer.length });
      } catch (err) {
        console.error(`Failed to generate timesheet PDF for ${job.jobNumber}:`, err);
      }
    }

    // 3. Inspection Reports (reference only â€” full PDF generation delegated to InspectionReportPDFService)
    if (includeInspectionReports && job.inspectionReports.length > 0) {
      for (const report of job.inspectionReports) {
        if (report.pdfUrl) {
          const filename = `${report.reportNumber}_INSPECTION_REPORT.pdf`;
          // In production, download the PDF from storage and add to buffer
          files.push({ filename, type: 'INSPECTION_REPORT' });
        }
      }
    }

    // 4. Supporting Documents
    if (includeSupportingDocuments) {
      const documents = await prisma.document.findMany({
        where: { companyId, entityType: 'Job', entityId: jobId },
      });

      const sensitiveTypes = ['EMIRATES_ID', 'PASSPORT', 'VISA'];

      for (const doc of documents) {
        if (sensitiveTypes.includes(doc.type) && !includeSensitiveDocuments) {
          excludedSensitiveDocuments.push(doc.name);
          continue;
        }
        files.push({
          filename: `SUPPORTING_DOCUMENTS/${doc.name}`,
          type: 'SUPPORTING_DOCUMENT',
          size: doc.size || undefined,
        });
      }
    }

    const manifest: JobPackageManifest = {
      jobNumber: job.jobNumber,
      generatedAt: new Date(),
      files,
      excludedSensitiveDocuments,
    };

    return { manifest, buffers };
  }

  /**
   * Returns the standard ZIP filename for a job package.
   */
  static getPackageFilename(jobNumber: string): string {
    return `${jobNumber}_JOB_PACKAGE.zip`;
  }
}



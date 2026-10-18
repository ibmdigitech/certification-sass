import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

export interface TrainingCertificateInput {
  jobNumber?: string;
  traineeName: string;
  traineeId?: string;
  employerName?: string;
  trainingTitle: string;
  topicsCovered: string[];
  trainingDate?: string;
  validUntil?: string;
  approvedBy?: string;
  certificateNumber: string;
  companyLogo: string;
  trainerSignature: string;
  companyStamp: string;
  footerDisclaimer?: string;
}

export interface TrainingCertificateLayout {
  companyName: string;
  companyLogo: string;
  showLogo: boolean;
  showCertificateNumber: boolean;
  certificateNumber: string;
  showTrainerSignature: boolean;
  trainerSignature: string;
  showCompanyStamp: boolean;
  companyStamp: string;
  showFooterDisclaimer: boolean;
  footerDisclaimer: string;
}

export interface TrainingCertificateJSON {
  certificate_type: 'Training';
  certificate_number: string;
  job_no: string;
  trainee_name: string;
  trainee_id: string;
  employer_name: string;
  training_title: string;
  topics_covered: string[];
  training_date: string;
  valid_until: string;
  approved_by: string;
  trainer_signature: string;
  company_stamp: string;
  footer_disclaimer: string;
  layout: TrainingCertificateLayout;
}

export class TrainingCertificateGenerator {
  static readonly COMPANY_NAME = 'IBMDIGITECH';
  static readonly TEMPLATE_NAME = 'IBMDIGITECH Training Certificate';
  static readonly TEMPLATE_DESCRIPTION = 'Standardized training certificate with company logo, certificate number, and footer disclaimer';
  static readonly DEFAULT_FOOTER_DISCLAIMER = 'This certificate is issued by IBMDIGITECH. All rights reserved.';

  static readonly DEFAULT_LAYOUT: TrainingCertificateLayout = {
    companyName: TrainingCertificateGenerator.COMPANY_NAME,
    companyLogo: '',
    showLogo: true,
    showCertificateNumber: true,
    certificateNumber: '',
    showTrainerSignature: true,
    trainerSignature: '',
    showCompanyStamp: true,
    companyStamp: '',
    showFooterDisclaimer: true,
    footerDisclaimer: TrainingCertificateGenerator.DEFAULT_FOOTER_DISCLAIMER,
  };

  static generateJSON(data: TrainingCertificateInput): TrainingCertificateJSON {
    return {
      certificate_type: 'Training',
      certificate_number: data.certificateNumber,
      job_no: data.jobNumber ?? '',
      trainee_name: data.traineeName,
      trainee_id: data.traineeId ?? '',
      employer_name: data.employerName ?? '',
      training_title: data.trainingTitle,
      topics_covered: data.topicsCovered ?? [],
      training_date: data.trainingDate ?? '',
      valid_until: data.validUntil ?? '',
      approved_by: data.approvedBy ?? '',
      trainer_signature: data.trainerSignature,
      company_stamp: data.companyStamp,
      footer_disclaimer: data.footerDisclaimer ?? TrainingCertificateGenerator.DEFAULT_FOOTER_DISCLAIMER,
      layout: {
        companyName: TrainingCertificateGenerator.COMPANY_NAME,
        companyLogo: data.companyLogo,
        showLogo: true,
        showCertificateNumber: true,
        certificateNumber: data.certificateNumber,
        showTrainerSignature: true,
        trainerSignature: data.trainerSignature,
        showCompanyStamp: true,
        companyStamp: data.companyStamp,
        showFooterDisclaimer: true,
        footerDisclaimer: data.footerDisclaimer ?? TrainingCertificateGenerator.DEFAULT_FOOTER_DISCLAIMER,
      },
    };
  }

  static generateHTML(data: TrainingCertificateInput): string {
    const json = TrainingCertificateGenerator.generateJSON(data);
    const topicsList = json.topics_covered.length
      ? json.topics_covered.map((t) => `<li>${t}</li>`).join('')
      : '<li></li>';

    let logoHtml = '';
    if (json.layout.showLogo && json.layout.companyLogo) {
      logoHtml = `<div class="certificate-logo">
  <img src="${json.layout.companyLogo}" alt="${json.layout.companyName} Logo" />
</div>`;
    }

    let certNumberHtml = '';
    if (json.layout.showCertificateNumber) {
      certNumberHtml = `<div class="certificate-number">
  <span class="field-label">Certificate No:</span>
  <span class="field-value">${json.certificate_number}</span>
</div>`;
    }

    let footerHtml = '';
    if (json.layout.showFooterDisclaimer) {
      footerHtml = `<div class="certificate-footer">
  <div class="section-divider"></div>
  <p class="footer-text">${json.footer_disclaimer}</p>
</div>`;
    }

    return `<div class="certificate-container">
${logoHtml}
  <div class="certificate-header">
    <div class="certificate-title-block">
      <div class="company-name">${json.layout.companyName}</div>
      <div class="certificate-type">TRAINING CERTIFICATE</div>
    </div>
${certNumberHtml}
  </div>

  <div class="certificate-body">
    <div class="field-group">
      <span class="field-label">Job No:</span>
      <span class="field-value">${json.job_no}</span>
    </div>

    <p class="certify-text">This is to certify that</p>

    <div class="field-group name-field">
      <span class="field-value">${json.trainee_name}</span>
    </div>

    <div class="field-group">
      <span class="field-label">ID No.</span>
      <span class="field-value">${json.trainee_id}</span>
    </div>

    <div class="field-group">
      <span class="field-label">Employee Of</span>
      <span class="field-value">${json.employer_name}</span>
    </div>

    <p class="training-title">Has successfully completed safety training for:</p>

    <div class="field-group training-title-field">
      <span class="field-value">${json.training_title}</span>
    </div>
  </div>

  <div class="topics-section">
    <div class="section-divider"></div>
    <div class="section-title">Topics Covered:</div>
    <div class="section-divider"></div>
    <ul class="topics-list">
      ${topicsList}
    </ul>
  </div>

  <div class="details-section">
    <div class="section-divider"></div>
    <div class="field-row">
      <span class="field-label">Training Date:</span>
      <span class="field-value">${json.training_date}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Valid Until:</span>
      <span class="field-value">${json.valid_until}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Approved By:</span>
      <span class="field-value">${json.approved_by}</span>
    </div>
    <div class="section-divider"></div>
  </div>

  <div class="signature-section">
    ${json.layout.showTrainerSignature && json.trainer_signature
      ? `<div class="signature-block">
  <img src="${json.trainer_signature}" alt="Trainer Signature" class="signature-img" />
  <p class="signature-label">Trainer Signature</p>
</div>` : ''
    }
    ${json.layout.showCompanyStamp && json.company_stamp
      ? `<div class="signature-block">
  <img src="${json.company_stamp}" alt="Company Stamp" class="stamp-img" />
  <p class="signature-label">Company Stamp</p>
</div>` : ''
    }
  </div>
${footerHtml}
</div>`;
  }

  static generateCertificateCSS(): string {
    return `
.certificate-container {
  font-family: 'Helvetica', 'Arial', sans-serif;
  max-width: 841.89px;
  margin: 0 auto;
  padding: 80px;
  background-color: #ffffff;
  position: relative;
}

.certificate-logo {
  text-align: center;
  margin-bottom: 20px;
}

.certificate-logo img {
  max-width: 150px;
  max-height: 80px;
}

.certificate-header {
  text-align: center;
  margin-bottom: 40px;
}

.certificate-number {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.company-name {
  font-family: 'Helvetica-Bold', 'Arial', sans-serif;
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #000000;
}

.certificate-type {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 24px;
  margin-top: 10px;
  color: #000000;
}

.certify-text {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 18px;
  text-align: center;
  margin: 30px 0;
  line-height: 1.6;
}

.field-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.name-field {
  text-align: center;
  margin: 20px 0;
}

.field-label {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
}

.field-value {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 16px;
  text-align: left;
  min-height: 24px;
}

.training-title {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 16px;
  text-align: center;
  margin: 30px 0 10px 0;
}

.training-title-field .field-value {
  font-family: 'Helvetica-Bold', 'Arial', sans-serif;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.topics-section {
  margin: 40px 0;
}

.topics-list {
  list-style-type: disc;
  padding-left: 40px;
  margin-top: 10px;
}

.topics-list li {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 14px;
  margin-bottom: 5px;
}

.details-section {
  margin-top: 40px;
}

.section-divider {
  border-top: 1px solid #000000;
  margin: 15px 0;
}

.section-title {
  font-family: 'Helvetica-Bold', 'Arial', sans-serif;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin: 10px 0;
}

.field-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.field-row .field-label {
  text-align: left;
}

.field-row .field-value {
  text-align: right;
}

.certificate-footer {
  margin-top: 40px;
}

.footer-text {
  font-family: 'Helvetica-Oblique', 'Arial', sans-serif;
  font-size: 10px;
  text-align: center;
  color: #666666;
  font-style: italic;
  margin-top: 10px;
}

.signature-section {
  display: flex;
  justify-content: space-around;
  margin-top: 50px;
}

.signature-block {
  text-align: center;
}

.signature-img {
  max-width: 150px;
  max-height: 60px;
  border-bottom: 1px solid #000000;
}

.stamp-img {
  max-width: 100px;
  max-height: 100px;
}

.signature-label {
  font-family: 'Helvetica-Oblique', 'Arial', sans-serif;
  font-size: 12px;
  font-style: italic;
  margin-top: 5px;
  color: #666666;
}
`;
  }

  static async generatePDF(
    data: TrainingCertificateInput,
    outputFormat: 'buffer' | 'stream' | 'base64' = 'buffer'
  ): Promise<Buffer | string | Readable> {
    const json = TrainingCertificateGenerator.generateJSON(data);
    const width = 841.89;
    const height = 595.28;
    const lineHeight = 20;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
        info: {
          Title: `Training Certificate ${json.certificate_number}`,
          Author: json.layout.companyName,
          Subject: `Training Certificate for ${json.trainee_name}`,
          Keywords: `certificate, training, ${json.certificate_number}`,
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

      doc.rect(0, 0, width, height).fill('#ffffff');

      let y = 40;

      if (json.layout.showLogo && json.layout.companyLogo) {
        try {
          const logoWidth = 120;
          const logoHeight = 60;
          doc.image(json.layout.companyLogo, width / 2 - logoWidth / 2, y, {
            width: logoWidth,
            height: logoHeight,
          });
          y += logoHeight + 20;
        } catch {
          y += 20;
        }
      } else {
        y += 20;
      }

      doc.font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#000000')
        .text(json.layout.companyName, width / 2, y, { align: 'center' });
      y += 35;

      doc.font('Helvetica')
        .fontSize(18)
        .text('TRAINING CERTIFICATE', width / 2, y, { align: 'center' });
      y += 40;

      if (json.layout.showCertificateNumber) {
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Certificate No:', width / 2 - 150, y, { align: 'right' });
        doc.font('Helvetica').fontSize(12);
        doc.text(json.certificate_number, width / 2 - 140, y, { align: 'left' });
        y += lineHeight * 2;
      }

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Job No:', 60, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.job_no || '—', 160, y);
      y += lineHeight * 2;

      doc.font('Helvetica').fontSize(16);
      doc.text('This is to certify that', width / 2, y, { align: 'center' });
      y += lineHeight * 2;

      doc.font('Helvetica-Bold').fontSize(20);
      doc.text(json.trainee_name, width / 2, y, { align: 'center' });
      y += lineHeight * 2;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('ID No.', 60, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.trainee_id || '—', 160, y);
      y += lineHeight;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Employee Of', 60, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.employer_name || '—', 160, y);
      y += lineHeight * 2;

      doc.font('Helvetica').fontSize(14);
      doc.text('Has successfully completed safety training for:', width / 2, y, { align: 'center' });
      y += lineHeight * 2;

      doc.font('Helvetica-Bold').fontSize(18);
      doc.text(json.training_title, width / 2, y, { align: 'center' });
      y += lineHeight * 3;

      doc.rect(50, y, width - 100, 1).stroke('#000000');
      y += 10;

      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('Topics Covered:', width / 2, y, { align: 'center' });
      y += 10;

      doc.rect(50, y, width - 100, 1).stroke('#000000');
      y += 10;

      doc.font('Helvetica').fontSize(12);
      if (json.topics_covered.length === 0) {
        doc.text('—', 80, y);
        y += lineHeight;
      } else {
        const bulletRadius = 3;
        const textIndent = 20;
        const bulletIndent = 12;
        doc.list(json.topics_covered, 80, y, {
          bulletRadius,
          textIndent,
          bulletIndent,
          lineGap: 5,
          paragraphGap: 5,
        });
        y += lineHeight * (json.topics_covered.length + 1);
      }
      y += 20;

      doc.rect(50, y, width - 100, 1).stroke('#000000');
      y += 10;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Training Date:', 80, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.training_date || '—', 200, y);
      y += lineHeight;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Valid Until:', 80, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.valid_until || '—', 200, y);
      y += lineHeight;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Approved By:', 80, y);
      doc.font('Helvetica').fontSize(12);
      doc.text(json.approved_by || '—', 200, y);
      y += 10;

      doc.rect(50, y, width - 100, 1).stroke('#000000');
      y += 30;

      const leftSigX = width / 2 - 180;
      const rightSigX = width / 2 + 30;
      const sigY = y;

      if (json.layout.showTrainerSignature && json.trainer_signature) {
        try {
          const sigWidth = 120;
          const sigHeight = 40;
          doc.image(json.trainer_signature, leftSigX, sigY, {
            width: sigWidth,
            height: sigHeight,
          });
        } catch {
          doc.font('Helvetica-Oblique').fontSize(10);
          doc.text('Trainer Signature', leftSigX, sigY, { align: 'center' });
        }
        doc.font('Helvetica-Oblique').fontSize(10);
        doc.fillColor('#666666');
        doc.text('Trainer Signature', leftSigX, sigY + 45, { align: 'center' });
      }

      if (json.layout.showCompanyStamp && json.company_stamp) {
        try {
          const stampWidth = 80;
          const stampHeight = 80;
          doc.image(json.company_stamp, rightSigX, sigY - 20, {
            width: stampWidth,
            height: stampHeight,
          });
        } catch {
          doc.font('Helvetica-Oblique').fontSize(10);
          doc.text('Company Stamp', rightSigX, sigY + 45, { align: 'center' });
        }
        doc.font('Helvetica-Oblique').fontSize(10);
        doc.fillColor('#666666');
        doc.text('Company Stamp', rightSigX, sigY + 70, { align: 'center' });
      }

      y = sigY + 90;

      if (json.layout.showFooterDisclaimer) {
        doc.font('Helvetica-Oblique').fontSize(10);
        doc.fillColor('#666666');
        doc.text(
          json.footer_disclaimer,
          50,
          height - 60,
          { align: 'center' }
        );
      }

      doc.end();
    });
  }

  static async generateFromTrainee(
    traineeId: number,
    additionalData?: Partial<TrainingCertificateInput>
  ): Promise<TrainingCertificateJSON> {
    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
      include: {
        company: { select: { name: true, logo: true } },
        enrollments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { job: { select: { jobNumber: true } } },
        },
      },
    });

    if (!trainee) {
      throw new Error(`Trainee with ID ${traineeId} not found`);
    }

    const latestEnrollment = trainee.enrollments[0];
    const now = new Date();
    const certNumber = additionalData?.certificateNumber ?? `${now.getFullYear()}-${String(trainee.id).padStart(4, '0')}`;

    const input: TrainingCertificateInput = {
      certificateNumber: certNumber,
      companyLogo: additionalData?.companyLogo ?? trainee.company?.logo ?? '',
      trainerSignature: additionalData?.trainerSignature ?? '',
      companyStamp: additionalData?.companyStamp ?? '',
      jobNumber: additionalData?.jobNumber ?? latestEnrollment?.job?.jobNumber ?? '',
      traineeName: additionalData?.traineeName ?? `${trainee.firstName} ${trainee.lastName}`,
      traineeId: additionalData?.traineeId ?? trainee.employeeId ?? trainee.emiratesId ?? '',
      employerName: additionalData?.employerName ?? trainee.company?.name ?? '',
      trainingTitle: additionalData?.trainingTitle ?? '',
      topicsCovered: additionalData?.topicsCovered ?? [],
      trainingDate: additionalData?.trainingDate ?? (latestEnrollment?.trainingDate
        ? new Date(latestEnrollment.trainingDate).toLocaleDateString()
        : ''),
      validUntil: additionalData?.validUntil ?? '',
      approvedBy: additionalData?.approvedBy ?? '',
      footerDisclaimer: additionalData?.footerDisclaimer ?? TrainingCertificateGenerator.DEFAULT_FOOTER_DISCLAIMER,
    };

    return TrainingCertificateGenerator.generateJSON(input);
  }
}

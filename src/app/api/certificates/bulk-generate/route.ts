import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CertificateManager } from '@/lib/services/certificate/certificate-manager';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();
    const { type, courseId, jobId, generatePDF = true, generateQRCode = true, generateSignature = true } = body;

    if (!type || !['training', 'inspection'].includes(type)) {
      return NextResponse.json({ error: 'Type must be "training" or "inspection"' }, { status: 400 });
    }

    let results: any[] = [];
    let errors: any[] = [];

    if (type === 'training') {
      if (!courseId) {
        return NextResponse.json({ error: 'Course ID is required for training certificates' }, { status: 400 });
      }

      // Get all completed enrollments for this course that don't have certificates
      const enrollments = await prisma.enrollment.findMany({
        where: {
          companyId,
          courseId,
          status: 'completed',
        },
        include: {
          trainee: true,
          course: true,
          job: true,
        },
      });

      for (const enrollment of enrollments) {
        try {
          // Require a valid job link before generating certificates
          if (!enrollment.jobId) {
            results.push({ enrollmentId: enrollment.id, certificate: null, skipped: true, reason: 'No job linked to enrollment' });
            continue;
          }

          // Validate the linked job has a training service line
          const linkedJob = await prisma.job.findFirst({
            where: { id: enrollment.jobId, companyId },
            include: { jobServices: true },
          });

          if (!linkedJob) {
            results.push({ enrollmentId: enrollment.id, certificate: null, skipped: true, reason: 'Linked job not found' });
            continue;
          }

          const trainingService = linkedJob.jobServices.find(s => s.serviceType === 'TRAINING');
          if (!trainingService) {
            results.push({ enrollmentId: enrollment.id, certificate: null, skipped: true, reason: 'Job does not have a Training service line' });
            continue;
          }

          // Check if certificate already exists
          const existingCert = await prisma.certificate.findFirst({
            where: {
              companyId,
              courseId: enrollment.courseId,
              jobId: enrollment.jobId,
            },
          });

          if (existingCert) {
            results.push({ enrollmentId: enrollment.id, certificate: existingCert, skipped: true, reason: 'Already exists' });
            continue;
          }

          const result = await CertificateManager.createCompleteCertificate({
            companyId,
            jobId: enrollment.jobId,
            traineeId: enrollment.traineeId,
            generatePDF,
            generateQRCode,
            generateSignature,
            status: 'issued',
            certificateType: 'TRAINING',
            jobServiceId: trainingService.id,
          });

          await prisma.certificate.update({
            where: { id: result.certificate.id },
            data: {
              certificateType: 'TRAINING',
              holderName: `${enrollment.trainee.firstName} ${enrollment.trainee.lastName}`,
              holderCompany: enrollment.trainee.companyName || null,
              courseId: enrollment.courseId,
              locationId: enrollment.locationId,
              issueDate: new Date(),
              expiryDate: enrollment.course.certificateValidityMonths
                ? new Date(Date.now() + enrollment.course.certificateValidityMonths * 30 * 24 * 60 * 60 * 1000)
                : null,
            },
          });

          results.push({ enrollmentId: enrollment.id, certificate: result.certificate, success: true });
        } catch (error) {
          errors.push({ enrollmentId: enrollment.id, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    } else if (type === 'inspection') {
      if (!jobId) {
        return NextResponse.json({ error: 'Job ID is required for inspection certificates' }, { status: 400 });
      }

      // Get all passed inspections for this job that don't have certificates
      const inspections = await prisma.inspection.findMany({
        where: {
          companyId,
          jobId,
          result: 'PASSED',
        },
        include: {
          job: { include: { customer: true, location: true } },
          inspector: true,
        },
      });

      for (const inspection of inspections) {
        try {
          const existingCert = await prisma.certificate.findFirst({
            where: {
              companyId,
              inspectionId: inspection.id,
            },
          });

          if (existingCert) {
            results.push({ inspectionId: inspection.id, certificate: existingCert, skipped: true, reason: 'Already exists' });
            continue;
          }

          const result = await CertificateManager.createCompleteCertificate({
            companyId,
            jobId: inspection.jobId,
            traineeId: 0,
            generatePDF,
            generateQRCode,
            generateSignature,
            status: 'issued',
          });

          await prisma.certificate.update({
            where: { id: result.certificate.id },
            data: {
              certificateType: 'INSPECTION',
              holderName: inspection.inspector?.name || inspection.job?.customer?.contact || 'Unknown',
              holderCompany: inspection.job?.customer?.name || null,
              inspectionId: inspection.id,
              locationId: inspection.job?.locationId || null,
              issueDate: new Date(),
              expiryDate: null,
            },
          });

          results.push({ inspectionId: inspection.id, certificate: result.certificate, success: true });
        } catch (error) {
          errors.push({ inspectionId: inspection.id, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }

    return NextResponse.json({
      generated: results.filter(r => r.success).length,
      skipped: results.filter(r => r.skipped).length,
      errors: errors.length,
      results,
      errorsList: errors,
    });
  } catch (error) {
    console.error('Error bulk generating certificates:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
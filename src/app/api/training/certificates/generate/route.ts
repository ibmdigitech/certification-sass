import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CertificateManager } from '@/lib/services/certificate/certificate-manager';
import { EnrollmentService } from '@/lib/services/enrollment.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();
    const { enrollmentId, generatePDF = true, generateQRCode = true, generateSignature = true } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const enrollment = await EnrollmentService.getEnrollmentById(enrollmentId, companyId);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.status !== 'completed') {
      return NextResponse.json({ error: 'Enrollment must be completed before generating certificate' }, { status: 400 });
    }

    // VALIDATION: Ensure enrollment is linked to a job and job service
    if (!enrollment.jobId) {
      return NextResponse.json({ 
        error: 'Cannot generate certificate: Enrollment is not linked to a Job. Please create a Job with Training service line and link this enrollment to it.' 
      }, { status: 400 });
    }

    // Validate job exists and is in proper status
    const job = await (prisma as any).job.findFirst({
      where: { id: enrollment.jobId, companyId },
      include: { jobServices: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Linked Job not found' }, { status: 404 });
    }

    // Check job status - must be at least SCHEDULED
    const validJobStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_REVIEW', 'PENDING_CERTIFICATION', 'PENDING_COMMERCIAL_CLEARANCE', 'READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED'];
    if (!validJobStatuses.includes(job.status)) {
      return NextResponse.json({ 
        error: `Cannot generate certificate: Job status is "${job.status}". Job must be at least SCHEDULED.` 
      }, { status: 400 });
    }

    // Validate job has a training service line
    const trainingService = job.jobServices.find((s: any) => s.serviceType === 'TRAINING');
    if (!trainingService) {
      return NextResponse.json({ error: 'Job does not have a Training service line' }, { status: 400 });
    }

    // Check if certificate already exists
    const existingCert = await (prisma as any).certificate.findFirst({
      where: {
        companyId,
        courseId: enrollment.courseId,
        traineeId: enrollment.traineeId,
        jobId: enrollment.jobId,
      },
    });

    if (existingCert) {
      return NextResponse.json({ 
        certificate: existingCert,
        message: 'Certificate already exists for this enrollment',
        alreadyExists: true 
      });
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

    // Update certificate with training-specific data
    await (prisma as any).certificate.update({
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error generating training certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
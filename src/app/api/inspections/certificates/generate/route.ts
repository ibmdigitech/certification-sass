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
    const { inspectionId, generatePDF = true, generateQRCode = true, generateSignature = true } = body;

    if (!inspectionId) {
      return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 });
    }

    const inspection = await prisma.inspection.findFirst({
      where: { id: inspectionId, companyId },
      include: {
        job: { include: { customer: true, location: true, jobServices: true } },
        inspector: true,
        reports: true,
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    if (inspection.result !== 'PASSED') {
      return NextResponse.json({ error: 'Inspection must be passed before generating certificate' }, { status: 400 });
    }

    // VALIDATION: Ensure inspection is linked to a job and job service
    if (!inspection.jobId) {
      return NextResponse.json({ 
        error: 'Cannot generate certificate: Inspection is not linked to a Job. Please create a Job with Inspection service line and link this inspection to it.' 
      }, { status: 400 });
    }

    // Validate job exists and is in proper status
    const job = await prisma.job.findFirst({
      where: { id: inspection.jobId, companyId },
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

    // Validate job has an inspection service line
    const inspectionService = job.jobServices.find(s => s.serviceType === 'INSPECTION');
    if (!inspectionService) {
      return NextResponse.json({ error: 'Job does not have an Inspection service line' }, { status: 400 });
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: {
        companyId,
        inspectionId: inspection.id,
      },
    });

    if (existingCert) {
      return NextResponse.json({ 
        certificate: existingCert,
        message: 'Certificate already exists for this inspection',
        alreadyExists: true 
      });
    }

    const result = await CertificateManager.createCompleteCertificate({
      companyId,
      jobId: inspection.jobId,
      traineeId: 0, // Not applicable for inspection
      generatePDF,
      generateQRCode,
      generateSignature,
      status: 'issued',
      certificateType: 'INSPECTION',
      jobServiceId: inspectionService.id,
    });

    // Update certificate with inspection-specific data
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error generating inspection certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CertificateManager } from '@/lib/services/certificate/certificate-manager';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, any> = { companyId, certificateType: 'TRAINING' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { holderName: { contains: search, mode: 'insensitive' } },
        { emiratesId: { contains: search, mode: 'insensitive' } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          course: { select: { title: true, code: true, certificateValidityMonths: true } },
          renewals: { select: { id: true, number: true, status: true, issueDate: true } },
          renewedFrom: { select: { id: true, number: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching certificates for renewal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();
    const { certificateId, newExpiryMonths, generatePDF = true, generateQRCode = true, generateSignature = true } = body;

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    // Get the original certificate
    const originalCert = await prisma.certificate.findFirst({
      where: { id: certificateId, companyId, certificateType: 'TRAINING' },
      include: { course: true },
    });

    if (!originalCert) {
      return NextResponse.json({ error: 'Original certificate not found' }, { status: 404 });
    }

    // Check if there's already an active renewal
    const activeRenewal = await prisma.certificate.findFirst({
      where: {
        companyId,
        renewedFromId: certificateId,
        status: { in: ['ISSUED', 'DRAFT'] },
      },
    });

    if (activeRenewal) {
      return NextResponse.json({ 
        error: 'Certificate already has an active renewal', 
        renewal: activeRenewal 
      }, { status: 400 });
    }

    // Determine expiry months
    const validityMonths = newExpiryMonths || originalCert.course?.certificateValidityMonths || 36;

    // Create new certificate as renewal
    const result = await CertificateManager.createCompleteCertificate({
      companyId,
      jobId: originalCert.jobId,
      traineeId: 0, // We'll update with trainee info after
      generatePDF,
      generateQRCode,
      generateSignature,
      status: 'issued',
      certificateType: 'TRAINING',
    });

    // Update with renewal-specific data and copy ID fields from original
    const renewedCert = await prisma.certificate.update({
      where: { id: result.certificate.id },
      data: {
        certificateType: 'TRAINING',
        holderName: originalCert.holderName,
        holderCompany: originalCert.holderCompany,
        courseId: originalCert.courseId,
        locationId: originalCert.locationId,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + validityMonths * 30 * 24 * 60 * 60 * 1000),
        // Copy ID fields from original certificate
        emiratesId: originalCert.emiratesId,
        passportNumber: originalCert.passportNumber,
        visaNumber: originalCert.visaNumber,
        licenseNumber: originalCert.licenseNumber,
        idTypeUsed: originalCert.idTypeUsed,
        photoUrl: originalCert.photoUrl,
        // Link renewal
        renewedFromId: originalCert.id,
      },
    });

    // Update original certificate status if needed
    await prisma.certificate.update({
      where: { id: originalCert.id },
      data: { status: 'RENEWED' },
    });

    return NextResponse.json({
      certificate: renewedCert,
      message: 'Certificate renewed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error renewing certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
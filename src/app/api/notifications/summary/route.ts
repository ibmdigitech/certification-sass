import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();

    const [
      // Required: Trainees missing required documents
      missingRequiredDocuments,
      // Required: Expiring certificates (within 30 days)
      expiringCertificates,
      // Required: Pending training enrollments (not started)
      pendingEnrollments,
      // Rejected: Rejected trainee documents
      rejectedDocuments,
      // Rejected: Rejected inspection reports
      rejectedReports,
      // Rejected: Revoked certificates
      revokedCertificates,
      // Approved/Certified: Issued certificates
      issuedCertificates,
      // Approved/Certified: Approved inspection reports
      approvedReports,
      // Approval: Pending certificate approval
      pendingCertificateApproval,
      // Approval: Pending inspection report approval
      pendingReportApproval,
      // Approval: Pending location accreditation
      pendingAccreditation,
    ] = await Promise.all([
      prisma.traineeDocument.count({
        where: {
          companyId,
          status: { in: ['expired', 'rejected'] },
        },
      }),
      prisma.certificate.count({
        where: {
          companyId,
          expiryDate: { gte: now, lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
          status: { notIn: ['REVOKED', 'EXPIRED'] },
        },
      }),
      prisma.enrollment.count({
        where: {
          companyId,
          status: 'active',
          startedAt: null,
        },
      }),
      prisma.traineeDocument.count({
        where: {
          companyId,
          status: 'rejected',
        },
      }),
      prisma.inspectionReport.count({
        where: {
          companyId,
          status: 'rejected',
        },
      }),
      prisma.certificate.count({
        where: {
          companyId,
          status: 'REVOKED',
        },
      }),
      prisma.certificate.count({
        where: {
          companyId,
          status: 'ISSUED',
        },
      }),
      prisma.inspectionReport.count({
        where: {
          companyId,
          status: 'approved',
        },
      }),
      prisma.certificate.count({
        where: {
          companyId,
          status: 'PENDING_APPROVAL',
        },
      }),
      prisma.inspectionReport.count({
        where: {
          companyId,
          status: { in: ['submitted', 'under_review'] },
        },
      }),
      prisma.locationAccreditation.count({
        where: {
          companyId,
          status: 'PENDING_VERIFICATION',
        },
      }),
    ]);

    const required = missingRequiredDocuments + expiringCertificates + pendingEnrollments;
    const rejected = rejectedDocuments + rejectedReports + revokedCertificates;
    const certified = issuedCertificates + approvedReports;
    const approval = pendingCertificateApproval + pendingReportApproval + pendingAccreditation;

    return NextResponse.json({
      required,
      rejected,
      certified,
      approval,
      total: required + rejected + certified + approval,
      breakdown: {
        required: {
          missingRequiredDocuments,
          expiringCertificates,
          pendingEnrollments,
        },
        rejected: {
          rejectedDocuments,
          rejectedReports,
          revokedCertificates,
        },
        certified: {
          issuedCertificates,
          approvedReports,
        },
        approval: {
          pendingCertificateApproval,
          pendingReportApproval,
          pendingAccreditation,
        },
      },
    });
  } catch (error) {
    console.error('Notifications summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
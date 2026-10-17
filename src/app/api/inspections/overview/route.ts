import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [
      totalInspections,
      inspectionsInProgress,
      inspectionsScheduled,
      completedInspections,
      totalReports,
      reportsPendingReview,
      reportsApproved,
      reportsRejected,
      openFailureWorkflows,
      totalCertificates,
      expiringCertificates,
    ] = await Promise.all([
      prisma.inspection.count({ where: { companyId } }),
      prisma.inspection.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      prisma.inspection.count({ where: { companyId, status: 'SCHEDULED' } }),
      prisma.inspection.count({ where: { companyId, status: 'COMPLETED' } }),
      prisma.inspectionReport.count({ where: { companyId } }),
      prisma.inspectionReport.count({ where: { companyId, status: 'submitted_for_review' } }),
      prisma.inspectionReport.count({ where: { companyId, status: 'approved' } }),
      prisma.inspectionReport.count({ where: { companyId, status: 'rejected' } }),
      prisma.failureWorkflow.count({ where: { companyId, status: 'open' } }),
      prisma.certificate.count({ where: { companyId, certificateType: 'INSPECTION' } }),
      prisma.certificate.count({
        where: {
          companyId,
          certificateType: 'INSPECTION',
          expiryDate: { gte: now, lt: ninetyDaysFromNow },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalInspections,
        inspectionsInProgress,
        inspectionsScheduled,
        completedInspections,
        totalReports,
        reportsPendingReview,
        reportsApproved,
        reportsRejected,
        totalFailures: openFailureWorkflows,
        openFailureWorkflows,
        totalCertificates,
        expiringCertificates,
      },
    });
  } catch (error) {
    console.error('Inspection overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

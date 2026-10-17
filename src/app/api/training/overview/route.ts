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

    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      pendingVerificationCourses,
      totalTrainees,
      activeTrainees,
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalCertificatesIssued,
      competencyCount,
    ] = await Promise.all([
      prisma.trainingCourse.count({ where: { companyId } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'PUBLISHED' } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'DRAFT' } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'PENDING_VERIFICATION' } }),
      prisma.trainee.count({ where: { companyId } }),
      prisma.trainee.count({ where: { companyId, status: 'active' } }),
      prisma.trainingSession.count({ where: { companyId } }),
      prisma.trainingSession.count({
        where: { companyId, startDate: { gte: now }, status: { in: ['SCHEDULED', 'PLANNED'] } },
      }),
      prisma.trainingSession.count({
        where: { companyId, status: 'COMPLETED' },
      }),
      prisma.enrollment.count({ where: { companyId } }),
      prisma.enrollment.count({ where: { companyId, status: 'in_progress' } }),
      prisma.enrollment.count({ where: { companyId, status: 'completed' } }),
      prisma.certificate.count({ where: { companyId, status: 'ISSUED' } }),
      prisma.competency.count({ where: { companyId } }),
    ]);

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const coursesWithLocation = await prisma.trainingCourse.findMany({
      where: { companyId, locationId: { not: null } },
      select: {
        location: { select: { emirate: true } },
      },
    });
    const locationCounts: Record<string, number> = {};
    coursesWithLocation.forEach((c: { location: { emirate: string | null } | null }) => {
      const loc = c.location?.emirate ?? 'Unknown';
      locationCounts[loc] = (locationCounts[loc] ?? 0) + 1;
    });
    const coursesByLocationArray = Object.entries(locationCounts).map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      totalCourses,
      publishedCourses,
      draftCourses,
      pendingVerificationCourses,
      totalTrainees,
      activeTrainees,
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      completionRate,
      totalCertificatesIssued,
      competencies: competencyCount,
      coursesByLocation: coursesByLocationArray,
    });
  } catch (error) {
    console.error('Training overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

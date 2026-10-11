import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();

    const [
      totalTrainees,
      activeCourses,
      pendingCourses,
      upcomingSessions,
      competencyGaps,
      recentEnrollments,
      expiringCertificates,
      completedSessions,
      totalCertificates,
      activeJobs,
      completedJobs,
    ] = await Promise.all([
      prisma.trainee.count({ where: { companyId } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'PUBLISHED' } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'PENDING_VERIFICATION' } }),
      prisma.trainingSession.count({
        where: {
          companyId,
          startDate: { gte: now },
          status: { in: ['SCHEDULED', 'PLANNED'] },
        },
      }),
      prisma.competency.count({ where: { companyId } }),
      prisma.enrollment.findMany({
        where: { companyId, status: 'in_progress' },
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: {
          trainee: { select: { firstName: true, lastName: true, employeeId: true } },
          course: { select: { title: true, code: true } },
          assessmentAttempts: {
            take: 1,
            orderBy: { startedAt: 'desc' },
            include: { assessment: { select: { title: true } } },
          },
        },
      }),
      prisma.certificate.findMany({
        where: {
          companyId,
          expiryDate: { gte: now, lt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { expiryDate: 'asc' },
        take: 5,
        include: {
          course: { select: { title: true } },
        },
      }),
      prisma.trainingSession.count({
        where: { companyId, status: 'COMPLETED', endDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.certificate.count({ where: { companyId } }),
      prisma.job.count({ where: { companyId, status: { in: ['PLANNED', 'IN_PROGRESS'] } } }),
      prisma.job.count({ where: { companyId, status: 'COMPLETED', updatedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    const recentActivity = recentEnrollments.map((e: typeof recentEnrollments[0]) => {
      const traineeName = `${e.trainee.firstName} ${e.trainee.lastName}`;
      const courseName = e.course.title;
      const lastAttempt = e.assessmentAttempts[0];
      const assessmentName = lastAttempt?.assessment?.title ?? courseName;
      const score = lastAttempt?.score ?? 0;
      const passed = lastAttempt?.passed ?? false;

      return {
        trainee: traineeName,
        employeeId: e.trainee.employeeId,
        course: courseName,
        courseCode: e.course.code,
        assessment: lastAttempt ? assessmentName : null,
        score: lastAttempt ? `${score}/${lastAttempt.maxScore}` : null,
        status: passed ? 'passed' : lastAttempt ? 'failed' : 'in_progress',
        date: (lastAttempt?.startedAt ?? e.startedAt).toISOString(),
      };
    });

    const expiringCerts = expiringCertificates.map((c: typeof expiringCertificates[0]) => ({
      trainee: c.holderName ?? 'N/A',
      course: c.course?.title ?? 'N/A',
      certificateNumber: c.number,
      expiresAt: (c.expiryDate ?? new Date()).toISOString(),
      daysRemaining: c.expiryDate ? Math.ceil((c.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0,
    }));

    return NextResponse.json({
      stats: {
        totalTrainees,
        activeCourses,
        pendingCourses,
        upcomingSessions,
        competencyGaps,
        totalCertificates,
        activeJobs,
        completedJobs,
        completedSessions,
      },
      recentActivity,
      expiringCertificates: expiringCerts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

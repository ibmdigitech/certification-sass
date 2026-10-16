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
    const companyId = Number(session.user.companyId);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined; // 'TRAINING' | 'INSPECTION'
    const status = searchParams.get('status') || undefined;

    const where: any = { companyId };
    if (type) where.serviceType = type;
    if (status) where.status = status;

    const [jobServices, trainingSessions, inspections] = await Promise.all([
      prisma.jobService.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              customer: { select: { id: true, contact: true, email: true, phone: true } },
              location: { select: { id: true, code: true, name: true, emirate: true } },
            },
          },
          assignedResponsible: {
            select: { id: true, name: true, email: true, role: true },
          },
          trainingSessions: {
            include: {
              course: { select: { id: true, code: true, title: true } },
              trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
              _count: { select: { enrollments: true } },
            },
          },
          inspections: {
            include: {
              inspector: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: [{ scheduledStart: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.trainingSession.findMany({
        where: { companyId },
        include: {
          job: { select: { id: true, jobNumber: true } },
          course: { select: { id: true, code: true, title: true } },
          location: { select: { id: true, name: true, code: true } },
          trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.inspection.findMany({
        where: { companyId },
        include: {
          job: { select: { id: true, jobNumber: true } },
          location: { select: { id: true, name: true, code: true } },
          inspector: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const scheduledServices = jobServices.filter((js) => js.scheduledStart && js.scheduledEnd);
    const unscheduledServices = jobServices.filter((js) => !js.scheduledStart || !js.scheduledEnd);

    return NextResponse.json({
      scheduledServices,
      unscheduledServices,
      trainingSessions,
      inspections,
      stats: {
        totalScheduled: scheduledServices.length,
        totalUnscheduled: unscheduledServices.length,
        trainingCount: jobServices.filter((js) => js.serviceType === 'TRAINING').length,
        inspectionCount: jobServices.filter((js) => js.serviceType === 'INSPECTION').length,
      },
    });
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
  }
}

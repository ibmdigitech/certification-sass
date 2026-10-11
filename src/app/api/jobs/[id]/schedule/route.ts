import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type JobServiceType = 'TRAINING' | 'INSPECTION';

const prisma = new PrismaClient();

interface SchedulePayload {
  serviceType: 'TRAINING' | 'INSPECTION';
  jobServiceId?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  assignedResponsibleId?: number;
  trainerId?: number;
  inspectorId?: number;
  courseId?: number;
  inspectionType?: string;
  equipmentAsset?: string;
  traineeIds?: number[];
  deliveryMode?: 'onsite' | 'online' | 'hybrid';
  locationId?: number;
  meetingUrl?: string;
  siteLocation?: string;
  requiredChecklistId?: number;
  specialInstructions?: string;
  forceOverride?: boolean;
  overrideReason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = Number(session.user.companyId);
    const { id } = await params;
    const jobId = Number(id);
    const body: SchedulePayload = await request.json();

    const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let result: any;
    let conflict: any;
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const js = body.jobServiceId
        ? await tx.jobService.findFirst({ where: { id: body.jobServiceId, jobId, companyId } })
        : await tx.jobService.findFirst({
            where: { jobId, companyId, serviceType: body.serviceType as JobServiceType },
          });

      if (!js) {
        throw Object.assign(new Error('No matching job service for this job'), { code: 404 });
      }

      if (!body.scheduledStart || !body.scheduledEnd) {
        throw new Error('scheduledStart and scheduledEnd are required');
      }
      const start = new Date(body.scheduledStart);
      const end = new Date(body.scheduledEnd);
      if (end <= start) {
        throw new Error('scheduledEnd must be after scheduledStart');
      }

      const responsibleId = body.assignedResponsibleId || body.trainerId || body.inspectorId;
      if (responsibleId) {
        const person = await tx.user.findFirst({ where: { id: responsibleId, companyId } });
        if (!person) {
          throw new Error('Assigned personnel does not belong to this company');
        }

        const overlap = await tx.jobService.findFirst({
          where: {
            companyId,
            assignedResponsibleId: responsibleId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            NOT: { id: js.id },
            OR: [
              { AND: [{ scheduledStart: { lte: end } }, { scheduledStart: { gte: start } }] },
              { AND: [{ scheduledEnd: { gte: start } }, { scheduledEnd: { lte: end } }] },
              { AND: [{ scheduledStart: { lte: start } }, { scheduledEnd: { gte: end } }] },
            ],
          },
        });

        if (overlap) {
          if (!body.forceOverride) {
            conflict = { conflictWithJobServiceId: overlap.id, jobServiceId: js.id };
            return;
          }
          if (!body.overrideReason) {
            throw new Error('overrideReason is required when forceOverride is true');
          }
          await tx.auditLog.create({
            data: {
              companyId,
              userId: Number(session.user.id),
              action: 'SCHEDULING_OVERRIDE',
              entityType: 'JobService',
              entityId: js.id,
              tenantId: companyId,
              previousValue: { conflictWithJobServiceId: overlap.id } as any,
              newValue: { overrideReason: body.overrideReason } as any,
            },
          });
        }
      }

      if (body.serviceType === 'TRAINING') {
        if (!body.courseId) {
          throw new Error('courseId is required to schedule a training session');
        }
        const existingSession = await tx.trainingSession.findFirst({
          where: { jobServiceId: js.id, companyId },
          select: { id: true },
        });

        let session;
        if (existingSession) {
          session = await tx.trainingSession.update({
            where: { id: existingSession.id },
            data: {
              startDate: start,
              endDate: end,
              locationId: body.locationId || null,
              status: 'SCHEDULED',
              notes: body.specialInstructions,
              trainerId: body.trainerId || undefined,
            },
          });
        } else {
          session = await tx.trainingSession.create({
            data: {
              companyId,
              jobId,
              jobServiceId: js.id,
              courseId: body.courseId,
              trainerId: body.trainerId || undefined,
              startDate: start,
              endDate: end,
              locationId: body.locationId || null,
              status: 'SCHEDULED',
              notes: body.specialInstructions,
            },
          });
        }

        if (body.traineeIds && body.traineeIds.length > 0) {
          for (const tid of body.traineeIds) {
            const trainee = await tx.trainee.findFirst({ where: { id: tid, companyId }, select: { id: true } });
            if (!trainee) throw new Error('Trainee does not belong to this company');
          }
          const existingEnrollments = await tx.sessionEnrollment.findMany({
            where: { sessionId: session.id, traineeId: { in: body.traineeIds } },
          });
          const existingIds = new Set(existingEnrollments.map((e: { traineeId: number }) => e.traineeId));
          for (const tid of body.traineeIds) {
            if (!existingIds.has(tid)) {
              await tx.sessionEnrollment.create({
                data: { companyId, sessionId: session.id, traineeId: tid, status: 'ENROLLED' },
              });
            }
          }
          await tx.trainingSession.update({
            where: { id: session.id },
            data: { enrolledCount: body.traineeIds.length },
          });
        }

        result = { jobServiceId: js.id, trainingSession: session };
        return;
      }

      if (body.serviceType === 'INSPECTION') {
        const existingInspection = await tx.inspection.findFirst({
          where: { jobServiceId: js.id, companyId },
          select: { id: true },
        });

        let inspection;
        if (existingInspection) {
          inspection = await tx.inspection.update({
            where: { id: existingInspection.id },
            data: {
              inspectorId: body.inspectorId || body.assignedResponsibleId || undefined,
              inspectionType: body.inspectionType || undefined,
              equipmentAsset: body.equipmentAsset || undefined,
              date: start,
              status: 'SCHEDULED',
            },
          });
        } else {
          inspection = await tx.inspection.create({
            data: {
              companyId,
              jobId,
              jobServiceId: js.id,
              inspectorId: body.inspectorId || body.assignedResponsibleId || null,
              inspectionType: body.inspectionType || null,
              equipmentAsset: body.equipmentAsset || null,
              date: start,
              status: 'SCHEDULED',
            },
          });
        }

        result = { jobServiceId: js.id, inspection };
        return;
      }

      throw new Error('Unknown serviceType');
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Personnel scheduling conflict detected', ...conflict, requiresOverride: true },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error scheduling job service:', error);
    const code = (error as any)?.code;
    const message = error instanceof Error ? error.message : 'Failed to schedule';
    let status = 500;
    if (code === 404 || message.includes('not found') || message.includes('required') || message.includes('does not belong') || message.includes('after') || message.includes('Unknown serviceType') === false && message.includes('Unknown')) {
      status = 400;
    }
    if (code === 404) status = 404;
    return NextResponse.json({ error: message }, { status });
  }
}

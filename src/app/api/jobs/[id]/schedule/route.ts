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

export async function GET(
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

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: {
        location: true,
        customer: true,
        jobServices: {
          include: {
            assignedResponsible: { select: { id: true, name: true, email: true, role: true } },
            inspections: {
              include: {
                inspector: { select: { id: true, name: true, email: true } },
              },
            },
            trainingSessions: {
              include: {
                course: { select: { id: true, code: true, title: true } },
                trainer: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
                enrollments: {
                  include: {
                    trainee: { select: { id: true, firstName: true, lastName: true, emiratesId: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const [courses, users, locations, trainees, trainerRecords] = await Promise.all([
      prisma.trainingCourse.findMany({
        where: { companyId, status: { in: ['PUBLISHED', 'ACTIVE'] } },
        select: { id: true, code: true, title: true, trainingHours: true, locationId: true, accreditationId: true },
        orderBy: { title: 'asc' },
      }),
      prisma.user.findMany({
        where: { companyId, status: 'active' },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      }),
      prisma.location.findMany({
        where: { companyId },
        select: { id: true, code: true, name: true, emirate: true },
        orderBy: { name: 'asc' },
      }),
      prisma.trainee.findMany({
        where: { companyId },
        select: { id: true, firstName: true, lastName: true, emiratesId: true, companyName: true },
        orderBy: { firstName: 'asc' },
        take: 100,
      }),
      prisma.trainer.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const trainers = users.filter((u) => u.role === 'TRAINER' || u.role === 'ADMIN' || u.role === 'TRAINING_MANAGER');
    const inspectors = users.filter((u) => u.role === 'INSPECTOR' || u.role === 'ADMIN' || u.role === 'REVIEWER');

    return NextResponse.json({
      job,
      options: {
        courses,
        trainers,
        inspectors,
        trainerRecords: trainerRecords.map((t) => ({
          trainerId: t.id,
          userId: t.userId,
          name: t.user.name,
          email: t.user.email,
        })),
        locations,
        trainees: trainees.map((t) => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`.trim(),
          emiratesId: t.emiratesId,
          companyName: t.companyName,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching job schedule options:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
  }
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

      // Resolve personnel user ID and Trainer record
      let responsibleUserId: number | null = null;
      let trainerRecord: { id: number; userId: number } | null = null;

      if (body.serviceType === 'TRAINING') {
        const candidateId = body.trainerId || body.assignedResponsibleId;
        if (candidateId) {
          // Check if candidateId is a Trainer model ID or User ID
          const existingTrainer = await tx.trainer.findFirst({
            where: {
              OR: [{ id: candidateId }, { userId: candidateId }],
              companyId,
            },
          });

          if (existingTrainer) {
            trainerRecord = existingTrainer;
            responsibleUserId = existingTrainer.userId;
          } else {
            const user = await tx.user.findFirst({ where: { id: candidateId, companyId } });
            if (user) {
              responsibleUserId = user.id;
              // Ensure a Trainer record exists
              const createdTrainer = await tx.trainer.create({
                data: {
                  companyId,
                  userId: user.id,
                  status: 'ACTIVE',
                },
              });
              trainerRecord = createdTrainer;
            } else {
              throw new Error('Assigned trainer does not belong to this company');
            }
          }
        }
      } else {
        const candidateId = body.inspectorId || body.assignedResponsibleId;
        if (candidateId) {
          const person = await tx.user.findFirst({ where: { id: candidateId, companyId } });
          if (!person) {
            throw new Error('Assigned inspector does not belong to this company');
          }
          responsibleUserId = person.id;
        }
      }

      // Conflict detection for assigned personnel
      if (responsibleUserId) {
        const overlap = await tx.jobService.findFirst({
          where: {
            companyId,
            assignedResponsibleId: responsibleUserId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            NOT: { id: js.id },
            OR: [
              { AND: [{ scheduledStart: { lt: end } }, { scheduledEnd: { gt: start } }] },
            ],
          },
          include: {
            job: { select: { jobNumber: true } },
          },
        });

        if (overlap) {
          if (!body.forceOverride) {
            conflict = {
              conflictWithJobServiceId: overlap.id,
              conflictJobNumber: overlap.job?.jobNumber || `Job #${overlap.jobId}`,
              conflictingStart: overlap.scheduledStart,
              conflictingEnd: overlap.scheduledEnd,
              jobServiceId: js.id,
            };
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
              previousValue: {
                conflictWithJobServiceId: overlap.id,
                conflictingStart: overlap.scheduledStart,
                conflictingEnd: overlap.scheduledEnd,
              } as any,
              newValue: { overrideReason: body.overrideReason } as any,
            },
          });
        }
      }

      // Update JobService with scheduled details
      await tx.jobService.update({
        where: { id: js.id },
        data: {
          scheduledStart: start,
          scheduledEnd: end,
          assignedResponsibleId: responsibleUserId || undefined,
          status: 'SCHEDULED',
        },
      });

      // Update parent Job status and scheduledDate
      await tx.job.update({
        where: { id: jobId },
        data: {
          scheduledDate: start,
          ...(job.status === 'NEW' || job.status === 'DRAFT' || job.status === 'pending'
            ? { status: 'SCHEDULED' }
            : {}),
        },
      });

      // Specific Training workflow
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
              courseId: body.courseId,
              locationId: body.locationId || job.locationId || null,
              status: 'SCHEDULED',
              notes: body.specialInstructions || undefined,
              trainerId: trainerRecord?.id || undefined,
            },
          });
        } else {
          session = await tx.trainingSession.create({
            data: {
              companyId,
              jobId,
              jobServiceId: js.id,
              courseId: body.courseId,
              trainerId: trainerRecord?.id || undefined,
              startDate: start,
              endDate: end,
              locationId: body.locationId || job.locationId || null,
              status: 'SCHEDULED',
              notes: body.specialInstructions || undefined,
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
      } else if (body.serviceType === 'INSPECTION') {
        // Specific Inspection workflow
        const existingInspection = await tx.inspection.findFirst({
          where: { jobServiceId: js.id, companyId },
          select: { id: true },
        });

        let inspection;
        if (existingInspection) {
          inspection = await tx.inspection.update({
            where: { id: existingInspection.id },
            data: {
              inspectorId: responsibleUserId || undefined,
              inspectionType: body.inspectionType || undefined,
              equipmentAsset: body.equipmentAsset || undefined,
              locationId: body.locationId || job.locationId || undefined,
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
              inspectorId: responsibleUserId || null,
              inspectionType: body.inspectionType || null,
              equipmentAsset: body.equipmentAsset || null,
              locationId: body.locationId || job.locationId || null,
              date: start,
              status: 'SCHEDULED',
            },
          });
        }

        result = { jobServiceId: js.id, inspection };
      } else {
        throw new Error('Unknown serviceType');
      }

      // Create notification for assigned personnel
      if (responsibleUserId) {
        await tx.notification.create({
          data: {
            companyId,
            userId: responsibleUserId,
            type: 'TRAINING_UPCOMING',
            title: `Scheduled for Job ${job.jobNumber}`,
            message: `You are scheduled for ${body.serviceType} from ${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            entityType: 'JobService',
            entityId: js.id,
            actionUrl: `/jobs/${job.id}`,
          },
        });
      }
    });

    if (conflict) {
      return NextResponse.json(
        {
          error: 'Personnel scheduling conflict detected',
          conflict,
          requiresOverride: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error scheduling job service:', error);
    const code = (error as any)?.code;
    const message = error instanceof Error ? error.message : 'Failed to schedule';
    let status = 500;
    if (code === 404 || message.includes('not found') || message.includes('required') || message.includes('does not belong') || message.includes('after')) {
      status = 400;
    }
    if (code === 404) status = 404;
    return NextResponse.json({ error: message }, { status });
  }
}

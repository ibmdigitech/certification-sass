import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSessionInput {
  companyId: number;
  jobId?: number;
  jobServiceId?: number;
  courseId?: number;
  locationId?: number;
  accreditationId?: number;
  trainerId?: number;
  assessorId?: number;
  startDate: Date | string;
  endDate: Date | string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status?: string;
  notes?: string;
}

export interface SessionFilters {
  companyId: number;
  courseId?: number;
  locationId?: number;
  status?: string;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  jobId?: number;
  page?: number;
  pageSize?: number;
}

export class TrainingSessionService {
  static async createSession(input: CreateSessionInput) {
    const {
      companyId,
      jobId,
      jobServiceId,
      courseId,
      locationId,
      accreditationId,
      trainerId,
      assessorId,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity = 20,
      status = 'SCHEDULED',
      notes,
    } = input;

    if (jobId) {
      const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
      if (!job) throw new Error('Job does not belong to this company');
    }
    if (jobServiceId) {
      const js = await prisma.jobService.findFirst({ where: { id: jobServiceId, companyId } });
      if (!js) throw new Error('Job service does not belong to this company');
      if (jobId && js.jobId !== jobId) throw new Error('Job service does not belong to the specified job');
    }

    return prisma.trainingSession.create({
      data: {
        companyId,
        jobId,
        jobServiceId,
        courseId,
        locationId,
        accreditationId,
        trainerId,
        assessorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        capacity,
        status,
        notes,
      },
      include: {
        course: { select: { title: true, code: true } },
        location: { select: { name: true, code: true, emirate: true } },
        accreditation: { select: { name: true, code: true } },
        trainer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        assessor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: { select: { enrollments: true, attendances: true } },
      },
    });
  }

  static async getSessionById(id: number, companyId: number) {
    return prisma.trainingSession.findFirst({
      where: { id, companyId },
      include: {
        course: {
          include: {
            modules: true,
            courseCompetencies: {
              include: {
                competency: true,
              },
            },
          },
        },
        location: true,
        accreditation: true,
        trainer: {
          include: {
            user: true,
          },
        },
        assessor: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            trainee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
        attendances: {
          include: {
            trainee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true, attendances: true } },
      },
    });
  }

  static async listSessions(filters: SessionFilters) {
    const {
      companyId,
      courseId,
      locationId,
      status,
      startDateFrom,
      startDateTo,
      jobId,
      page = 1,
      pageSize = 20,
    } = filters;

    const where: Prisma.TrainingSessionWhereInput = { companyId };

    if (courseId) where.courseId = courseId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        where,
        include: {
          course: { select: { title: true, code: true } },
          location: { select: { name: true, code: true, emirate: true } },
          accreditation: { select: { name: true, code: true } },
          trainer: {
            include: {
              user: { select: { name: true } },
            },
          },
          _count: { select: { enrollments: true, attendances: true } },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trainingSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async updateSession(id: number, companyId: number, data: Partial<CreateSessionInput>) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.trainingSession.update({
      where: { id, companyId },
      data: updateData,
      include: {
        course: { select: { title: true, code: true } },
        location: { select: { name: true, code: true } },
        accreditation: { select: { name: true, code: true } },
        trainer: { include: { user: { select: { name: true } } } },
        assessor: { include: { user: { select: { name: true } } } },
      },
    });
  }

  static async deleteSession(id: number, companyId: number) {
    return prisma.trainingSession.delete({
      where: { id, companyId },
    });
  }

  static async enrollTrainee(sessionId: number, companyId: number, traineeId: number) {
    // Check capacity
    const session = await prisma.trainingSession.findFirst({
      where: { id: sessionId, companyId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!session) throw new Error('Session not found');
    if (session.capacity && session._count.enrollments >= session.capacity) {
      throw new Error('Session is at full capacity');
    }

    return prisma.sessionEnrollment.upsert({
      where: {
        sessionId_traineeId: { sessionId, traineeId },
      },
      update: { status: 'ENROLLED' },
      create: {
        companyId,
        sessionId,
        traineeId,
        status: 'ENROLLED',
        enrolledAt: new Date(),
      },
      include: {
        trainee: { select: { firstName: true, lastName: true, email: true, employeeId: true } },
        session: { select: { id: true, startDate: true, endDate: true } },
      },
    });
  }

  static async unenrollTrainee(sessionId: number, companyId: number, traineeId: number) {
    return prisma.sessionEnrollment.delete({
      where: {
        sessionId_traineeId: { sessionId, traineeId },
      },
    });
  }

  static async recordAttendance(sessionId: number, companyId: number, traineeId: number, present: boolean) {
    const status = present ? 'PRESENT' : 'ABSENT';
    return prisma.attendance.upsert({
      where: {
        sessionId_traineeId: { sessionId, traineeId },
      },
      update: { status, checkInTime: present ? new Date() : null },
      create: {
        companyId,
        sessionId,
        traineeId,
        status,
        checkInTime: present ? new Date() : null,
      },
    });
  }

  static async recordCompetency(
    sessionId: number,
    companyId: number,
    traineeId: number,
    competencyId: number,
    status: 'COMPETENT' | 'NOT_COMPETENT' | 'REQUIRES_REASSESSMENT',
    assessorId: number,
    evidence?: string,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Find the session and verify it has the competency via course
      const session = await tx.trainingSession.findFirst({
        where: { id: sessionId, companyId },
        include: {
          course: {
            include: {
              courseCompetencies: true
            }
          }
        }
      });

      if (!session) throw new Error('Session not found');

      const isCompetencyInCourse = session.course?.courseCompetencies.some(cc => cc.competencyId === competencyId);
      if (!isCompetencyInCourse) {
        throw new Error('Competency is not part of this training course');
      }

      // Upsert the trainee competency record
      const traineeCompetency = await tx.traineeCompetency.upsert({
        where: {
          traineeId_competencyId: { traineeId, competencyId }
        },
        update: {
          status,
          achievedAt: status === 'COMPETENT' ? new Date() : null,
          assessedBy: assessorId,
          evidence: evidence || null,
          notes: notes || null,
        },
        create: {
          companyId,
          traineeId,
          competencyId,
          status,
          achievedAt: status === 'COMPETENT' ? new Date() : null,
          assessedBy: assessorId,
          evidence: evidence || null,
          notes: notes || null,
        }
      });

      // Update enrollment status to COMPLETED if all required competencies are met
      if (status === 'COMPETENT') {
        const courseCompetencies = session.course?.courseCompetencies || [];
        const requiredIds = courseCompetencies.filter(cc => cc.isRequired).map(cc => cc.competencyId);
        
        const traineeComps = await tx.traineeCompetency.findMany({
          where: { traineeId, companyId, competencyId: { in: requiredIds }, status: 'COMPETENT' }
        });

        if (traineeComps.length >= requiredIds.length) {
          await tx.sessionEnrollment.update({
            where: { sessionId_traineeId: { sessionId, traineeId } },
            data: { status: 'COMPLETED', completedAt: new Date() }
          });
        }
      }

      return traineeCompetency;
    });
  }
}

export const trainingSessionService = TrainingSessionService;

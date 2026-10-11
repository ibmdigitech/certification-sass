import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTimesheetInput {
  companyId: number;
  userId: number;
  jobId?: number;
  jobServiceId?: number;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  breakMinutes?: number;
  description?: string;
}

export interface TimesheetFilters {
  companyId: number;
  userId?: number;
  jobId?: number;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  pageSize?: number;
}

export class TimesheetService {
  /**
   * Creates a new timesheet entry in DRAFT status.
   */
  static async create(input: CreateTimesheetInput) {
    // Validate that the job belongs to the company
    if (input.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: input.jobId, companyId: input.companyId },
      });
      if (!job) throw new Error('Job does not belong to this company');
    }

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    return prisma.timesheet.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        jobId: input.jobId || null,
        jobServiceId: input.jobServiceId || null,
        date: new Date(input.date),
        startTime: start,
        endTime: end,
        breakMinutes: input.breakMinutes ?? 0,
        description: input.description || null,
        status: 'draft',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, jobNumber: true } },
      },
    });
  }

  /**
   * Lists timesheets with filtering and pagination.
   */
  static async list(filters: TimesheetFilters) {
    const {
      companyId, userId, jobId, status,
      dateFrom, dateTo,
      page = 1, pageSize = 20,
    } = filters;

    const where: Prisma.TimesheetWhereInput = { companyId };
    if (userId) where.userId = userId;
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          job: { select: { id: true, jobNumber: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timesheet.count({ where }),
    ]);

    return {
      timesheets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Submits a timesheet for approval.
   * Only DRAFT timesheets can be submitted.
   */
  static async submit(id: number, companyId: number) {
    const ts = await prisma.timesheet.findFirst({ where: { id, companyId } });
    if (!ts) throw new Error('Timesheet not found');
    if (ts.status !== 'draft') {
      throw new Error(`Cannot submit a timesheet with status "${ts.status}". Only draft timesheets can be submitted.`);
    }

    return prisma.timesheet.update({
      where: { id },
      data: { status: 'submitted' },
    });
  }

  /**
   * Approves a submitted timesheet.
   * Only SUBMITTED timesheets can be approved.
   */
  static async approve(id: number, companyId: number, approverId: number) {
    const ts = await prisma.timesheet.findFirst({ where: { id, companyId } });
    if (!ts) throw new Error('Timesheet not found');
    if (ts.status !== 'submitted') {
      throw new Error(`Cannot approve a timesheet with status "${ts.status}". Only submitted timesheets can be approved.`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id },
        data: { status: 'approved', approvedBy: approverId },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId: approverId,
          action: 'TIMESHEET_APPROVED',
          entityType: 'Timesheet',
          entityId: id,
        },
      });

      return updated;
    });
  }

  /**
   * Locks an approved timesheet (makes it immutable).
   * Only APPROVED timesheets can be locked.
   */
  static async lock(id: number, companyId: number, userId: number) {
    const ts = await prisma.timesheet.findFirst({ where: { id, companyId } });
    if (!ts) throw new Error('Timesheet not found');
    if (ts.status !== 'approved') {
      throw new Error(`Cannot lock a timesheet with status "${ts.status}". Only approved timesheets can be locked.`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id },
        data: { status: 'locked' },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId,
          action: 'TIMESHEET_LOCKED',
          entityType: 'Timesheet',
          entityId: id,
        },
      });

      return updated;
    });
  }

  /**
   * Calculates total worked hours for a timesheet entry.
   */
  static calculateHours(startTime: Date, endTime: Date, breakMinutes: number): {
    totalMinutes: number;
    netMinutes: number;
    hours: number;
    overtime: number;
  } {
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const netMinutes = totalMinutes - breakMinutes;
    const hours = netMinutes / 60;
    const overtime = Math.max(0, hours - 8); // Overtime after 8 hours

    return {
      totalMinutes: Math.round(totalMinutes),
      netMinutes: Math.round(netMinutes),
      hours: Math.round(hours * 100) / 100,
      overtime: Math.round(overtime * 100) / 100,
    };
  }

  /**
   * Gets timesheets for a specific job, useful for certificate package generation.
   */
  static async getTimesheetsForJob(jobId: number, companyId: number) {
    return prisma.timesheet.findMany({
      where: { jobId, companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }
}

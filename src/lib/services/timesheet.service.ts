import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type TimesheetStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'locked';

export const TIMESHEET_STATUS_LABELS: Record<TimesheetStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned for Correction',
  locked: 'Locked',
};

export const TIMESHEET_STATUS_COLORS: Record<TimesheetStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-orange-100 text-orange-800 border-orange-200',
  locked: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const WORK_COMPLETION_STATUS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

export const INSPECTION_RESULT_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
] as const;

export const CERTIFICATE_STATUS_OPTIONS = [
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
  { value: 'FAILED', label: 'Failed' },
] as const;

export interface TimesheetEquipmentItemInput {
  equipmentId?: number;
  equipmentType?: string;
  equipmentDescription?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  equipmentCode?: string;
  quantity?: number;
  inspectionResult?: string;
  inspectionDate?: Date | string;
  remarks?: string;
  certificateStatus?: string;
  reportStatus?: string;
}

export interface CreateTimesheetInput {
  companyId: number;
  userId: number;
  jobId?: number;
  jobServiceId?: number;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  breakMinutes?: number;
  travelTimeMinutes?: number;
  additionalWork?: string;
  workCompletionStatus?: string;
  inspectionResult?: string;
  workLocation?: string;
  description?: string;
  timesheetType?: 'INSPECTION' | 'TRAINING';
  equipmentItems?: TimesheetEquipmentItemInput[];
}

export interface UpdateTimesheetInput {
  date?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  breakMinutes?: number;
  travelTimeMinutes?: number;
  totalWorkingHours?: number;
  overtimeHours?: number;
  additionalWork?: string;
  workCompletionStatus?: string;
  inspectionResult?: string;
  workLocation?: string;
  description?: string;
  equipmentItems?: TimesheetEquipmentItemInput[];
}

export interface TimesheetFilters {
  companyId: number;
  userId?: number;
  jobId?: number;
  jobNumber?: string;
  timesheetNumber?: string;
  status?: string;
  statuses?: string[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  engineerId?: number;
  customerId?: number;
  equipmentType?: string;
  inspectionResult?: string;
  timesheetType?: string;
  page?: number;
  pageSize?: number;
}

export interface TimesheetEquipmentItem {
  id: number;
  companyId: number;
  timesheetId: number;
  equipmentId: number | null;
  equipmentType: string | null;
  equipmentDescription: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  equipmentCode: string | null;
  quantity: number | null;
  inspectionResult: string | null;
  inspectionDate: Date | null;
  remarks: string | null;
  certificateStatus: string | null;
  reportStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetWithDetails {
  id: number;
  companyId: number;
  timesheetNumber: string;
  timesheetType: string;
  userId: number;
  jobId: number | null;
  jobServiceId: number | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  travelTimeMinutes: number;
  totalWorkingHours: number | null;
  overtimeHours: number | null;
  additionalWork: string | null;
  workCompletionStatus: string | null;
  inspectionResult: string | null;
  workLocation: string | null;
  description: string | null;
  status: string;
  approvedBy: number | null;
  reviewedBy: number | null;
  reviewComments: string | null;
   reviewedAt: Date | null;
   approvedAt: Date | null;
   submittedAt: Date | null;
   createdAt: Date;
  updatedAt: Date;
  user: { id: number; name: string; email: string | null } | null;
  job: {
    id: number;
    jobNumber: string;
    customer: { id: number; contact: string | null; email: string | null; phone: string | null; name: string | null } | null;
    engineer: { id: number; name: string | null } | null;
    assignedInspector: { id: number; name: string | null } | null;
    location: { id: number; code: string | null; name: string | null } | null;
    site: string | null;
  } | null;
  jobService: { id: number; serviceType: string; description: string | null; status: string } | null;
  approver: { id: number; name: string | null } | null;
  reviewer: { id: number; name: string | null } | null;
  equipmentItems: TimesheetEquipmentItem[];
}

export class TimesheetService {
  private static readonly PREFIX = 'TS';
  private static readonly MIN_NUMBER = 1000;

  /**
   * Generates a unique timesheet number in format: TS-{COMPANY_PREFIX}-{YYYYMMDD}-{SEQUENCE}
   */
  static async generateTimesheetNumber(companyId: number): Promise<string> {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { prefix: true },
      });

      const prefix = (company?.prefix || 'TS').toUpperCase();
      const today = new Date();
      const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todayCount = await tx.timesheet.count({
        where: {
          companyId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      const sequence = String(todayCount + 1).padStart(4, '0');
      const timesheetNumber = `${prefix}-${datePart}-${sequence}`;

      const existing = await tx.timesheet.findUnique({
        where: { timesheetNumber },
      });

      if (existing) {
        throw new Error(`Timesheet number ${timesheetNumber} already exists`);
      }

      return timesheetNumber;
    });
  }

  /**
   * Validates that the job belongs to the company and optionally auto-fills from job data.
   */
  static async validateJob(jobId: number, companyId: number) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: {
        customer: true,
        engineer: { select: { id: true, name: true } },
        assignedInspector: { select: { id: true, name: true } },
        jobServices: {
          where: { serviceType: 'INSPECTION' },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new Error('Job does not belong to this company');
    }

    return job;
  }

  /**
   * Validates that the equipment exists and belongs to the company.
   */
  static async validateEquipment(equipmentId: number, companyId: number) {
    const equipment = await prisma.equipment.findFirst({
      where: { id: equipmentId, companyId },
      select: { id: true, name: true, category: true, make: true, model: true, serialNumber: true, code: true },
    });

    if (!equipment) {
      throw new Error('Equipment does not belong to this company');
    }

    return equipment;
  }

  /**
   * Calculates working hours including overtime.
   */
  static calculateHours(
    startTime: Date,
    endTime: Date,
    breakMinutes: number,
    travelTimeMinutes: number = 0,
    standardHours: number = 8
  ): {
    totalMinutes: number;
    netMinutes: number;
    totalWorkingHours: number;
    overtimeHours: number;
  } {
    const totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const netMinutes = totalMinutes - breakMinutes - travelTimeMinutes;
    const totalWorkingHours = Math.round((netMinutes / 60) * 100) / 100;
    const overtimeHours = Math.max(0, Math.round((Math.max(0, totalWorkingHours - standardHours)) * 100) / 100);

    return {
      totalMinutes,
      netMinutes: Math.round(netMinutes),
      totalWorkingHours,
      overtimeHours,
    };
  }

  /**
   * Creates a new timesheet entry in DRAFT status with optional equipment items.
   */
  static async create(input: CreateTimesheetInput): Promise<TimesheetWithDetails> {
    if (input.jobId) {
      await this.validateJob(input.jobId, input.companyId);
    }

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    const calc = this.calculateHours(start, end, input.breakMinutes ?? 0, input.travelTimeMinutes ?? 0);

    return await prisma.$transaction(async (tx) => {
      const timesheetNumber = await this.generateTimesheetNumber(input.companyId);

      const data: any = {
        companyId: input.companyId,
        timesheetNumber,
        timesheetType: input.timesheetType || 'INSPECTION',
        userId: input.userId,
        jobId: input.jobId || null,
        jobServiceId: input.jobServiceId || null,
        date: new Date(input.date),
        startTime: start,
        endTime: end,
        breakMinutes: input.breakMinutes ?? 0,
        travelTimeMinutes: input.travelTimeMinutes ?? 0,
        totalWorkingHours: calc.totalWorkingHours,
        overtimeHours: calc.overtimeHours,
        additionalWork: input.additionalWork || null,
        workCompletionStatus: input.workCompletionStatus || null,
        inspectionResult: input.inspectionResult || null,
        workLocation: input.workLocation || null,
        description: input.description || null,
        status: 'draft',
        equipmentItems: {
          create: input.equipmentItems?.map((item) => ({
            companyId: input.companyId,
            equipmentId: item.equipmentId || null,
            equipmentType: item.equipmentType || null,
            equipmentDescription: item.equipmentDescription || null,
            manufacturer: item.manufacturer || null,
            model: item.model || null,
            serialNumber: item.serialNumber || null,
            equipmentCode: item.equipmentCode || null,
            quantity: item.quantity ?? 1,
            inspectionResult: item.inspectionResult || null,
            inspectionDate: item.inspectionDate ? new Date(item.inspectionDate) : null,
            remarks: item.remarks || null,
            certificateStatus: item.certificateStatus || null,
            reportStatus: item.reportStatus || null,
          })) || [],
        },
      };

      const created = await tx.timesheet.create({
        data,
        include: this.includeRelations(),
      });

      await tx.auditLog.create({
        data: {
          companyId: input.companyId,
          tenantId: input.companyId,
          userId: input.userId,
          action: 'TIMESHEET_CREATED',
          entityType: 'Timesheet',
          entityId: created.id,
          newValue: { timesheetNumber: created.timesheetNumber, status: 'draft' } as any,
        },
      });

      return created;
    });
  }

  /**
   * Includes for detailed timesheet queries.
   */
  private static includeRelations() {
    return {
      user: { select: { id: true, name: true, email: true } },
      job: {
        include: {
          customer: true,
          engineer: { select: { id: true, name: true } },
          assignedInspector: { select: { id: true, name: true } },
          location: true,
        },
      },
      jobService: { select: { id: true, serviceType: true, description: true, status: true } },
      approver: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      equipmentItems: true,
    };
  }

  /**
   * Lists timesheets with filtering and pagination.
   */
  static async list(filters: TimesheetFilters) {
    const {
      companyId,
      userId,
      jobId,
      jobNumber,
      timesheetNumber,
      status,
      statuses,
      dateFrom,
      dateTo,
      engineerId,
      customerId,
      equipmentType,
      inspectionResult,
      timesheetType,
      page = 1,
      pageSize = 20,
    } = filters;

    const where: Prisma.TimesheetWhereInput = { companyId };
    if (userId) where.userId = userId;
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;
    if (statuses) where.status = { in: statuses };
    if (timesheetType) where.timesheetType = timesheetType;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timesheet.count({ where }),
    ]);

    let filteredTimesheets = timesheets;

    if (jobNumber) {
      filteredTimesheets = filteredTimesheets.filter((ts) =>
        ts.job?.jobNumber?.includes(jobNumber)
      );
    }
    if (timesheetNumber) {
      filteredTimesheets = filteredTimesheets.filter((ts) =>
        ts.timesheetNumber?.includes(timesheetNumber)
      );
    }
    if (engineerId) {
      filteredTimesheets = filteredTimesheets.filter((ts) => ts.userId === engineerId);
    }
    if (customerId) {
      filteredTimesheets = filteredTimesheets.filter((ts) =>
        ts.job?.customer?.id === customerId
      );
    }
    if (equipmentType) {
      filteredTimesheets = filteredTimesheets.filter((ts) =>
        ts.equipmentItems.some((item) => item.equipmentType === equipmentType)
      );
    }
    if (inspectionResult) {
      filteredTimesheets = filteredTimesheets.filter((ts) =>
        ts.equipmentItems.some((item) => item.inspectionResult === inspectionResult)
      );
    }

    return {
      timesheets: filteredTimesheets,
      total: filteredTimesheets.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredTimesheets.length / pageSize),
    };
  }

  /**
   * Gets a single timesheet by ID with full details.
   */
  static async getById(id: number, companyId: number): Promise<TimesheetWithDetails | null> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
      include: this.includeRelations(),
    });

    if (!ts) {
      const tsAlias = await prisma.timesheet.findFirst({
        where: { timesheetNumber: String(id), companyId },
        include: this.includeRelations(),
      });
      return tsAlias;
    }

    return ts;
  }

  /**
   * Updates a timesheet. Only DRAFT timesheets can be edited.
   */
  static async update(id: number, companyId: number, input: UpdateTimesheetInput): Promise<TimesheetWithDetails> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    if (ts.status !== 'draft' && ts.status !== 'returned') {
      throw new Error(`Cannot edit a timesheet with status "${ts.status}". Only draft or returned timesheets can be edited.`);
    }

    const updateData: any = {
      date: input.date ? new Date(input.date) : undefined,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      breakMinutes: input.breakMinutes ?? undefined,
      travelTimeMinutes: input.travelTimeMinutes ?? undefined,
      additionalWork: input.additionalWork,
      workCompletionStatus: input.workCompletionStatus ?? undefined,
      inspectionResult: input.inspectionResult ?? undefined,
      workLocation: input.workLocation,
      description: input.description,
    };

    // Recalculate hours if time fields changed
    if (input.startTime || input.endTime || input.breakMinutes !== undefined || input.travelTimeMinutes !== undefined) {
      const start = input.startTime ? new Date(input.startTime) : ts.startTime;
      const end = input.endTime ? new Date(input.endTime) : ts.endTime;
      const breakMins = input.breakMinutes ?? ts.breakMinutes;
      const travelMins = input.travelTimeMinutes ?? ts.travelTimeMinutes;

      if (end <= start) {
        throw new Error('End time must be after start time');
      }

      const calc = this.calculateHours(start, end, breakMins, travelMins);
      updateData.totalWorkingHours = calc.totalWorkingHours;
      updateData.overtimeHours = calc.overtimeHours;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id, companyId },
        data: updateData,
        include: this.includeRelations(),
      });

      if (input.equipmentItems) {
        await tx.timesheetEquipmentItem.deleteMany({
          where: { timesheetId: id, companyId },
        });
        for (const item of input.equipmentItems) {
          await tx.timesheetEquipmentItem.create({
            data: {
              companyId,
              timesheetId: id,
              equipmentId: item.equipmentId || null,
              equipmentType: item.equipmentType || null,
              equipmentDescription: item.equipmentDescription || null,
              manufacturer: item.manufacturer || null,
              model: item.model || null,
              serialNumber: item.serialNumber || null,
              equipmentCode: item.equipmentCode || null,
              quantity: item.quantity ?? 1,
              inspectionResult: item.inspectionResult || null,
              inspectionDate: item.inspectionDate ? new Date(item.inspectionDate) : null,
              remarks: item.remarks || null,
              certificateStatus: item.certificateStatus || null,
              reportStatus: item.reportStatus || null,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId: updated.userId,
          action: 'TIMESHEET_UPDATED',
          entityType: 'Timesheet',
          entityId: id,
        },
      });

      const result = await tx.timesheet.findUnique({
        where: { id, companyId },
        include: this.includeRelations(),
      });

      if (!result) {
        throw new Error('Timesheet not found after update');
      }

      return result as unknown as TimesheetWithDetails;
    });
  }

  /**
   * Submits a timesheet for review. Only DRAFT timesheets can be submitted.
   * Returns the user who owns the timesheet for the return type.
   */
  static async submit(id: number, companyId: number): Promise<TimesheetWithDetails> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    if (ts.status !== 'draft') {
      throw new Error(`Cannot submit a timesheet with status "${ts.status}". Only draft timesheets can be submitted.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id, companyId },
        data: { status: 'submitted', submittedAt: new Date() },
        include: this.includeRelations(),
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId: ts.userId,
          action: 'TIMESHEET_SUBMITTED',
          entityType: 'Timesheet',
          entityId: id,
        },
      });

      return updated;
    });
  }

  /**
   * Moves a submitted timesheet to pending_review status for operations review.
   */
  static async moveToReview(id: number, companyId: number): Promise<TimesheetWithDetails> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    if (ts.status !== 'submitted') {
      throw new Error(`Cannot move a timesheet with status "${ts.status}" to review. Only submitted timesheets can be moved to review.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id, companyId },
        data: { status: 'pending_review' },
        include: this.includeRelations(),
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId: ts.userId,
          action: 'TIMESHEET_REVIEW_PENDING',
          entityType: 'Timesheet',
          entityId: id,
        },
      });

      return updated;
    });
  }

  /**
   * Reviews a timesheet - approve or reject.
   */
  static async review(
    id: number,
    companyId: number,
    reviewerId: number,
    action: 'approve' | 'reject' | 'return',
    comments?: string
  ): Promise<TimesheetWithDetails> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    const validStatuses = ['submitted', 'pending_review'];
    if (!validStatuses.includes(ts.status)) {
      throw new Error(`Cannot review a timesheet with status "${ts.status}". Only submitted or pending_review timesheets can be reviewed.`);
    }

    if (action === 'approve' && ts.status !== 'pending_review') {
      throw new Error('Only pending_review timesheets can be approved.');
    }

    let newStatus: TimesheetStatus;
    if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else {
      newStatus = 'returned';
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id, companyId },
        data: {
          status: newStatus,
          reviewedBy: reviewerId,
          reviewComments: comments || null,
          reviewedAt: new Date(),
          ...(newStatus === 'approved'
            ? { approvedBy: reviewerId, approvedAt: new Date() }
            : {}),
        },
        include: this.includeRelations(),
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId: reviewerId,
          action: `TIMESHEET_${action.toUpperCase()}`,
          entityType: 'Timesheet',
          entityId: id,
          previousValue: { status: ts.status } as any,
          newValue: { status: newStatus, reviewedBy: reviewerId, reviewComments: comments } as any,
        },
      });

      return updated;
    });
  }

  /**
   * Approves a submitted/pending_review timesheet.
   */
  static async approve(id: number, companyId: number, approverId: number): Promise<TimesheetWithDetails> {
    return this.review(id, companyId, approverId, 'approve');
  }

  /**
   * Rejects a submitted/pending_review timesheet.
   */
  static async reject(id: number, companyId: number, reviewerId: number, reason?: string): Promise<TimesheetWithDetails> {
    return this.review(id, companyId, reviewerId, 'reject', reason);
  }

  /**
   * Returns a timesheet for correction.
   */
  static async returnForCorrection(id: number, companyId: number, reviewerId: number, reason?: string): Promise<TimesheetWithDetails> {
    return this.review(id, companyId, reviewerId, 'return', reason);
  }

  /**
   * Locks an approved timesheet (makes it immutable).
   */
  static async lock(id: number, companyId: number, userId: number): Promise<TimesheetWithDetails> {
    const ts = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    if (ts.status !== 'approved') {
      throw new Error(`Cannot lock a timesheet with status "${ts.status}". Only approved timesheets can be locked.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id, companyId },
        data: { status: 'locked' },
        include: this.includeRelations(),
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
   * Gets timesheets for a specific job.
   */
  static async getTimesheetsForJob(jobId: number, companyId: number) {
    return prisma.timesheet.findMany({
      where: { jobId, companyId },
      include: this.includeRelations(),
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Gets timesheets pending review for operations dashboard.
   */
  static async getPendingForReview(companyId: number, options?: { limit?: number; page?: number }) {
    const limit = options?.limit ?? 50;
    const page = options?.page ?? 1;

    return prisma.timesheet.findMany({
      where: {
        companyId,
        status: { in: ['submitted', 'pending_review'] },
      },
      include: this.includeRelations(),
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Gets summary statistics for dashboard cards.
   */
  static async getSummary(companyId: number) {
    const [
      total,
      draft,
      submitted,
      pendingReview,
      approved,
      returned,
      awaitingReport,
      awaitingCertificate,
      awaitingInvoice,
    ] = await Promise.all([
      prisma.timesheet.count({ where: { companyId } }),
      prisma.timesheet.count({ where: { companyId, status: 'draft' } }),
      prisma.timesheet.count({ where: { companyId, status: 'submitted' } }),
      prisma.timesheet.count({ where: { companyId, status: 'pending_review' } }),
      prisma.timesheet.count({ where: { companyId, status: 'approved' } }),
      prisma.timesheet.count({ where: { companyId, status: 'returned' } }),
      prisma.timesheet.count({
        where: {
          companyId,
          equipmentItems: {
            some: { reportStatus: { in: ['PENDING', 'NOT_GENERATED'] } },
          },
          status: { in: ['approved', 'locked'] },
        },
      }),
      prisma.timesheet.count({
        where: {
          companyId,
          equipmentItems: {
            some: { certificateStatus: { in: ['PENDING', 'NOT_APPLICABLE'] } },
          },
          status: { in: ['approved', 'locked'] },
        },
      }),
      prisma.timesheet.count({
        where: {
          companyId,
          status: { in: ['approved', 'locked'] },
          job: {
            invoices: { none: {} },
          },
        },
      }),
    ]);

    return {
      total,
      draft,
      submitted,
      pendingReview,
      approved,
      returned,
      awaitingReport,
      awaitingCertificate,
      awaitingInvoice,
    };
  }

  /**
   * Gets timesheet equipment items for a given timesheet.
   */
  static async getEquipmentItems(timesheetId: number, companyId: number) {
    const ts = await prisma.timesheet.findFirst({
      where: { id: timesheetId, companyId },
      select: { id: true },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    return prisma.timesheetEquipmentItem.findMany({
      where: { timesheetId, companyId },
      include: {
        equipment: {
          select: { id: true, name: true, category: true, make: true, model: true, serialNumber: true, code: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Adds an equipment item to a timesheet.
   */
  static async addEquipmentItem(
    timesheetId: number,
    companyId: number,
    input: TimesheetEquipmentItemInput
  ): Promise<TimesheetEquipmentItem> {
    const ts = await prisma.timesheet.findFirst({
      where: { id: timesheetId, companyId },
    });

    if (!ts) {
      throw new Error('Timesheet not found');
    }

    if (ts.status !== 'draft' && ts.status !== 'returned') {
      throw new Error(`Cannot add equipment to a timesheet with status "${ts.status}".`);
    }

    if (input.equipmentId) {
      await this.validateEquipment(input.equipmentId, companyId);
    }

    return prisma.timesheetEquipmentItem.create({
      data: {
        companyId,
        timesheetId,
        equipmentId: input.equipmentId || null,
        equipmentType: input.equipmentType || null,
        equipmentDescription: input.equipmentDescription || null,
        manufacturer: input.manufacturer || null,
        model: input.model || null,
        serialNumber: input.serialNumber || null,
        equipmentCode: input.equipmentCode || null,
        quantity: input.quantity ?? 1,
        inspectionResult: input.inspectionResult || null,
        inspectionDate: input.inspectionDate ? new Date(input.inspectionDate) : null,
        remarks: input.remarks || null,
        certificateStatus: input.certificateStatus || null,
        reportStatus: input.reportStatus || null,
      },
      include: { equipment: true },
    });
  }

  /**
   * Updates an equipment item.
   */
  static async updateEquipmentItem(
    equipmentItemId: number,
    companyId: number,
    input: TimesheetEquipmentItemInput
  ): Promise<TimesheetEquipmentItem> {
    const item = await prisma.timesheetEquipmentItem.findFirst({
      where: { id: equipmentItemId, companyId },
      include: { timesheet: true },
    });

    if (!item) {
      throw new Error('Equipment item not found');
    }

    if (item.timesheet.status !== 'draft' && item.timesheet.status !== 'returned') {
      throw new Error(`Cannot edit equipment on a timesheet with status "${item.timesheet.status}".`);
    }

    if (input.equipmentId) {
      await this.validateEquipment(input.equipmentId, companyId);
    }

    return prisma.timesheetEquipmentItem.update({
      where: { id: equipmentItemId },
      data: {
        equipmentId: input.equipmentId || null,
        equipmentType: input.equipmentType ?? undefined,
        equipmentDescription: input.equipmentDescription ?? undefined,
        manufacturer: input.manufacturer ?? undefined,
        model: input.model ?? undefined,
        serialNumber: input.serialNumber ?? undefined,
        equipmentCode: input.equipmentCode ?? undefined,
        quantity: input.quantity ?? undefined,
        inspectionResult: input.inspectionResult ?? undefined,
        inspectionDate: input.inspectionDate ? new Date(input.inspectionDate) : undefined,
        remarks: input.remarks ?? undefined,
        certificateStatus: input.certificateStatus ?? undefined,
        reportStatus: input.reportStatus ?? undefined,
      },
      include: { equipment: true },
    });
  }

  /**
   * Deletes an equipment item from a timesheet.
   */
  static async deleteEquipmentItem(itemId: number, companyId: number): Promise<void> {
    const item = await prisma.timesheetEquipmentItem.findFirst({
      where: { id: itemId, companyId },
      include: { timesheet: true },
    });

    if (!item) {
      throw new Error('Equipment item not found');
    }

    if (item.timesheet.status !== 'draft' && item.timesheet.status !== 'returned') {
      throw new Error(`Cannot delete equipment on a timesheet with status "${item.timesheet.status}".`);
    }

    await prisma.timesheetEquipmentItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Checks if a job already has a timesheet for a given date and engineer.
   * Used for duplicate prevention.
   */
  static async checkDuplicate(
    jobId: number,
    userId: number,
    companyId: number,
    date: Date
  ): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.timesheet.findFirst({
      where: {
        companyId,
        jobId,
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    return !!existing;
  }

  /**
   * Gets all timesheet numbers for an inspection report (linked by job).
   */
  static async getTimesheetNumbersForJob(jobId: number, companyId: number): Promise<string[]> {
    const timesheets = await prisma.timesheet.findMany({
      where: { jobId, companyId },
      select: { timesheetNumber: true },
      orderBy: { createdAt: 'desc' },
    });

    return timesheets.map((ts) => ts.timesheetNumber);
  }
}

import { prisma } from '@/lib/prisma';
import type { JobServiceType } from '@prisma/client';
import { JobNumberService } from './job-number.service';
import { validateLocationAccreditation } from '@/lib/validation/location-accreditation';

export interface JobServiceLineInput {
  serviceType: 'TRAINING' | 'INSPECTION';
  serviceCode?: string;
  description?: string;
  requestedDate?: Date;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  assignedResponsibleId?: number;
  courseId?: number;
  trainerId?: number;
  traineeIds?: number[];
  inspectionType?: string;
  equipmentAsset?: string;
  inspectorId?: number;
}

export interface CreateJobInput {
  companyId: number;
  customerId: number;
  jobNumber?: string;
  locationId?: number;
  customerReference?: string;
  quotationId?: string;
  priority?: string;
  site?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  scheduledDate?: Date;
  engineerId?: number;
  inspectorId?: number;
  assets?: any;
  notes?: string;
  scope?: string;
  internalRemarks?: string;
  services?: JobServiceLineInput[];
}

export interface JobWithDetails {
  id: number;
  companyId: number;
  customerId: number;
  jobNumber: string;
  type: string | null;
  status: string;
  scheduledDate: Date | null;
  locationId: number | null;
  jobServices: Array<{
    id: number;
    jobId: number;
    serviceType: JobServiceType;
    serviceCode: string | null;
    description: string | null;
    status: string;
    requestedDate: Date | null;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    assignedResponsibleId: number | null;
    completionDate: Date | null;
    inspection: {
      id: number;
      inspectionType: string | null;
      equipmentAsset: string | null;
      date: Date | null;
      status: string | null;
      approvalStatus: string | null;
    } | null;
    trainingSession: {
      id: number;
      courseId: number | null;
      trainerId: number | null;
      startDate: Date;
      endDate: Date;
      status: string;
    } | null;
  }>;
  customer: { id: number; contact: string | null; email: string | null; phone: string | null } | null;
  engineer: { id: number; name: string } | null;
  assignedInspector: { id: number; name: string } | null;
  location: { id: number; code: string; name: string } | null;
  certificates: { id: number; number: string; status: string; certificateType: string | null }[];
  createdAt: Date;
  updatedAt: Date;
}

export class JobService {
  static async createJob(input: CreateJobInput): Promise<JobWithDetails> {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: input.customerId, companyId: input.companyId },
        select: { id: true },
      });
      if (!customer) {
        throw new Error('Customer does not belong to this company');
      }

      let accreditationValid = true;
      let location: { code: string; name: string } | null = null;
      if (input.locationId) {
        const loc = await tx.location.findFirst({
          where: { id: input.locationId, companyId: input.companyId },
          select: { code: true, name: true },
        });
        if (!loc) {
          throw new Error('Location not found for this company');
        }
        location = loc;

        const accreditationId = input.locationId
          ? (await tx.locationAccreditation.findFirst({
              where: { locationId: input.locationId, companyId: input.companyId },
              select: { accreditation: { select: { code: true } } },
            }))?.accreditation?.code
          : undefined;

        const validation = validateLocationAccreditation(loc.code, accreditationId);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        if (accreditationId) {
          const locAccred = await tx.locationAccreditation.findFirst({
            where: { locationId: input.locationId, accreditation: { code: accreditationId }, companyId: input.companyId },
            select: { status: true },
          });
          if (locAccred?.status && locAccred.status !== 'VERIFIED') {
            accreditationValid = false;
          }
        }
      }

      let jobNumber = input.jobNumber;
      if (!jobNumber) {
        jobNumber = await JobNumberService.generateJobNumber(input.companyId, tx);
      } else {
        const isValid = await JobNumberService.validateJobNumber(jobNumber, input.companyId, tx);
        if (!isValid) {
          throw new Error(`Job number ${jobNumber} already exists`);
        }
      }

      const jobData: any = {
        companyId: input.companyId,
        customerId: input.customerId,
        jobNumber,
        locationId: input.locationId || null,
        customerReference: input.customerReference || null,
        quotationId: input.quotationId || null,
        priority: input.priority || null,
        site: input.site || null,
        contactName: input.contactName || null,
        contactPhone: input.contactPhone || null,
        contactEmail: input.contactEmail || null,
        scheduledDate: input.scheduledDate || null,
        engineerId: input.engineerId || null,
        inspectorId: input.inspectorId || null,
        assets: input.assets || undefined,
        scope: input.scope || null,
        internalRemarks: input.internalRemarks || null,
        notes: input.notes || null,
        type: (input.services?.map((s) => s.serviceType).join('|')) || null,
      };

      const job = await tx.job.create({ data: jobData });

      const jobServices: JobWithDetails['jobServices'] = [];
      if (input.services && input.services.length > 0) {
        const seenTypes = new Set<string>();
        for (const svc of input.services) {
          if (seenTypes.has(svc.serviceType)) {
            throw new Error(`Duplicate service type ${svc.serviceType} for one job`);
          }
          seenTypes.add(svc.serviceType);

          const js = await tx.jobService.create({
            data: {
              companyId: input.companyId,
              jobId: job.id,
              serviceType: svc.serviceType as JobServiceType,
              serviceCode: svc.serviceCode || null,
              description: svc.description || null,
              status: 'PLANNED',
              requestedDate: svc.requestedDate || null,
              scheduledStart: svc.scheduledStart || null,
              scheduledEnd: svc.scheduledEnd || null,
              assignedResponsibleId: svc.assignedResponsibleId || null,
            },
          });

          if (svc.serviceType === 'TRAINING' && svc.courseId) {
            const course = await tx.trainingCourse.findFirst({
              where: { id: svc.courseId, companyId: input.companyId },
              select: { id: true },
            });
            if (!course) {
              throw new Error('Training course does not belong to this company');
            }
            const session = await tx.trainingSession.create({
              data: {
                companyId: input.companyId,
                jobId: job.id,
                jobServiceId: js.id,
                trainingId: undefined,
                courseId: svc.courseId,
                trainerId: svc.trainerId || null,
                startDate: svc.scheduledStart || new Date(),
                endDate: svc.scheduledEnd || new Date(),
                status: 'DRAFT',
              },
            });
            if (svc.trainerId) {
              const trainer = await tx.trainer.findFirst({
                where: { userId: svc.trainerId, companyId: input.companyId },
                select: { id: true },
              });
              if (trainer) {
                await tx.trainingSession.update({
                  where: { id: session.id },
                  data: { trainerId: trainer.id },
                });
              }
            }
            if (svc.traineeIds && svc.traineeIds.length > 0) {
              for (const tid of svc.traineeIds) {
                const trainee = await tx.trainee.findFirst({
                  where: { id: tid, companyId: input.companyId },
                  select: { id: true },
                });
                if (!trainee) {
                  throw new Error('Trainee does not belong to this company');
                }
                await tx.sessionEnrollment.create({
                  data: {
                    companyId: input.companyId,
                    sessionId: session.id,
                    traineeId: tid,
                    status: 'ENROLLED',
                  },
                });
              }
              await tx.trainingSession.update({
                where: { id: session.id },
                data: { enrolledCount: svc.traineeIds.length },
              });
            }
            jobServices.push({
              id: js.id,
              jobId: js.jobId,
              serviceType: js.serviceType,
              serviceCode: js.serviceCode,
              description: js.description,
              status: js.status,
              requestedDate: js.requestedDate,
              scheduledStart: js.scheduledStart,
              scheduledEnd: js.scheduledEnd,
              assignedResponsibleId: js.assignedResponsibleId,
              completionDate: js.completionDate,
              inspection: null,
              trainingSession: {
                id: session.id,
                courseId: session.courseId,
                trainerId: session.trainerId,
                startDate: session.startDate,
                endDate: session.endDate,
                status: session.status,
              },
            });
            continue;
          }

          if (svc.serviceType === 'INSPECTION') {
            const inspection = await tx.inspection.create({
              data: {
                companyId: input.companyId,
                jobId: job.id,
                jobServiceId: js.id,
                inspectorId: svc.inspectorId || input.inspectorId || null,
                inspectionType: svc.inspectionType || null,
                equipmentAsset: svc.equipmentAsset || null,
                date: svc.scheduledStart || null,
                status: 'PLANNED',
                approvalStatus: accreditationValid ? undefined : 'PENDING_ACCREDITATION',
              },
            });
            jobServices.push({
              id: js.id,
              jobId: js.jobId,
              serviceType: js.serviceType,
              serviceCode: js.serviceCode,
              description: js.description,
              status: js.status,
              requestedDate: js.requestedDate,
              scheduledStart: js.scheduledStart,
              scheduledEnd: js.scheduledEnd,
              assignedResponsibleId: js.assignedResponsibleId,
              completionDate: js.completionDate,
              inspection: {
                id: inspection.id,
                inspectionType: inspection.inspectionType,
                equipmentAsset: inspection.equipmentAsset,
                date: inspection.date,
                status: inspection.status,
                approvalStatus: inspection.approvalStatus,
              },
              trainingSession: null,
            });
            continue;
          }

          jobServices.push({
            id: js.id,
            jobId: js.jobId,
            serviceType: js.serviceType,
            serviceCode: js.serviceCode,
            description: js.description,
            status: js.status,
            requestedDate: js.requestedDate,
            scheduledStart: js.scheduledStart,
            scheduledEnd: js.scheduledEnd,
            assignedResponsibleId: js.assignedResponsibleId,
            completionDate: js.completionDate,
            inspection: null,
            trainingSession: null,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          companyId: input.companyId,
          userId: input.engineerId || input.inspectorId || 0,
          action: 'JOB_CREATED',
          entityType: 'Job',
          entityId: job.id,
          tenantId: input.companyId,
          newValue: { jobNumber, serviceCount: jobServices.length } as any,
        },
      });

      return {
        id: job.id,
        companyId: job.companyId,
        customerId: job.customerId,
        jobNumber: job.jobNumber,
        type: job.type,
        status: job.status,
        scheduledDate: job.scheduledDate,
        locationId: job.locationId,
        customer: null,
        engineer: job.engineerId
          ? await tx.user.findUnique({ where: { id: job.engineerId }, select: { id: true, name: true } }).catch(() => null)
          : null,
        assignedInspector: job.inspectorId
          ? await tx.user.findUnique({ where: { id: job.inspectorId }, select: { id: true, name: true } }).catch(() => null)
          : null,
        location: input.locationId
          ? await tx.location.findUnique({ where: { id: input.locationId, companyId: input.companyId }, select: { id: true, code: true, name: true } }).catch(() => null)
          : null,
        certificates: [],
        jobServices,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };
    });
  }

  static async getJobById(id: number, companyId: number) {
    return prisma.job.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        engineer: true,
        assignedInspector: true,
        location: true,
        jobServices: {
          orderBy: { serviceType: 'asc' },
          include: {
            inspections: true,
            trainingSessions: true,
          },
        },
        certificates: {
          orderBy: { sequence: 'asc' },
        },
        inspections: true,
        trainingSessions: true,
        timesheets: true,
        payments: { include: { invoices: true } },
        inspectionReports: true,
        failureWorkflows: true,
      },
    });
  }

  static async listJobs(companyId: number, options?: {
    status?: string;
    customerId?: number;
    engineerId?: number;
    serviceType?: string;
    jobNumber?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, customerId, engineerId, serviceType, jobNumber, search, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (engineerId) where.engineerId = engineerId;
    if (jobNumber) {
      where.jobNumber = { contains: jobNumber, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { scope: { contains: search, mode: 'insensitive' } },
        { customerReference: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (serviceType) {
      where.jobServices = { some: { serviceType: serviceType as any } };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: true,
          engineer: true,
          _count: {
            select: {
              certificates: true,
              inspections: true,
              trainingSessions: true,
              jobServices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateJob(id: number, companyId: number, data: Partial<CreateJobInput & { status: string }>) {
    return prisma.job.update({
      where: { id, companyId },
      data: {
        customerId: data.customerId,
        locationId: data.locationId,
        customerReference: data.customerReference,
        quotationId: data.quotationId,
        priority: data.priority,
        site: data.site,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        scheduledDate: data.scheduledDate,
        engineerId: data.engineerId,
        inspectorId: data.inspectorId,
        assets: data.assets,
        scope: data.scope,
        internalRemarks: data.internalRemarks,
        notes: data.notes,
        ...(data.status ? { status: data.status } : {}),
      },
    });
  }

  static async deleteJob(id: number, companyId: number) {
    return prisma.job.delete({
      where: { id, companyId },
    });
  }

  static async getJobServices(jobId: number, companyId: number) {
    const services = await prisma.jobService.findMany({
      where: { jobId, companyId },
      orderBy: { serviceType: 'asc' },
      include: {
        inspections: true,
        trainingSessions: { include: { course: true, trainer: true } },
      },
    });
    return services.map((js) => ({
      ...js,
      inspection: js.inspections[0] ?? null,
      trainingSession: js.trainingSessions[0] ?? null,
    }));
  }

  static async createJobService(jobId: number, companyId: number, data: JobServiceLineInput) {
    const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) throw new Error('Job not found');

    return await prisma.$transaction(async (tx) => {
      const js = await tx.jobService.create({
        data: {
          companyId,
          jobId,
          serviceType: data.serviceType as JobServiceType,
          serviceCode: data.serviceCode || null,
          description: data.description || null,
          status: 'PLANNED',
          requestedDate: data.requestedDate || null,
          scheduledStart: data.scheduledStart || null,
          scheduledEnd: data.scheduledEnd || null,
          assignedResponsibleId: data.assignedResponsibleId || null,
        },
      });

      if (data.serviceType === 'TRAINING' && data.courseId) {
        const session = await tx.trainingSession.create({
          data: {
            companyId,
            jobId,
            jobServiceId: js.id,
            courseId: data.courseId,
            trainerId: data.trainerId || null,
            startDate: data.scheduledStart || new Date(),
            endDate: data.scheduledEnd || new Date(),
            status: 'DRAFT',
          },
        });
        return { ...js, serviceType: 'TRAINING', trainingSession: session } as any;
      }

      if (data.serviceType === 'INSPECTION') {
        const inspection = await tx.inspection.create({
          data: {
            companyId,
            jobId,
            jobServiceId: js.id,
            inspectorId: data.inspectorId || null,
            inspectionType: data.inspectionType || null,
            equipmentAsset: data.equipmentAsset || null,
            date: data.scheduledStart || null,
            status: 'PLANNED',
          },
        });
        return { ...js, serviceType: 'INSPECTION', inspection } as any;
      }

      return js;
    });
  }

  // â”€â”€ Status transition state machine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Defines which status transitions are permitted and the roles allowed
  // to perform each action. Prevents invalid lifecycle jumps.
  private static readonly TRANSITIONS: Record<string, string[]> = {
    NEW: ['SCHEDULED', 'CANCELLED', 'ON_HOLD'],
    PENDING: ['SCHEDULED', 'CANCELLED', 'ON_HOLD'],
    SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'ON_HOLD', 'NEW'],
    IN_PROGRESS: ['COMPLETED', 'PENDING_APPROVAL', 'ON_HOLD', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'IN_PROGRESS', 'CANCELLED'],
    APPROVED: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    ON_HOLD: ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
  };

  private static readonly ACTION_ROLES: Record<string, string[]> = {
    ASSIGN: ['ADMIN', 'MANAGER', 'COORDINATOR', 'SUPERVISOR'],
    RESCHEDULE: ['ADMIN', 'MANAGER', 'COORDINATOR', 'SUPERVISOR'],
    START: ['ADMIN', 'MANAGER', 'INSPECTOR', 'ENGINEER', 'TRAINER', 'SUPERVISOR'],
    SUBMIT_FOR_APPROVAL: ['ADMIN', 'MANAGER', 'INSPECTOR', 'ENGINEER', 'TRAINER', 'SUPERVISOR'],
    APPROVE: ['ADMIN', 'MANAGER', 'REVIEWER', 'APPROVER'],
    COMPLETE: ['ADMIN', 'MANAGER', 'INSPECTOR', 'ENGINEER', 'TRAINER', 'SUPERVISOR'],
    GENERATE_CERTIFICATE: ['ADMIN', 'MANAGER', 'REVIEWER', 'APPROVER'],
    CONFIRM_DELIVERY: ['ADMIN', 'MANAGER', 'COORDINATOR'],
    CANCEL: ['ADMIN', 'MANAGER'],
  };

  static canTransition(from: string, to: string): boolean {
    const allowed = this.TRANSITIONS[from?.toUpperCase()] ?? [];
    return allowed.includes(to?.toUpperCase());
  }

  static canRolePerform(action: string, role?: string | null): boolean {
    const allowed = this.ACTION_ROLES[action] ?? [];
    if (!role) return false;
    return allowed.includes(role.toUpperCase());
  }

  static async transitionJob(
    jobId: number,
    companyId: number,
    userId: number,
    userRole: string | null,
    action: string,
    payload: { targetStatus?: string; reason?: string; engineerId?: number; inspectorId?: number; scheduledDate?: string; rescheduledBy?: number } = {}
  ) {
    return prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: { id: jobId, companyId },
        select: { id: true, status: true, jobNumber: true, certificates: { select: { id: true } } },
      });
      if (!job) throw new Error('Job not found');

      const current = (job.status || 'NEW').toUpperCase();

      switch (action.toUpperCase()) {
        case 'ASSIGN': {
          if (!this.canRolePerform('ASSIGN', userRole)) {
            throw new Error('Your role is not authorized to assign personnel.');
          }
          const data: any = {};
          if (payload.engineerId !== undefined) data.engineerId = payload.engineerId;
          if (payload.inspectorId !== undefined) data.inspectorId = payload.inspectorId;
          if (payload.scheduledDate) data.scheduledDate = new Date(payload.scheduledDate);
          // Assignment moves a NEW job to SCHEDULED
          if (current === 'NEW' || current === 'PENDING') data.status = 'SCHEDULED';
          const updated = await tx.job.update({ where: { id: jobId }, data });
          await tx.auditLog.create({
            data: { companyId, userId, action: 'JOB_ASSIGNED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { engineerId: payload.engineerId, inspectorId: payload.inspectorId } as any },
          });
          return updated;
        }

        case 'RESCHEDULE': {
          if (!this.canRolePerform('RESCHEDULE', userRole)) {
            throw new Error('Your role is not authorized to reschedule.');
          }
          if (!payload.scheduledDate) throw new Error('Reschedule requires a new scheduled date.');
          const previousDate = await tx.job.findUnique({ where: { id: jobId }, select: { scheduledDate: true } });
          const updated = await tx.job.update({
            where: { id: jobId },
            data: { scheduledDate: new Date(payload.scheduledDate), status: current === 'NEW' || current === 'PENDING' ? 'SCHEDULED' : undefined },
          });
          // Record an auditable reschedule entry
          await tx.reschedule.create({
            data: {
              companyId,
              jobId,
              reason: payload.reason || null,
              suggestedDate: new Date(payload.scheduledDate),
              approvedDate: new Date(payload.scheduledDate),
              rescheduledBy: userId,
              status: 'approved',
            },
          });
          await tx.auditLog.create({
            data: { companyId, userId, action: 'JOB_RESCHEDULED', entityType: 'Job', entityId: jobId, tenantId: companyId, previousValue: { scheduledDate: previousDate?.scheduledDate }, newValue: { scheduledDate: payload.scheduledDate, reason: payload.reason } as any },
          });
          return updated;
        }

        case 'START': {
          if (!this.canRolePerform('START', userRole)) {
            throw new Error('Your role is not authorized to start this job.');
          }
          if (!this.canTransition(current, 'IN_PROGRESS')) {
            throw new Error(`Cannot start a job in "${current}" status. Valid next states: ${(this.TRANSITIONS[current] ?? []).join(', ') || 'none'}.`);
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'IN_PROGRESS' } });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_STARTED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'IN_PROGRESS' } as any } });
          return updated;
        }

        case 'SUBMIT_FOR_APPROVAL': {
          if (!this.canRolePerform('SUBMIT_FOR_APPROVAL', userRole)) {
            throw new Error('Your role is not authorized to submit for approval.');
          }
          if (!this.canTransition(current, 'PENDING_APPROVAL')) {
            throw new Error(`Cannot submit a job in "${current}" status for approval. Complete the service work first.`);
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'PENDING_APPROVAL' } });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_SUBMITTED_FOR_APPROVAL', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'PENDING_APPROVAL' } as any } });
          return updated;
        }

        case 'APPROVE': {
          if (!this.canRolePerform('APPROVE', userRole)) {
            throw new Error('Your role is not authorized to approve. Approval requires ADMIN, MANAGER, REVIEWER or APPROVER.');
          }
          if (!this.canTransition(current, 'APPROVED')) {
            throw new Error(`Cannot approve a job in "${current}" status. Only jobs pending approval can be approved.`);
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'APPROVED' } });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_APPROVED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'APPROVED' } as any } });
          return updated;
        }

        case 'COMPLETE': {
          if (!this.canRolePerform('COMPLETE', userRole)) {
            throw new Error('Your role is not authorized to complete this job.');
          }
          if (!this.canTransition(current, 'COMPLETED')) {
            throw new Error(`Cannot complete a job in "${current}" status. Valid next states: ${(this.TRANSITIONS[current] ?? []).join(', ') || 'none'}.`);
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'COMPLETED' } });
          // Mark all service lines completed
          await tx.jobService.updateMany({
            where: { jobId, status: { not: 'COMPLETED' } },
            data: { status: 'COMPLETED', completionDate: new Date() },
          });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_COMPLETED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'COMPLETED' } as any } });
          return updated;
        }

        case 'GENERATE_CERTIFICATE': {
          if (!this.canRolePerform('GENERATE_CERTIFICATE', userRole)) {
            throw new Error('Your role is not authorized to generate certificates.');
          }
          if (current !== 'COMPLETED' && current !== 'APPROVED') {
            throw new Error(`Certificates can only be generated for completed/approved jobs. Current status: "${current}". Complete and approve the job first.`);
          }
          // Certificate issuance is delegated to the certificates API which enforces
          // eligibility, numbering and QR rules. Here we only guard the prerequisite.
          return job;
        }

        case 'CONFIRM_DELIVERY': {
          if (!this.canRolePerform('CONFIRM_DELIVERY', userRole)) {
            throw new Error('Your role is not authorized to confirm delivery.');
          }
          if (current !== 'COMPLETED' && current !== 'APPROVED') {
            throw new Error(`Delivery can only be confirmed for completed/approved jobs. Current status: "${current}".`);
          }
          if (job.certificates.length === 0) {
            throw new Error('No certificate has been issued for this job. Generate a certificate before confirming delivery.');
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'DELIVERED' } });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_DELIVERY_CONFIRMED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'DELIVERED' } as any } });
          return updated;
        }

        case 'CANCEL': {
          if (!this.canRolePerform('CANCEL', userRole)) {
            throw new Error('Your role is not authorized to cancel jobs.');
          }
          if (!this.canTransition(current, 'CANCELLED')) {
            throw new Error(`Cannot cancel a job in "${current}" status.`);
          }
          const updated = await tx.job.update({ where: { id: jobId }, data: { status: 'CANCELLED', cancelReason: payload.reason || null } });
          await tx.auditLog.create({ data: { companyId, userId, action: 'JOB_CANCELLED', entityType: 'Job', entityId: jobId, tenantId: companyId, newValue: { status: 'CANCELLED', reason: payload.reason } as any } });
          return updated;
        }

        default:
          throw new Error(`Unknown action "${action}".`);
      }
    });
  }
}




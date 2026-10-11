import { PrismaClient, JobServiceType } from '@prisma/client';
import { JobNumberService } from './job-number.service';
import { validateLocationAccreditation } from '@/lib/validation/location-accreditation';

const prisma = new PrismaClient();

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
    page?: number;
    limit?: number;
  }) {
    const { status, customerId, engineerId, serviceType, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (engineerId) where.engineerId = engineerId;

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
}

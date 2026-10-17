import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface CreateInspectionReportInput {
  companyId: number;
  jobId: number;
  inspectionId: number;
  templateId?: number;
  title: string;
  generatedBy?: number;
  content?: Prisma.InputJsonValue;
  findings?: Prisma.InputJsonValue;
  recommendations?: Prisma.InputJsonValue;
}

export interface UpdateInspectionReportInput {
  title?: string;
  content?: Prisma.InputJsonValue;
  findings?: Prisma.InputJsonValue;
  recommendations?: Prisma.InputJsonValue;
  status?: string;
  templateId?: number;
  reviewedBy?: number;
  approvedBy?: number;
}

export interface CreateReportTemplateInput {
  companyId: number;
  name: string;
  description?: string;
  type: string;
  content: Prisma.InputJsonValue;
  isDefault?: boolean;
  createdBy?: number;
}

export interface CreateFailureWorkflowInput {
  companyId: number;
  reportId: number;
  jobId: number;
  type: string;
  title: string;
  description?: string;
  priority?: string;
  assignedTo?: number;
  dueDate?: Date;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
}

export interface CreateFailureWorkflowStepInput {
  companyId: number;
  workflowId: number;
  stepNumber: number;
  title: string;
  description?: string;
  assignedTo?: number;
}

export interface AddSignatureInput {
  companyId: number;
  reportId: number;
  userId: number;
  role: string;
  signatureData: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export class InspectionReportService {
  private static readonly REPORT_PREFIX = 'IR-';
  private static readonly MIN_REPORT_NUMBER = 100000;

  static async generateReportNumber(companyId: number): Promise<string> {
    return await prisma.$transaction(async (tx) => {
      const lastReport = await tx.inspectionReport.findFirst({
        where: { companyId },
        orderBy: { id: 'desc' },
        select: { reportNumber: true },
      });

      let nextNumber = this.MIN_REPORT_NUMBER;

      if (lastReport?.reportNumber) {
        const match = lastReport.reportNumber.match(/^IR-(\d+)$/);
        if (match) {
          nextNumber = Math.max(parseInt(match[1], 10) + 1, this.MIN_REPORT_NUMBER);
        }
      }

      const reportNumber = `${this.REPORT_PREFIX}${nextNumber}`;

      const existing = await tx.inspectionReport.findUnique({
        where: { reportNumber },
      });

      if (existing) {
        throw new Error(`Report number ${reportNumber} already exists`);
      }

      return reportNumber;
    });
  }

  static async createInspectionReport(input: CreateInspectionReportInput) {
    const reportNumber = await this.generateReportNumber(input.companyId);

    const report = await prisma.inspectionReport.create({
      data: {
        companyId: input.companyId,
        jobId: input.jobId,
        inspectionId: input.inspectionId,
        templateId: input.templateId,
        reportNumber,
        title: input.title,
        generatedBy: input.generatedBy,
        content: input.content,
        findings: input.findings,
        recommendations: input.recommendations,
        status: 'draft',
      },
      include: {
        job: { include: { customer: true } },
        inspection: true,
        template: true,
        generator: true,
      },
    });

    return report;
  }

  static async getReportById(id: number, companyId: number) {
    return prisma.inspectionReport.findFirst({
      where: { id, companyId },
      include: {
        job: { include: { customer: true } },
        inspection: true,
        template: true,
        generator: true,
        reviewer: true,
        approver: true,
        signer: true,
        signatures: {
          include: { user: true },
          orderBy: { signedAt: 'asc' },
        },
        failureWorkflows: {
          include: {
            assignee: true,
            resolver: true,
            steps: {
              include: { assignee: true, completer: true },
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });
  }

  static async getReportByNumber(reportNumber: string, companyId: number) {
    return prisma.inspectionReport.findFirst({
      where: { reportNumber, companyId },
      include: {
        job: { include: { customer: true } },
        inspection: true,
        template: true,
        generator: true,
        reviewer: true,
        approver: true,
        signer: true,
        signatures: {
          include: { user: true },
          orderBy: { signedAt: 'asc' },
        },
      },
    });
  }

  static async listReports(companyId: number, options?: {
    jobId?: number;
    inspectionId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { jobId, inspectionId, status, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (jobId) where.jobId = jobId;
    if (inspectionId) where.inspectionId = inspectionId;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.inspectionReport.findMany({
        where,
        include: {
          job: { include: { customer: true } },
          inspection: true,
          template: true,
          generator: true,
          reviewer: true,
          approver: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inspectionReport.count({ where }),
    ]);

    return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateReport(id: number, companyId: number, input: UpdateInspectionReportInput) {
    return prisma.inspectionReport.update({
      where: { id, companyId },
      data: input,
      include: {
        job: { include: { customer: true } },
        inspection: true,
        template: true,
        generator: true,
        reviewer: true,
        approver: true,
        signer: true,
      },
    });
  }

  static async deleteReport(id: number, companyId: number) {
    return prisma.inspectionReport.delete({
      where: { id, companyId },
    });
  }

  static async generateReportFromTemplate(templateId: number, companyId: number, jobId: number, inspectionId: number, generatedBy?: number) {
    const template = await prisma.inspectionReportTemplate.findFirst({
      where: { id: templateId, companyId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const inspection = await prisma.inspection.findFirst({
      where: { id: inspectionId, companyId },
      include: { job: { include: { customer: true } } },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    const report = await this.createInspectionReport({
      companyId,
      jobId,
      inspectionId,
      templateId,
      title: `${template.name} - ${inspection.job.jobNumber}`,
      generatedBy,
      content: template.content as Prisma.InputJsonValue,
    });

    return report;
  }

  static async submitForReview(id: number, companyId: number, reviewedBy: number) {
    return prisma.inspectionReport.update({
      where: { id, companyId },
      data: {
        status: 'under_review',
        reviewedBy,
      },
      include: { reviewer: true },
    });
  }

  static async approveReport(id: number, companyId: number, approvedBy: number) {
    return prisma.inspectionReport.update({
      where: { id, companyId },
      data: {
        status: 'approved',
        approvedBy,
      },
      include: { approver: true },
    });
  }

  static async rejectReport(id: number, companyId: number, reviewedBy: number) {
    return prisma.inspectionReport.update({
      where: { id, companyId },
      data: {
        status: 'rejected',
        reviewedBy,
      },
      include: { reviewer: true },
    });
  }

  static async addSignature(input: AddSignatureInput) {
    const report = await prisma.inspectionReport.findFirst({
      where: { id: input.reportId, companyId: input.companyId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const signature = await prisma.inspectionReportSignature.create({
      data: {
        companyId: input.companyId,
        reportId: input.reportId,
        userId: input.userId,
        role: input.role,
        signatureData: input.signatureData,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
      include: { user: true },
    });

    const signatures = await prisma.inspectionReportSignature.findMany({
      where: { reportId: input.reportId },
    });

    const requiredRoles = ['inspector', 'reviewer', 'approver'];
    const signedRoles = signatures.map(s => s.role);
    const allSigned = requiredRoles.every(role => signedRoles.includes(role));

    if (allSigned && report.status === 'approved') {
      const signatureData = signatures.map(s => {
        const { user, ...rest } = s as any;
        return rest;
      });

      await prisma.inspectionReport.update({
        where: { id: input.reportId },
        data: {
          status: 'signed',
          signedAt: new Date(),
          signedBy: input.userId,
          signatureData: { signatures: signatureData } as Prisma.InputJsonValue,
        },
      });
    }

    return signature;
  }

  static async getSignatures(reportId: number, companyId: number) {
    return prisma.inspectionReportSignature.findMany({
      where: { reportId, companyId },
      include: { user: true },
      orderBy: { signedAt: 'asc' },
    });
  }

  static async createTemplate(input: CreateReportTemplateInput) {
    if (input.isDefault) {
      await prisma.inspectionReportTemplate.updateMany({
        where: { companyId: input.companyId, type: input.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.inspectionReportTemplate.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        type: input.type,
        content: input.content,
        isDefault: input.isDefault ?? false,
        createdBy: input.createdBy,
      },
      include: { creator: true },
    });
  }

  static async getTemplates(companyId: number, type?: string) {
    return prisma.inspectionReportTemplate.findMany({
      where: {
        companyId,
        isActive: true,
        ...(type ? { type } : {}),
      },
      include: { creator: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  static async getTemplateById(id: number, companyId: number) {
    return prisma.inspectionReportTemplate.findFirst({
      where: { id, companyId },
      include: { creator: true },
    });
  }

  static async updateTemplate(id: number, companyId: number, data: Partial<CreateReportTemplateInput>) {
    if (data.isDefault) {
      const template = await prisma.inspectionReportTemplate.findFirst({
        where: { id, companyId },
      });
      if (template) {
        await prisma.inspectionReportTemplate.updateMany({
          where: { companyId, type: template.type, isDefault: true },
          data: { isDefault: false },
        });
      }
    }

    return prisma.inspectionReportTemplate.update({
      where: { id, companyId },
      data,
      include: { creator: true },
    });
  }

  static async deleteTemplate(id: number, companyId: number) {
    return prisma.inspectionReportTemplate.delete({
      where: { id, companyId },
    });
  }

  static async createFailureWorkflow(input: CreateFailureWorkflowInput) {
    const workflow = await prisma.failureWorkflow.create({
      data: {
        companyId: input.companyId,
        reportId: input.reportId,
        jobId: input.jobId,
        type: input.type,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'medium',
        assignedTo: input.assignedTo,
        dueDate: input.dueDate,
        rootCause: input.rootCause,
        correctiveAction: input.correctiveAction,
        preventiveAction: input.preventiveAction,
        status: 'open',
      },
      include: {
        assignee: true,
        job: { include: { customer: true } },
      },
    });

    await prisma.inspectionReport.update({
      where: { id: input.reportId },
      data: { status: 'failure_workflow' },
    });

    return workflow;
  }

  static async getFailureWorkflowById(id: number, companyId: number) {
    return prisma.failureWorkflow.findFirst({
      where: { id, companyId },
      include: {
        job: { include: { customer: true } },
        report: { include: { inspection: true } },
        assignee: true,
        resolver: true,
        steps: {
          include: { assignee: true, completer: true },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  static async listFailureWorkflows(companyId: number, options?: {
    jobId?: number;
    reportId?: number;
    status?: string;
    assignedTo?: number;
    page?: number;
    limit?: number;
  }) {
    const { jobId, reportId, status, assignedTo, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (jobId) where.jobId = jobId;
    if (reportId) where.reportId = reportId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const [workflows, total] = await Promise.all([
      prisma.failureWorkflow.findMany({
        where,
        include: {
          job: { include: { customer: true } },
          report: { include: { inspection: true } },
          assignee: true,
          resolver: true,
          _count: { select: { steps: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.failureWorkflow.count({ where }),
    ]);

    return { workflows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateFailureWorkflow(id: number, companyId: number, data: Partial<CreateFailureWorkflowInput & { status: string; resolvedAt: Date; resolvedBy: number }>) {
    return prisma.failureWorkflow.update({
      where: { id, companyId },
      data,
      include: {
        assignee: true,
        resolver: true,
        job: { include: { customer: true } },
      },
    });
  }

  static async resolveFailureWorkflow(id: number, companyId: number, resolvedBy: number, rootCause?: string, correctiveAction?: string, preventiveAction?: string) {
    return prisma.failureWorkflow.update({
      where: { id, companyId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
        rootCause,
        correctiveAction,
        preventiveAction,
      },
      include: { resolver: true },
    });
  }

  static async addFailureWorkflowStep(input: CreateFailureWorkflowStepInput) {
    return prisma.failureWorkflowStep.create({
      data: {
        companyId: input.companyId,
        workflowId: input.workflowId,
        stepNumber: input.stepNumber,
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo,
        status: 'pending',
      },
      include: { assignee: true },
    });
  }

  static async updateFailureWorkflowStep(id: number, companyId: number, data: {
    status?: string;
    completedAt?: Date;
    completedBy?: number;
    notes?: string;
  }) {
    return prisma.failureWorkflowStep.update({
      where: { id },
      data: {
        ...data,
      },
      include: { assignee: true, completer: true },
    });
  }

  static async completeFailureWorkflowStep(id: number, companyId: number, completedBy: number, notes?: string) {
    const step = await prisma.failureWorkflowStep.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        completedBy,
        notes,
      },
      include: { completer: true, workflow: true },
    });

    const allSteps = await prisma.failureWorkflowStep.findMany({
      where: { workflowId: step.workflowId },
    });

    const allCompleted = allSteps.every(s => s.status === 'completed');

    if (allCompleted) {
      await prisma.failureWorkflow.update({
        where: { id: step.workflowId },
        data: { status: 'resolved', resolvedAt: new Date(), resolvedBy: completedBy },
      });
    }

    return step;
  }

  static async getDefaultTemplate(companyId: number, type: string) {
    return prisma.inspectionReportTemplate.findFirst({
      where: { companyId, type, isDefault: true, isActive: true },
    });
  }

  static async getReportsByInspection(inspectionId: number, companyId: number) {
    return prisma.inspectionReport.findMany({
      where: { inspectionId, companyId },
      include: {
        template: true,
        generator: true,
        reviewer: true,
        approver: true,
        signer: true,
        signatures: { include: { user: true } },
        failureWorkflows: { include: { assignee: true, resolver: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}




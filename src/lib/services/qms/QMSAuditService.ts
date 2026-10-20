// src/lib/services/qms/QMSAuditService.ts

import { prisma } from '@/lib/prisma';

/**
 * QMS Internal Audit Service
 * Manages internal audits, findings, corrective actions, and management reviews.
 * ISO/IEC 17020 §8.6 — Internal Audits
 */
export class QMSAuditService {
  // ──────────────────────────────────────────────
  //  INTERNAL AUDITS
  // ──────────────────────────────────────────────

  static async createAudit(params: {
    companyId: number;
    auditNumber: string;
    auditType: 'INTERNAL' | 'SURVEILLANCE' | 'SPECIAL';
    scheduledDate: Date;
    leadAuditorId: number;
    scope: string;
    notes?: string;
  }) {
    return (prisma as any).internalAudit.create({
      data: {
        companyId: params.companyId,
        auditNumber: params.auditNumber,
        auditType: params.auditType,
        scheduledDate: params.scheduledDate,
        leadAuditorId: params.leadAuditorId,
        scope: params.scope,
        notes: params.notes || null,
        status: 'PLANNED',
      },
    });
  }

  static async listAudits(companyId: number) {
    return (prisma as any).internalAudit.findMany({
      where: { companyId },
      include: {
        findings: true,
        leadAuditor: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  static async getAuditById(id: number, companyId: number) {
    return (prisma as any).internalAudit.findFirst({
      where: { id, companyId },
      include: {
        findings: { include: { correctiveActions: true } },
        leadAuditor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async updateAudit(
    id: number,
    companyId: number,
    data: {
      scheduledDate?: Date;
      completedDate?: Date;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
      scope?: string;
      notes?: string;
    }
  ) {
    const existing = await this.getAuditById(id, companyId);
    if (!existing) throw new Error('Audit not found');

    return (prisma as any).internalAudit.update({
      where: { id },
      data: {
        ...(data.scheduledDate && { scheduledDate: data.scheduledDate }),
        ...(data.completedDate && { completedDate: data.completedDate }),
        ...(data.status && { status: data.status }),
        ...(data.scope && { scope: data.scope }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  // ──────────────────────────────────────────────
  //  AUDIT FINDINGS
  // ──────────────────────────────────────────────

  static async addFinding(params: {
    auditId: number;
    companyId: number;
    clauseReference: string;
    description: string;
    severity: 'OBSERVATION' | 'MINOR' | 'MAJOR' | 'CRITICAL';
  }) {
    const audit = await this.getAuditById(params.auditId, params.companyId);
    if (!audit) throw new Error('Audit not found');

    return (prisma as any).auditFinding.create({
      data: {
        auditId: params.auditId,
        clauseReference: params.clauseReference,
        description: params.description,
        severity: params.severity,
        status: 'OPEN',
      },
    });
  }

  static async updateFinding(
    id: number,
    data: {
      status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'VERIFIED';
      rootCause?: string;
      resolution?: string;
    }
  ) {
    return (prisma as any).auditFinding.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.rootCause && { rootCause: data.rootCause }),
        ...(data.resolution && { resolution: data.resolution }),
      },
    });
  }

  // ──────────────────────────────────────────────
  //  CORRECTIVE ACTIONS
  // ──────────────────────────────────────────────

  static async addCorrectiveAction(params: {
    findingId: number;
    description: string;
    assignedToId: number;
    dueDate: Date;
  }) {
    return (prisma as any).correctiveAction.create({
      data: {
        findingId: params.findingId,
        description: params.description,
        assignedToId: params.assignedToId,
        dueDate: params.dueDate,
        status: 'OPEN',
      },
    });
  }

  static async updateCorrectiveAction(
    id: number,
    data: {
      status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
      completedDate?: Date;
      evidence?: string;
      verifiedById?: number;
    }
  ) {
    return (prisma as any).correctiveAction.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.completedDate && { completedDate: data.completedDate }),
        ...(data.evidence && { evidence: data.evidence }),
        ...(data.verifiedById && { verifiedById: data.verifiedById }),
      },
    });
  }

  // ──────────────────────────────────────────────
  //  MANAGEMENT REVIEW
  // ──────────────────────────────────────────────

  static async createManagementReview(params: {
    companyId: number;
    reviewDate: Date;
    chairpersonId: number;
    attendees: string[];
    agenda?: string;
    minutes?: string;
    decisions?: string;
    actionItems?: any;
  }) {
    return (prisma as any).managementReview.create({
      data: {
        companyId: params.companyId,
        reviewDate: params.reviewDate,
        chairpersonId: params.chairpersonId,
        attendeesJson: JSON.stringify(params.attendees),
        agenda: params.agenda || null,
        minutes: params.minutes || null,
        decisions: params.decisions || null,
        actionItemsJson: params.actionItems ? JSON.stringify(params.actionItems) : null,
        status: 'SCHEDULED',
      },
    });
  }

  static async listManagementReviews(companyId: number) {
    return (prisma as any).managementReview.findMany({
      where: { companyId },
      orderBy: { reviewDate: 'desc' },
    });
  }
}

// src/lib/services/accreditation/AccreditationAssessmentService.ts

import { prisma } from '@/lib/prisma';

/**
 * Service handling CRUD operations for AccreditationAssessment entities.
 */
export class AccreditationAssessmentService {
  /**
   * Create a new assessment linked to an application.
   */
  static async createAssessment(params: {
    applicationId: number;
    assessmentType: 'DOCUMENT_REVIEW' | 'ON_SITE' | 'SURVEILLANCE';
    assessmentDate?: Date;
    assessorName?: string;
    assessorOrganization?: string;
    findings?: any;
    outcome?: 'PASS' | 'FAIL' | 'CONDITIONAL';
    notes?: string;
  }) {
    const {
      applicationId,
      assessmentType,
      assessmentDate,
      assessorName,
      assessorOrganization,
      findings,
      outcome,
      notes,
    } = params;

    return (prisma as any).accreditationAssessment.create({
      data: {
        applicationId,
        assessmentType,
        assessmentDate: assessmentDate || new Date(),
        assessorName: assessorName || null,
        assessorOrganization: assessorOrganization || null,
        findingsJson: findings ? JSON.stringify(findings) : null,
        outcome: outcome || null,
        notes: notes || null,
      },
      include: {
        application: { select: { id: true, applicationNumber: true } },
        nonconformities: true,
      },
    });
  }

  /**
   * Retrieve a single assessment by ID (company-scoped).
   */
  static async getAssessmentById(id: number, companyId: number) {
    return (prisma as any).accreditationAssessment.findFirst({
      where: {
        id,
        application: { companyId },
      },
      include: {
        application: { select: { id: true, applicationNumber: true, status: true } },
        nonconformities: true,
      },
    });
  }

  /**
   * List all assessments for a company's applications.
   */
  static async listAssessments(companyId: number) {
    return (prisma as any).accreditationAssessment.findMany({
      where: {
        application: { companyId },
      },
      include: {
        application: { select: { id: true, applicationNumber: true, status: true } },
        nonconformities: true,
      },
      orderBy: { assessmentDate: 'desc' },
    });
  }

  /**
   * Update an assessment (outcome, findings, notes).
   */
  static async updateAssessment(
    id: number,
    companyId: number,
    data: {
      assessmentDate?: Date;
      assessorName?: string;
      assessorOrganization?: string;
      findings?: any;
      outcome?: 'PASS' | 'FAIL' | 'CONDITIONAL';
      notes?: string;
    }
  ) {
    // Verify ownership
    const existing = await this.getAssessmentById(id, companyId);
    if (!existing) throw new Error('Assessment not found');

    return (prisma as any).accreditationAssessment.update({
      where: { id },
      data: {
        ...(data.assessmentDate && { assessmentDate: data.assessmentDate }),
        ...(data.assessorName !== undefined && { assessorName: data.assessorName }),
        ...(data.assessorOrganization !== undefined && { assessorOrganization: data.assessorOrganization }),
        ...(data.findings !== undefined && { findingsJson: JSON.stringify(data.findings) }),
        ...(data.outcome && { outcome: data.outcome }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        application: { select: { id: true, applicationNumber: true } },
        nonconformities: true,
      },
    });
  }

  /**
   * Record a nonconformity against an assessment.
   */
  static async addNonconformity(params: {
    assessmentId: number;
    companyId: number;
    clauseReference: string;
    description: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    correctiveActionRequired?: string;
    dueDate?: Date;
  }) {
    // Verify the assessment belongs to this company
    const assessment = await this.getAssessmentById(params.assessmentId, params.companyId);
    if (!assessment) throw new Error('Assessment not found');

    return (prisma as any).accreditationNonconformity.create({
      data: {
        assessmentId: params.assessmentId,
        clauseReference: params.clauseReference,
        description: params.description,
        severity: params.severity,
        correctiveActionRequired: params.correctiveActionRequired || null,
        dueDate: params.dueDate || null,
        status: 'OPEN',
      },
    });
  }
}

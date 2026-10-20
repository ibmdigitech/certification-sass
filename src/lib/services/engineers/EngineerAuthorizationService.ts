// src/lib/services/engineers/EngineerAuthorizationService.ts

import { prisma } from '@/lib/prisma';

/**
 * Engineer Scope Authorization Service
 * Manages engineer profiles, scope training records, witnessed assessments,
 * and formal inspector scope authorizations.
 *
 * CRITICAL: This service must be called BEFORE assigning an engineer to any job.
 */
export class EngineerAuthorizationService {
  // ──────────────────────────────────────────────
  //  ENGINEER PROFILE
  // ──────────────────────────────────────────────

  static async createProfile(params: {
    userId: number;
    companyId: number;
    qualifications?: any;
    education?: string;
    previousExperience?: string;
    technicalExperience?: string;
  }) {
    return (prisma as any).engineerProfile.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        qualificationsJson: params.qualifications ? JSON.stringify(params.qualifications) : null,
        education: params.education || null,
        previousExperience: params.previousExperience || null,
        technicalExperience: params.technicalExperience || null,
      },
    });
  }

  static async getProfileByUserId(userId: number, companyId: number) {
    return (prisma as any).engineerProfile.findFirst({
      where: { userId, companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        scopeTraining: true,
        assessments: true,
        authorizations: true,
        monitoringRecords: true,
      },
    });
  }

  static async listProfiles(companyId: number) {
    return (prisma as any).engineerProfile.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        authorizations: { where: { status: 'ACTIVE' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateProfile(
    id: number,
    companyId: number,
    data: {
      qualifications?: any;
      education?: string;
      previousExperience?: string;
      technicalExperience?: string;
    }
  ) {
    const existing = await (prisma as any).engineerProfile.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new Error('Engineer profile not found');

    return (prisma as any).engineerProfile.update({
      where: { id },
      data: {
        ...(data.qualifications !== undefined && { qualificationsJson: JSON.stringify(data.qualifications) }),
        ...(data.education !== undefined && { education: data.education }),
        ...(data.previousExperience !== undefined && { previousExperience: data.previousExperience }),
        ...(data.technicalExperience !== undefined && { technicalExperience: data.technicalExperience }),
      },
    });
  }

  // ──────────────────────────────────────────────
  //  SCOPE TRAINING RECORDS
  // ──────────────────────────────────────────────

  static async recordScopeTraining(params: {
    engineerProfileId: number;
    scope: string;
    trainerId?: number;
    programmeId?: string;
    theoreticalHours: number;
    practicalHours: number;
    supervisedInspections: number;
    completionStatus: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  }) {
    return (prisma as any).inspectionScopeTraining.create({
      data: {
        engineerProfileId: params.engineerProfileId,
        scope: params.scope,
        trainerId: params.trainerId || null,
        programmeId: params.programmeId || null,
        theoreticalHours: params.theoreticalHours,
        practicalHours: params.practicalHours,
        supervisedInspections: params.supervisedInspections,
        completionStatus: params.completionStatus,
      },
    });
  }

  // ──────────────────────────────────────────────
  //  WITNESSED COMPETENCY ASSESSMENTS
  // ──────────────────────────────────────────────

  static async recordAssessment(params: {
    engineerProfileId: number;
    assessorId: number;
    jobId?: number;
    scope: string;
    equipment?: string;
    inspectionDate: Date;
    criteria?: any;
    outcome: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'DEFERRED';
    evidence?: string;
  }) {
    return (prisma as any).witnessedCompetencyAssessment.create({
      data: {
        engineerProfileId: params.engineerProfileId,
        assessorId: params.assessorId,
        jobId: params.jobId || null,
        scope: params.scope,
        equipment: params.equipment || null,
        inspectionDate: params.inspectionDate,
        criteriaJson: params.criteria ? JSON.stringify(params.criteria) : null,
        outcome: params.outcome,
        evidence: params.evidence || null,
      },
    });
  }

  // ──────────────────────────────────────────────
  //  SCOPE AUTHORIZATION
  // ──────────────────────────────────────────────

  /**
   * Grant a formal scope authorization to an engineer.
   */
  static async grantAuthorization(params: {
    engineerProfileId: number;
    scope: string;
    authorizationRef: string;
    limitations?: string;
    authorizingManagerId: number;
    effectiveDate: Date;
    expiryDate: Date;
  }) {
    return (prisma as any).inspectorScopeAuthorization.create({
      data: {
        engineerProfileId: params.engineerProfileId,
        scope: params.scope,
        authorizationRef: params.authorizationRef,
        limitations: params.limitations || null,
        authorizingManagerId: params.authorizingManagerId,
        effectiveDate: params.effectiveDate,
        expiryDate: params.expiryDate,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Check whether an engineer is authorized for a given scope on a given date.
   * This is the CRITICAL gate that must be called before job assignment.
   */
  static async isAuthorized(
    userId: number,
    companyId: number,
    scope: string,
    date: Date = new Date()
  ): Promise<boolean> {
    const authorization = await (prisma as any).inspectorScopeAuthorization.findFirst({
      where: {
        engineerProfile: { userId, companyId },
        scope,
        status: 'ACTIVE',
        effectiveDate: { lte: date },
        expiryDate: { gte: date },
      },
    });
    return !!authorization;
  }

  /**
   * List all active authorizations for an engineer.
   */
  static async listAuthorizations(engineerProfileId: number) {
    return (prisma as any).inspectorScopeAuthorization.findMany({
      where: { engineerProfileId },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /**
   * Revoke / suspend an authorization.
   */
  static async revokeAuthorization(id: number, reason?: string) {
    return (prisma as any).inspectorScopeAuthorization.update({
      where: { id },
      data: {
        status: 'REVOKED',
        limitations: reason ? `REVOKED: ${reason}` : 'REVOKED',
      },
    });
  }
}

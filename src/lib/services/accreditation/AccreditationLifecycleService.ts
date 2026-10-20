// src/lib/services/accreditation/AccreditationLifecycleService.ts

import { prisma } from '@/lib/prisma';

/**
 * Service managing the full accreditation lifecycle:
 *   Application → Assessment → Scope Grant → Surveillance → Renewal / Revocation
 */
export class AccreditationLifecycleService {
  // ──────────────────────────────────────────────
  //  SCOPE CRUD
  // ──────────────────────────────────────────────

  /**
   * Grant a new accreditation scope to a company.
   */
  static async grantScope(params: {
    companyId: number;
    applicationId?: number;
    scopeReference: string;
    scopeDetails: any;
    validFrom: Date;
    validTo: Date;
    conditions?: string;
  }) {
    return (prisma as any).accreditationScope.create({
      data: {
        companyId: params.companyId,
        applicationId: params.applicationId || null,
        scopeReference: params.scopeReference,
        scopeDetailsJson: params.scopeDetails ? JSON.stringify(params.scopeDetails) : null,
        validFrom: params.validFrom,
        validTo: params.validTo,
        conditions: params.conditions || null,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * List all scopes for a company.
   */
  static async listScopes(companyId: number) {
    return (prisma as any).accreditationScope.findMany({
      where: { companyId },
      orderBy: { validFrom: 'desc' },
    });
  }

  /**
   * Get a single scope by ID (company-scoped).
   */
  static async getScopeById(id: number, companyId: number) {
    return (prisma as any).accreditationScope.findFirst({
      where: { id, companyId },
    });
  }

  /**
   * Update a scope (extend validity, change status, add conditions).
   */
  static async updateScope(
    id: number,
    companyId: number,
    data: {
      validFrom?: Date;
      validTo?: Date;
      conditions?: string;
      status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
      scopeDetails?: any;
    }
  ) {
    const existing = await this.getScopeById(id, companyId);
    if (!existing) throw new Error('Scope not found');

    return (prisma as any).accreditationScope.update({
      where: { id },
      data: {
        ...(data.validFrom && { validFrom: data.validFrom }),
        ...(data.validTo && { validTo: data.validTo }),
        ...(data.conditions !== undefined && { conditions: data.conditions }),
        ...(data.status && { status: data.status }),
        ...(data.scopeDetails !== undefined && { scopeDetailsJson: JSON.stringify(data.scopeDetails) }),
      },
    });
  }

  /**
   * Revoke a scope immediately.
   */
  static async revokeScope(id: number, companyId: number, reason?: string) {
    const existing = await this.getScopeById(id, companyId);
    if (!existing) throw new Error('Scope not found');

    return (prisma as any).accreditationScope.update({
      where: { id },
      data: {
        status: 'REVOKED',
        conditions: reason ? `REVOKED: ${reason}` : 'REVOKED',
      },
    });
  }

  // ──────────────────────────────────────────────
  //  LIFECYCLE TRANSITIONS
  // ──────────────────────────────────────────────

  /**
   * Transition an application through its lifecycle.
   * Validates that the transition is legal before applying.
   */
  static async transitionApplication(
    applicationId: number,
    companyId: number,
    targetStatus: string
  ) {
    const app = await (prisma as any).accreditationApplication.findFirst({
      where: { id: applicationId, companyId },
    });
    if (!app) throw new Error('Application not found');

    const allowed = this.getAllowedTransitions(app.status);
    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `Invalid transition from "${app.status}" to "${targetStatus}". Allowed: ${allowed.join(', ')}`
      );
    }

    return (prisma as any).accreditationApplication.update({
      where: { id: applicationId },
      data: { status: targetStatus },
    });
  }

  /**
   * Return the list of valid next statuses from a given status.
   */
  static getAllowedTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      SUBMITTED:     ['UNDER_REVIEW', 'WITHDRAWN'],
      UNDER_REVIEW:  ['ASSESSMENT_SCHEDULED', 'WITHDRAWN'],
      ASSESSMENT_SCHEDULED: ['ASSESSMENT_COMPLETE', 'WITHDRAWN'],
      ASSESSMENT_COMPLETE:  ['APPROVED', 'REJECTED', 'CONDITIONAL'],
      CONDITIONAL:   ['APPROVED', 'REJECTED'],
      APPROVED:      ['SCOPE_GRANTED'],
      REJECTED:      ['SUBMITTED'],          // allow re-submission
      WITHDRAWN:     ['SUBMITTED'],          // allow re-submission
      SCOPE_GRANTED: [],                      // terminal
    };
    return transitions[currentStatus] || [];
  }

  // ──────────────────────────────────────────────
  //  EXPIRY / SURVEILLANCE HELPERS
  // ──────────────────────────────────────────────

  /**
   * Find all scopes expiring within `daysAhead` days.
   */
  static async getScopesExpiringSoon(companyId: number, daysAhead = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return (prisma as any).accreditationScope.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        validTo: { lte: cutoff },
      },
      orderBy: { validTo: 'asc' },
    });
  }
}

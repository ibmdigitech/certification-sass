// src/lib/services/accreditation/AccreditationApplicationService.ts

import { prisma } from '@/lib/prisma';
import { AccreditationApplication } from '@prisma/client';
import { AuditLogService } from '@/lib/services/audit-log.service'; // Assuming an audit‑log service exists

/**
 * Service handling CRUD operations for AccreditationApplication entities.
 * All methods are static for easy consumption throughout the codebase.
 */
export class AccreditationApplicationService {
  /**
   * Create a new accreditation application.
   * @param companyId - The ID of the company submitting the application.
   * @param documents - Optional JSON blob containing document storage references.
   * @returns The created AccreditationApplication record.
   */
  static async createApplication(params: {
    companyId: number;
    documents?: any;
  }): Promise<AccreditationApplication> {
    const { companyId, documents } = params;
    const application = await prisma.accreditationApplication.create({
      data: {
        companyId,
        documents: documents ? JSON.stringify(documents) : undefined,
        status: 'PENDING',
      },
    });

    // Record audit log entry
    await AuditLogService.logAction({
      entity: 'AccreditationApplication',
      entityId: application.id,
      action: 'CREATE',
      details: { companyId },
    });

    return application;
  }

  /**
   * Retrieve an accreditation application by its ID.
   */
  static async getApplicationById(id: number): Promise<AccreditationApplication | null> {
    return prisma.accreditationApplication.findUnique({
      where: { id },
    });
  }

  /**
   * Update an existing accreditation application.
   * Only mutable fields (status, documents) are allowed to change.
   */
  static async updateApplication(params: {
    id: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    documents?: any;
  }): Promise<AccreditationApplication> {
    const { id, status, documents } = params;
    const updated = await prisma.accreditationApplication.update({
      where: { id },
      data: {
        status,
        documents: documents ? JSON.stringify(documents) : undefined,
      },
    });

    await AuditLogService.logAction({
      entity: 'AccreditationApplication',
      entityId: id,
      action: 'UPDATE',
      details: { status, documents },
    });

    return updated;
  }

  /**
   * Soft‑delete (archive) an application.
   * The schema defines a `status` field; we set it to 'WITHDRAWN'.
   */
  static async withdrawApplication(id: number): Promise<AccreditationApplication> {
    const withdrawn = await prisma.accreditationApplication.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    await AuditLogService.logAction({
      entity: 'AccreditationApplication',
      entityId: id,
      action: 'WITHDRAW',
      details: {},
    });

    return withdrawn;
  }
}

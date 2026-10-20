// src/lib/services/qms/QMSDocumentService.ts

import { prisma } from '@/lib/prisma';

/**
 * QMS Document Control Service
 * Manages controlled documents, revisions, approvals, and distribution.
 * ISO/IEC 17020 §8.2 — Document Control
 */
export class QMSDocumentService {
  /**
   * Create a new controlled document.
   */
  static async createDocument(params: {
    companyId: number;
    title: string;
    documentCode: string;
    category: 'POLICY' | 'PROCEDURE' | 'WORK_INSTRUCTION' | 'FORM' | 'RECORD' | 'MANUAL';
    revision: string;
    content?: string;
    fileUrl?: string;
    preparedById: number;
    approvedById?: number;
  }) {
    return (prisma as any).qmsDocument.create({
      data: {
        companyId: params.companyId,
        title: params.title,
        documentCode: params.documentCode,
        category: params.category,
        revision: params.revision || '1.0',
        content: params.content || null,
        fileUrl: params.fileUrl || null,
        preparedById: params.preparedById,
        approvedById: params.approvedById || null,
        status: 'DRAFT',
        effectiveDate: null,
      },
    });
  }

  /**
   * List all documents for a company, optionally filtered by category.
   */
  static async listDocuments(companyId: number, category?: string) {
    return (prisma as any).qmsDocument.findMany({
      where: {
        companyId,
        ...(category && { category }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get a single document by ID.
   */
  static async getDocumentById(id: number, companyId: number) {
    return (prisma as any).qmsDocument.findFirst({
      where: { id, companyId },
    });
  }

  /**
   * Update a document (new revision, content, status).
   */
  static async updateDocument(
    id: number,
    companyId: number,
    data: {
      title?: string;
      revision?: string;
      content?: string;
      fileUrl?: string;
      status?: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'OBSOLETE';
      approvedById?: number;
      effectiveDate?: Date;
    }
  ) {
    const existing = await this.getDocumentById(id, companyId);
    if (!existing) throw new Error('Document not found');

    return (prisma as any).qmsDocument.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.revision && { revision: data.revision }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.status && { status: data.status }),
        ...(data.approvedById && { approvedById: data.approvedById }),
        ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
      },
    });
  }

  /**
   * Mark a document as obsolete (soft-delete).
   */
  static async obsoleteDocument(id: number, companyId: number) {
    return this.updateDocument(id, companyId, { status: 'OBSOLETE' });
  }
}

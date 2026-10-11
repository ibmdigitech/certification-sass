import { PrismaClient, Document, AuditLog } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface UploadDocumentInput {
  companyId: number;
  name: string;
  type: string; // EMIRATES_ID, PASSPORT, SUPPORTING_DOC, etc.
  category?: string;
  url: string; // The physical storage path/key
  size?: number;
  mimeType?: string;
  entityType?: string; // Job, Trainee, Inspection, etc.
  entityId?: number;
  uploadedBy?: number;
}

export interface DocumentAccessLogInput {
  documentId: number;
  companyId: number;
  userId: number;
  action: 'VIEW' | 'DOWNLOAD' | 'DELETE' | 'REPLACE';
}

export class StorageService {
  /**
   * Generates a secure, temporary signed URL for viewing/downloading a document.
   * In a real implementation, this would call AWS S3, Google Cloud Storage, or Azure Blob Storage.
   */
  static async generateSignedUrl(storageKey: string, expiresInSeconds: number = 3600): Promise<string> {
    // Mock implementation for the signed URL
    const token = crypto.randomBytes(16).toString('hex');
    return `/api/documents/secure-access?key=${encodeURIComponent(storageKey)}&token=${token}&expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  /**
   * Generates a storage key for a new upload
   */
  static generateStorageKey(companyId: number, entityType: string, filename: string): string {
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `tenant_${companyId}/${entityType.toLowerCase()}/${timestamp}_${safeName}`;
  }
}

export class DocumentService {
  /**
   * Records a new document upload in the database and creates an audit log.
   */
  static async uploadDocument(input: UploadDocumentInput): Promise<Document> {
    return await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          companyId: input.companyId,
          name: input.name,
          type: input.type,
          category: input.category,
          url: input.url,
          size: input.size,
          mimeType: input.mimeType,
          entityType: input.entityType,
          entityId: input.entityId,
          uploadedBy: input.uploadedBy,
        },
      });

      if (input.uploadedBy) {
        await tx.auditLog.create({
          data: {
            companyId: input.companyId,
            tenantId: input.companyId,
            userId: input.uploadedBy,
            action: 'DOCUMENT_UPLOADED',
            entityType: 'Document',
            entityId: doc.id,
          },
        });
      }

      return doc;
    });
  }

  /**
   * Retrieves a document and generates a secure signed URL for access.
   * Also logs the access.
   */
  static async getDocumentSecurely(documentId: number, companyId: number, userId: number): Promise<{ document: Document; signedUrl: string }> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    const signedUrl = await StorageService.generateSignedUrl(document.url);

    // Asynchronously log the access
    this.logAccess({
      documentId,
      companyId,
      userId,
      action: 'VIEW',
    }).catch(console.error);

    return { document, signedUrl };
  }

  /**
   * Deletes a document record.
   * In a real implementation, this should also delete the file from physical storage.
   */
  static async deleteDocument(documentId: number, companyId: number, userId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const doc = await tx.document.findFirst({
        where: { id: documentId, companyId },
      });

      if (!doc) {
        throw new Error('Document not found');
      }

      await tx.document.delete({
        where: { id: documentId },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          tenantId: companyId,
          userId,
          action: 'DOCUMENT_DELETED',
          entityType: 'Document',
          entityId: documentId,
        },
      });
      
      // TODO: Call StorageService.deleteFile(doc.url) here
    });
  }

  /**
   * Logs document access for compliance and auditing.
   */
  private static async logAccess(input: DocumentAccessLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        tenantId: input.companyId,
        userId: input.userId,
        action: `DOCUMENT_${input.action}`,
        entityType: 'Document',
        entityId: input.documentId,
      },
    });
  }

  /**
   * Lists documents for a specific entity (e.g., all documents for a Job)
   */
  static async getDocumentsForEntity(companyId: number, entityType: string, entityId: number): Promise<Document[]> {
    return await prisma.document.findMany({
      where: {
        companyId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

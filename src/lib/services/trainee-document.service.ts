import { prisma } from '@/lib/prisma';
﻿import { TraineeDocument } from '@prisma/client';
export interface CreateTraineeDocumentInput {
  companyId: number;
  traineeId: number;
  name: string;
  type: string;
  url: string;
  expiryDate?: Date;
  status?: string;
}

export interface UpdateTraineeDocumentInput extends Partial<CreateTraineeDocumentInput> {
  id: number;
}

export interface DocumentFilters {
  companyId: number;
  traineeId?: number;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDocuments {
  documents: TraineeDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DOCUMENT_TYPES = [
  'EMIRATES_ID',
  'PASSPORT',
  'VISA',
  'LICENSE',
  'MEDICAL_CERTIFICATE',
  'PHOTO',
  'OTHER',
] as const;

export const DOCUMENT_STATUSES = [
  'valid',
  'expired',
  'expiring_soon',
  'pending_verification',
  'rejected',
] as const;

export class TraineeDocumentService {
  async create(data: CreateTraineeDocumentInput): Promise<TraineeDocument> {
    return prisma.traineeDocument.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status || 'valid',
      },
    });
  }

  async findById(id: number, companyId: number): Promise<TraineeDocument | null> {
    return prisma.traineeDocument.findFirst({
      where: { id, companyId },
      include: { trainee: { select: { firstName: true, lastName: true, employeeId: true } } },
    });
  }

  async findMany(filters: DocumentFilters): Promise<PaginatedDocuments> {
    const { companyId, traineeId, type, status, page = 1, pageSize = 20 } = filters;

    const where: any = { companyId };
    if (traineeId) where.traineeId = traineeId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [documents, total] = await Promise.all([
      prisma.traineeDocument.findMany({
        where,
        include: { trainee: { select: { firstName: true, lastName: true, employeeId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.traineeDocument.count({ where }),
    ]);

    return { documents, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async update(data: UpdateTraineeDocumentInput): Promise<TraineeDocument> {
    const { id, expiryDate, ...rest } = data;
    return prisma.traineeDocument.update({
      where: { id },
      data: {
        ...rest,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });
  }

  async delete(id: number, companyId: number): Promise<void> {
    await prisma.traineeDocument.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, status: string, companyId: number): Promise<TraineeDocument> {
    return prisma.traineeDocument.update({
      where: { id },
      data: { status },
    });
  }

  async getExpiringDocuments(companyId: number, days: number = 30): Promise<TraineeDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.traineeDocument.findMany({
      where: {
        companyId,
        expiryDate: { lte: futureDate, gte: new Date() },
        status: { notIn: ['expired', 'rejected'] },
      },
      include: { trainee: { select: { firstName: true, lastName: true, email: true, employeeId: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpiredDocuments(companyId: number): Promise<TraineeDocument[]> {
    return prisma.traineeDocument.findMany({
      where: {
        companyId,
        expiryDate: { lt: new Date() },
        status: { not: 'expired' },
      },
      include: { trainee: { select: { firstName: true, lastName: true, email: true, employeeId: true } } },
      orderBy: { expiryDate: 'desc' },
    });
  }
}

export const traineeDocumentService = new TraineeDocumentService();


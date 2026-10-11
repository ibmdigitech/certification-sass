import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntityType =
  | 'Job'
  | 'Trainee'
  | 'TraineeDocument'
  | 'Attendance'
  | 'Timesheet'
  | 'Inspection'
  | 'Certificate';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface SyncQueueEntry {
  id: number;
  entityType: string;
  entityId: number | null;
  operation: string;
  payload: any;
  status: string;
  retryCount: number;
  lastError: string | null;
}

export class OfflineSyncService {
  /**
   * Enqueues an offline operation for later sync.
   * Called from the client-side service worker or the API when connectivity is restored.
   */
  static async enqueue(
    companyId: number,
    userId: number,
    entityType: SyncEntityType,
    operation: SyncOperation,
    payload: Record<string, unknown>,
    entityId?: number
  ) {
    return prisma.syncQueue.create({
      data: {
        companyId,
        userId,
        entityType,
        entityId: entityId || null,
        operation,
        payload: payload as Prisma.InputJsonValue,
        status: 'PENDING',
        retryCount: 0,
      },
    });
  }

  /**
   * Processes all PENDING items in the sync queue for a given company.
   * This is the server-side reconciliation process.
   */
  static async processQueue(companyId: number): Promise<{
    processed: number;
    failed: number;
    conflicts: number;
  }> {
    const pendingItems = await prisma.syncQueue.findMany({
      where: { companyId, status: { in: ['PENDING', 'FAILED'] } },
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    let failed = 0;
    let conflicts = 0;

    for (const item of pendingItems) {
      // Mark as syncing
      await prisma.syncQueue.update({
        where: { id: item.id },
        data: { status: 'SYNCING', lastAttempt: new Date() },
      });

      try {
        await this.processSingleItem(item);

        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'SYNCED', syncedAt: new Date() },
        });

        processed++;
      } catch (error) {
        const isConflict = error instanceof Error && error.message.includes('CONFLICT');

        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: isConflict ? 'CONFLICT' : 'FAILED',
            retryCount: { increment: 1 },
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        if (isConflict) {
          conflicts++;
        } else {
          failed++;
        }
      }
    }

    return { processed, failed, conflicts };
  }

  /**
   * Processes a single sync queue item by dispatching to the appropriate handler.
   */
  private static async processSingleItem(item: SyncQueueEntry): Promise<void> {
    const payload = item.payload as Record<string, unknown>;

    switch (item.entityType) {
      case 'Attendance':
        await this.syncAttendance(item.operation as SyncOperation, payload, item.entityId);
        break;
      case 'Timesheet':
        await this.syncTimesheet(item.operation as SyncOperation, payload, item.entityId);
        break;
      case 'TraineeDocument':
        await this.syncTraineeDocument(item.operation as SyncOperation, payload, item.entityId);
        break;
      default:
        // For other entity types, a generic handler or throw
        throw new Error(`Sync handler not implemented for entity type: ${item.entityType}`);
    }
  }

  private static async syncAttendance(operation: SyncOperation, payload: Record<string, unknown>, entityId: number | null) {
    if (operation === 'CREATE') {
      // Check for conflict: does attendance already exist for this session+trainee?
      const existing = await prisma.attendance.findFirst({
        where: {
          sessionId: payload.sessionId as number,
          traineeId: payload.traineeId as number,
        },
      });

      if (existing) {
        throw new Error('CONFLICT: Attendance record already exists for this session and trainee');
      }

      await prisma.attendance.create({
        data: {
          companyId: payload.companyId as number,
          sessionId: payload.sessionId as number,
          traineeId: payload.traineeId as number,
          status: (payload.status as string) || 'PRESENT',
          checkInTime: payload.checkInTime ? new Date(payload.checkInTime as string) : null,
          isOffline: true,
          syncedAt: new Date(),
        },
      });
    }
  }

  private static async syncTimesheet(operation: SyncOperation, payload: Record<string, unknown>, entityId: number | null) {
    if (operation === 'CREATE') {
      await prisma.timesheet.create({
        data: {
          companyId: payload.companyId as number,
          userId: payload.userId as number,
          jobId: (payload.jobId as number) || null,
          date: new Date(payload.date as string),
          startTime: new Date(payload.startTime as string),
          endTime: new Date(payload.endTime as string),
          breakMinutes: (payload.breakMinutes as number) || 0,
          description: (payload.description as string) || null,
          status: 'draft',
        },
      });
    }
  }

  private static async syncTraineeDocument(operation: SyncOperation, payload: Record<string, unknown>, entityId: number | null) {
    if (operation === 'CREATE') {
      await prisma.traineeDocument.create({
        data: {
          companyId: payload.companyId as number,
          traineeId: payload.traineeId as number,
          name: payload.name as string,
          type: payload.type as string,
          url: payload.url as string,
          status: 'pending_verification',
        },
      });
    }
  }

  /**
   * Returns the current sync queue status for a user.
   */
  static async getQueueStatus(companyId: number, userId: number) {
    const counts = await prisma.syncQueue.groupBy({
      by: ['status'],
      where: { companyId, userId },
      _count: { id: true },
    });

    return counts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
}

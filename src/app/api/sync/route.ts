import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface SyncRequest {
  mutations: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: string;
    entityId?: string | number;
    data: unknown;
    conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
    timestamp: number;
    idempotencyKey?: string;
    dependsOnEntityType?: string;
    dependsOnEntityId?: number;
  }>;
  clientVersion: number;
  trace?: string;
}

interface ConflictResponse {
  conflict: true;
  entity: string;
  entityId: string | number;
  serverData: unknown;
  clientData: unknown;
}

type ModelDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: number }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: number } }) => Promise<unknown>;
  findUnique: (args: { where: { id: number } }) => Promise<unknown | null>;
};

function getModel(entity: string): ModelDelegate | null {
  const models: Record<string, ModelDelegate> = {
    jobs: prisma.job as unknown as ModelDelegate,
    jobServices: prisma.jobService as unknown as ModelDelegate,
    certificates: prisma.certificate as unknown as ModelDelegate,
    trainees: prisma.trainee as unknown as ModelDelegate,
    inspections: prisma.inspection as unknown as ModelDelegate,
    trainingSessions: prisma.trainingSession as unknown as ModelDelegate,
    timesheets: prisma.timesheet as unknown as ModelDelegate,
    customers: prisma.customer as unknown as ModelDelegate,
    users: prisma.user as unknown as ModelDelegate,
    companies: prisma.company as unknown as ModelDelegate,
    locations: prisma.location as unknown as ModelDelegate,
  };
  return models[entity] || null;
}

async function applyMutation(mutation: SyncRequest['mutations'][0], companyId: number) {
  const model = getModel(mutation.entity);
  if (!model) {
    throw new Error(Unknown entity: );
  }

  switch (mutation.type) {
    case 'create': {
      const data = { ...(mutation.data as Record<string, unknown>), companyId };
      return await model.create({ data });
    }
    case 'update': {
      if (!mutation.entityId) throw new Error('entityId required for update');
      const where = { id: Number(mutation.entityId) };
      const existing = await model.findUnique({ where });
      if (!existing) throw new Error('Record not found');
      return await model.update({ where, data: mutation.data as Record<string, unknown> });
    }
    case 'delete': {
      if (!mutation.entityId) throw new Error('entityId required for delete');
      return await model.delete({ where: { id: Number(mutation.entityId) } });
    }
  }
}

async function checkConflict(mutation: SyncRequest['mutations'][0], companyId: number): Promise<ConflictResponse | null> {
  if (mutation.type !== 'update' || !mutation.entityId) return null;

  const model = getModel(mutation.entity);
  if (!model) return null;

  const serverData = await model.findUnique({ where: { id: Number(mutation.entityId) } });
  if (!serverData) return null;

  const clientData = mutation.data;
  const serverUpdatedAt = (serverData as Record<string, unknown>).updatedAt;
  const clientUpdatedAt = (clientData as Record<string, unknown>).updatedAt;

  if (serverUpdatedAt && clientUpdatedAt) {
    const serverTime = new Date(serverUpdatedAt as string).getTime();
    const clientTime = new Date(clientUpdatedAt as string).getTime();
    if (serverTime > clientTime) {
      return { conflict: true, entity: mutation.entity, entityId: mutation.entityId, serverData, clientData };
    }
  }

  return null;
}

async function isDuplicate(idempotencyKey: string | undefined, companyId: number): Promise<boolean> {
  if (!idempotencyKey) return false;
  const existing = await prisma.syncQueue.findFirst({
    where: { idempotencyKey, status: 'SYNCED', companyId },
  });
  return !!existing;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const body: SyncRequest = await request.json();
    const { mutations, clientVersion, trace } = body;
    const traceId = trace || sync-;

    const url = new URL(request.url);
    const traceParam = url.searchParams.get('trace');
    const traceLabel = traceId + (traceParam ? - : '');

    const results: Array<{ id: string; success: boolean; data?: unknown; merged?: boolean; conflict?: boolean; skipped?: boolean }> = [];
    const conflicts: ConflictResponse[] = [];

    for (const mutation of mutations) {
      const isDup = await isDuplicate(mutation.idempotencyKey, companyId);
      if (isDup) {
        results.push({ id: mutation.id, success: true, skipped: true });
        continue;
      }

      const conflict = await checkConflict(mutation, companyId);
      let applied = false;
      let resultData: unknown = undefined;
      let merged = false;

      if (conflict) {
        if (mutation.conflictResolution === 'client-wins') {
          const result = await applyMutation(mutation, companyId);
          applied = true;
          resultData = result;
        } else if (mutation.conflictResolution === 'merge') {
          const serverData = conflict.serverData as Record<string, unknown>;
          const clientData = conflict.clientData as Record<string, unknown>;
          const mergedData = { ...serverData, ...clientData };
          delete mergedData.id;
          delete mergedData.createdAt;
          const result = await applyMutation({ ...mutation, data: mergedData }, companyId);
          applied = true;
          resultData = result;
          merged = true;
        } else {
          // server-wins or default: do not apply mutation, treat as conflict
          conflicts.push(conflict);
          results.push({ id: mutation.id, success: false, conflict: true });
          continue;
        }
      } else {
        const result = await applyMutation(mutation, companyId);
        applied = true;
        resultData = result;
      }

      if (applied) {
        // Create SyncQueue entry to record successful sync
        await prisma.syncQueue.create({
          data: {
            companyId,
            userId,
            entityType: mutation.entity,
            entityId: mutation.entityId ? Number(mutation.entityId) : null,
            operation: mutation.type.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
            payload: mutation.data,
            idempotencyKey: mutation.idempotencyKey,
            dependsOnEntityType: mutation.dependsOnEntityType,
            dependsOnEntityId: mutation.dependsOnEntityId,
            status: 'SYNCED',
          },
        });

        results.push({ id: mutation.id, success: true, data: resultData, merged });
      }
    }

    return NextResponse.json({
      success: conflicts.length === 0,
      results,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      serverVersion: Date.now(),
      trace: traceLabel,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Sync endpoint ready',
    timestamp: Date.now(),
  });
}
